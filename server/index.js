import './env.js';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { UI_TEXTS, UI_TEXT_DEFAULTS } from './ui-texts.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { init, q, one, tx } from './db.js';
import { validateProfile, validateContact, displayName } from './profile.js';

try {
  await init();
} catch (e) {
  console.error(`Could not connect to MySQL (${e.code || e.message}). Check DB_HOST / DB_USER / DB_PASSWORD and that MySQL is running.`);
  process.exit(1);
}

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const app = express();
app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const sign = (u) => jwt.sign({ id: u.id, role: u.role }, SECRET, { expiresIn: '7d' });
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });

const auth = wrap(async (req, res, next) => {
  let user;
  try {
    const p = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), SECRET);
    user = await one('SELECT * FROM users WHERE id=?', [p.id]);
  } catch { /* fall through */ }
  if (!user) return res.status(401).json({ error: 'Please log in' });
  req.user = user;
  next();
});
const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' });

// ---------- public website ----------
const parsePage = (p) => ({ ...p, show_in_nav: !!p.show_in_nav, published: !!p.published, sections: JSON.parse(p.sections || '[]') });

app.get('/api/site', wrap(async (req, res) => {
  const settings = Object.fromEntries((await q('SELECT `key`,value FROM settings')).map((r) => [r.key, r.value]));
  const nav = await q('SELECT slug,title,nav_group FROM pages WHERE published=1 AND show_in_nav=1 ORDER BY nav_order, id');
  res.json({ settings, nav, texts: await getTexts() });
}));

app.get('/api/pages/:slug', wrap(async (req, res) => {
  const p = await one('SELECT * FROM pages WHERE slug=? AND published=1', [req.params.slug]);
  if (!p) throw bad('Page not found', 404);
  res.json(parsePage(p));
}));

app.post('/api/contact', wrap(async (req, res) => {
  const { errors, data } = validateContact(req.body);
  if (Object.keys(errors).length) throw Object.assign(bad(Object.values(errors)[0]), { fields: errors });
  await q('INSERT INTO contact_messages (name,phone,email,message) VALUES (?,?,?,?)', [data.name, data.phone, data.email, data.message]);
  res.json({ ok: true });
}));

// ---------- auth ----------
app.post('/api/auth/register', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email?.trim() || !password || password.length < 6) throw bad('Email and a password of 6+ characters are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) throw bad('Enter a valid email address');
  const { errors, profile } = validateProfile(req.body);
  if (Object.keys(errors).length) throw Object.assign(bad(Object.values(errors)[0]), { fields: errors });
  const e = email.trim().toLowerCase();
  if (await one('SELECT 1 AS x FROM users WHERE email=?', [e])) throw bad('Email already registered', 409);
  const r = await q('INSERT INTO users (name,email,password_hash,profile) VALUES (?,?,?,?)', [displayName(profile), e, bcrypt.hashSync(password, 10), JSON.stringify(profile)]);
  const user = await one('SELECT * FROM users WHERE id=?', [r.insertId]);
  res.json({ token: sign(user), user: publicUser(user) });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await one('SELECT * FROM users WHERE email=?', [(email || '').trim().toLowerCase()]);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) throw bad('Invalid email or password', 401);
  res.json({ token: sign(user), user: publicUser(user) });
}));

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

// ---------- visitor flow ----------
async function loadQuestions(onlyActive) {
  const qs = await q(`SELECT * FROM questions ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  const opts = await q('SELECT * FROM options ORDER BY sort_order, id');
  return qs.map((x) => ({ ...x, active: !!x.active, options: opts.filter((o) => o.question_id === x.id) }));
}

app.get('/api/questions', auth, wrap(async (req, res) => res.json(await loadQuestions(true))));

// ---------- plans: a customer can keep several; planning routes work on one plan chosen by the X-Plan-Id header ----------
const planAuth = wrap(async (req, res, next) => {
  const id = +req.headers['x-plan-id'];
  const plan = id ? await one('SELECT * FROM plans WHERE id=?', [id]) : null;
  // admins may open any customer's plan (to look at it or edit it for them); customers only their own
  if (!plan || (plan.user_id !== req.user.id && req.user.role !== 'admin')) return res.status(404).json({ error: 'Plan not found' });
  req.plan = plan;
  if (req.method !== 'GET') res.on('finish', () => { if (res.statusCode < 400) q('UPDATE plans SET updated_at=NOW() WHERE id=?', [plan.id]).catch(() => {}); });
  next();
});
app.use(['/api/answers', '/api/cart', '/api/review', '/api/arrangement', '/api/estimates', '/api/payments', '/api/consultations'], auth, planAuth);

async function planSummary(p) {
  const cart = await getCart(p.id);
  return { id: p.id, name: p.name, archived: !!p.archived, created_at: p.created_at, updated_at: p.updated_at,
    total: cart ? cart.total : 0, items: cart ? cart.sections.length : 0, confirmed_at: cart?.confirmed_at || null };
}
async function ownPlan(req, id) {
  const p = await one('SELECT p.*, u.name AS owner_name, u.email AS owner_email FROM plans p JOIN users u ON u.id=p.user_id WHERE p.id=?', [id]);
  if (!p || (p.user_id !== req.user.id && req.user.role !== 'admin')) throw bad('Plan not found', 404);
  return p;
}
const planName = (v) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, 255);

app.get('/api/plans', auth, wrap(async (req, res) => {
  const rows = await q('SELECT * FROM plans WHERE user_id=? AND archived=0 ORDER BY updated_at DESC, id DESC', [req.user.id]);
  res.json(await Promise.all(rows.map(planSummary)));
}));

app.post('/api/plans', auth, wrap(async (req, res) => {
  const n = (await one('SELECT COUNT(*) AS n FROM plans WHERE user_id=? AND archived=0', [req.user.id])).n;
  if (n >= 20) throw bad('You can keep up to 20 plans. Please delete one before adding another.');
  const r = await q('INSERT INTO plans (user_id,name) VALUES (?,?)', [req.user.id, planName(req.body?.name) || `Plan ${n + 1}`]);
  res.json(await planSummary(await one('SELECT * FROM plans WHERE id=?', [r.insertId])));
}));

app.get('/api/plans/:id', auth, wrap(async (req, res) => {
  const p = await ownPlan(req, +req.params.id);
  res.json({ ...(await planSummary(p)), user_id: p.user_id, owner_name: p.owner_name, owner_email: p.owner_email });
}));

app.put('/api/plans/:id', auth, wrap(async (req, res) => {
  const p = await ownPlan(req, +req.params.id);
  const name = planName(req.body?.name);
  if (!name) throw bad('Please enter a name for the plan');
  await q('UPDATE plans SET name=? WHERE id=?', [name, p.id]);
  res.json(await planSummary(await one('SELECT * FROM plans WHERE id=?', [p.id])));
}));

app.delete('/api/plans/:id', auth, wrap(async (req, res) => {
  const p = await ownPlan(req, +req.params.id);
  await q('DELETE FROM plans WHERE id=?', [p.id]);
  res.json({ ok: true });
}));

// Copy a plan (all selections, not the confirmation) so a family can compare variations.
app.post('/api/plans/:id/duplicate', auth, wrap(async (req, res) => {
  const p = await ownPlan(req, +req.params.id);
  const n = (await one('SELECT COUNT(*) AS n FROM plans WHERE user_id=? AND archived=0', [p.user_id])).n;
  if (n >= 20) throw bad('You can keep up to 20 plans. Please delete one before adding another.');
  const copy = [
    ['carts', 'package_id,package_name,line_items,total,visitation_id,visit_name,visit_lines,visit_total,embalming'],
    ['cart_choices', 'screen_id,option_id,screen_name,option_name,detail,fee,sort_order,skipped'],
    ['cart_ceremony', 'ceremony_id,name,line_items,addons,total,sort_order'],
    ['cart_extras', 'screen_id,screen_name,line_items,selection,total,sort_order,skipped'],
    ['cart_qty', 'screen_id,screen_name,qty,line_items,total,sort_order'],
    ['answers', 'question_id,option_id,question_text,option_label,created_at,kind'],
  ];
  const nid = await tx(async (c) => {
    const id = (await q('INSERT INTO plans (user_id,name) VALUES (?,?)', [p.user_id, `${p.name} (copy)`.slice(0, 255)], c)).insertId;
    for (const [t, cols] of copy) await q(`INSERT INTO ${t} (plan_id,${cols}) SELECT ?,${cols} FROM ${t} WHERE plan_id=?`, [id, p.id], c);
    return id;
  });
  res.json(await planSummary(await one('SELECT * FROM plans WHERE id=?', [nid])));
}));

app.get('/api/answers/mine', auth, wrap(async (req, res) =>
  res.json(await q('SELECT question_id, option_id FROM answers WHERE plan_id=?', [req.plan.id]))));

app.post('/api/answers', auth, wrap(async (req, res) => {
  const { question_id, option_ids } = req.body || {};
  const ques = await one('SELECT * FROM questions WHERE id=? AND active=1', [question_id]);
  if (!ques) throw bad('Question not found', 404);
  const ids = [...new Set(Array.isArray(option_ids) ? option_ids : [])];
  if (!ids.length || (ques.type === 'single' && ids.length > 1)) throw bad('Please choose an option');
  const chosen = await Promise.all(ids.map((id) => one('SELECT * FROM options WHERE id=? AND question_id=?', [id, ques.id])));
  if (chosen.some((o) => !o)) throw bad('Invalid option');
  await tx(async (c) => {
    await q('DELETE FROM answers WHERE plan_id=? AND question_id=?', [req.plan.id, ques.id], c);
    for (const o of chosen)
      await q('INSERT INTO answers (plan_id,question_id,option_id,question_text,option_label) VALUES (?,?,?,?,?)',
        [req.plan.id, ques.id, o.id, ques.title, o.label], c);
  });
  res.json({ ok: true });
}));

// ---------- admin ----------
const admin = express.Router();
app.use('/api/admin', auth, adminOnly, admin);

admin.get('/questions', wrap(async (req, res) => res.json(await loadQuestions(false))));

async function saveQuestion(id, body) {
  const { title, subtitle = '', type = 'single', sort_order = 0, active = true, options = [] } = body || {};
  if (!title?.trim()) throw bad('Question text is required');
  const clean = options.filter((o) => o.label?.trim());
  if (!clean.length) throw bad('At least one option is required');
  const t = type === 'multi' ? 'multi' : 'single';
  return tx(async (c) => {
    let qid = id;
    if (id) {
      await q('UPDATE questions SET title=?,subtitle=?,type=?,sort_order=?,active=? WHERE id=?',
        [title.trim(), subtitle, t, +sort_order || 0, active ? 1 : 0, id], c);
    } else {
      qid = (await q('INSERT INTO questions (title,subtitle,type,sort_order,active) VALUES (?,?,?,?,?)',
        [title.trim(), subtitle, t, +sort_order || 0, active ? 1 : 0], c)).insertId;
    }
    const existing = (await q('SELECT id FROM options WHERE question_id=?', [qid], c)).map((r) => r.id);
    const keep = clean.filter((o) => existing.includes(+o.id)).map((o) => +o.id);
    for (const x of existing.filter((x) => !keep.includes(x))) await q('DELETE FROM options WHERE id=?', [x], c);
    for (const [i, o] of clean.entries()) {
      if (keep.includes(+o.id))
        await q('UPDATE options SET label=?,description=?,examples=?,sort_order=? WHERE id=?', [o.label.trim(), o.description || '', o.examples || '', i + 1, o.id], c);
      else
        await q('INSERT INTO options (question_id,label,description,examples,sort_order) VALUES (?,?,?,?,?)', [qid, o.label.trim(), o.description || '', o.examples || '', i + 1], c);
    }
    return qid;
  });
}

admin.post('/questions', wrap(async (req, res) => res.json({ id: await saveQuestion(null, req.body) })));
admin.put('/questions/:id', wrap(async (req, res) => res.json({ id: await saveQuestion(+req.params.id, req.body) })));
admin.delete('/questions/:id', wrap(async (req, res) => {
  await q('DELETE FROM questions WHERE id=?', [+req.params.id]);
  res.json({ ok: true });
}));

// ---------- admin: customers, their plans (with the full selection summary) and the sidebar screen list ----------
const customerFields = (b = {}, existing) => {
  const name = String(b.name ?? existing?.name ?? '').trim();
  const email = String(b.email ?? existing?.email ?? '').trim().toLowerCase();
  const role = b.role === 'admin' ? 'admin' : b.role === 'user' ? 'user' : existing?.role || 'user';
  if (!name) throw bad('Name is required');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw bad('Please enter a valid email address');
  if (b.password && String(b.password).length < 6) throw bad('Password must be at least 6 characters');
  return { name, email, role, password: b.password ? String(b.password) : '' };
};

admin.get('/customers', wrap(async (req, res) => res.json(await q(`
  SELECT u.id, u.name, u.email, u.role, u.created_at,
         COUNT(DISTINCT p.id) AS plans, MAX(p.updated_at) AS last_activity,
         COUNT(DISTINCT CASE WHEN r.confirmed_at IS NOT NULL THEN p.id END) AS confirmed_plans
  FROM users u LEFT JOIN plans p ON p.user_id=u.id AND p.archived=0 LEFT JOIN arrangements r ON r.plan_id=p.id
  GROUP BY u.id ORDER BY u.created_at DESC, u.id DESC`))));

admin.post('/customers', wrap(async (req, res) => {
  const f = customerFields(req.body);
  if (f.password.length < 6) throw bad('Password must be at least 6 characters');
  if (await one('SELECT 1 AS x FROM users WHERE email=?', [f.email])) throw bad('That email is already registered', 409);
  const r = await q('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', [f.name, f.email, bcrypt.hashSync(f.password, 10), f.role]);
  res.json({ id: r.insertId });
}));

admin.put('/customers/:id', wrap(async (req, res) => {
  const id = +req.params.id;
  const cur = await one('SELECT * FROM users WHERE id=?', [id]);
  if (!cur) throw bad('Customer not found', 404);
  const f = customerFields(req.body, cur);
  if (id === req.user.id && f.role !== 'admin') throw bad('You cannot remove your own admin access');
  if (await one('SELECT 1 AS x FROM users WHERE email=? AND id<>?', [f.email, id])) throw bad('That email is already registered', 409);
  await q('UPDATE users SET name=?, email=?, role=? WHERE id=?', [f.name, f.email, f.role, id]);
  if (f.password) await q('UPDATE users SET password_hash=? WHERE id=?', [bcrypt.hashSync(f.password, 10), id]);
  res.json({ ok: true });
}));

admin.delete('/customers/:id', wrap(async (req, res) => {
  const id = +req.params.id;
  const cur = await one('SELECT * FROM users WHERE id=?', [id]);
  if (!cur) throw bad('Customer not found', 404);
  if (id === req.user.id) throw bad('You cannot delete your own account');
  if (cur.role === 'admin' && (await one("SELECT COUNT(*) AS n FROM users WHERE role='admin'")).n <= 1) throw bad('You cannot delete the last admin');
  await q('DELETE FROM users WHERE id=?', [id]); // their plans and selections go with them
  res.json({ ok: true });
}));

admin.get('/customers/:id', wrap(async (req, res) => {
  const user = await one('SELECT id,name,email,role,created_at,profile FROM users WHERE id=?', [+req.params.id]);
  if (!user) throw bad('Customer not found', 404);
  user.profile = user.profile ? JSON.parse(user.profile) : null;
  const rows = await q('SELECT * FROM plans WHERE user_id=? ORDER BY archived, updated_at DESC, id DESC', [user.id]);
  res.json({ user, plans: await Promise.all(rows.map(planSummary)) });
}));

// Everything one plan holds: the customer's answers and the grouped summary with costs and the estimated total.
admin.get('/plans/:id', wrap(async (req, res) => {
  const plan = await one('SELECT p.*, u.name AS owner_name, u.email AS owner_email FROM plans p JOIN users u ON u.id=p.user_id WHERE p.id=?', [+req.params.id]);
  if (!plan) throw bad('Plan not found', 404);
  const answers = await q('SELECT question_text,option_label,created_at FROM answers WHERE plan_id=? ORDER BY created_at, id', [plan.id]);
  const payments = (await q('SELECT id,amount,currency,mode,status,created_at,paid_at FROM payments WHERE plan_id=? ORDER BY id DESC', [plan.id])).map((p) => ({ ...p, amount: money(p.amount) }));
  res.json({ plan: { id: plan.id, name: plan.name, archived: !!plan.archived, created_at: plan.created_at, updated_at: plan.updated_at }, owner: { id: plan.user_id, name: plan.owner_name, email: plan.owner_email }, answers, summary: await buildReview(plan.id), payments });
}));

admin.put('/plans/:id', wrap(async (req, res) => {
  const name = planName(req.body?.name);
  if (!name) throw bad('Please enter a name for the plan');
  await q('UPDATE plans SET name=?, archived=? WHERE id=?', [name, req.body?.archived ? 1 : 0, +req.params.id]);
  res.json({ ok: true });
}));
admin.delete('/plans/:id', wrap(async (req, res) => { await q('DELETE FROM plans WHERE id=?', [+req.params.id]); res.json({ ok: true }); }));

// Sidebar: one simple link per customer screen, in the order customers see them.
admin.get('/nav', wrap(async (req, res) => {
  const cfg = await ceremonyCfg();
  const items = [
    { sort: 1, number: '1–2', label: 'Planning questions', to: '/admin/questions' },
    { sort: 3, number: '3', label: 'Packages', to: '/admin/packages' },
    { sort: 3.5, number: '', label: 'Casket services & fees', to: '/admin/services', sub: true },
    { sort: 4, number: '4', label: 'Visitation', to: '/admin/visitation' },
  ];
  for (const s of await q('SELECT id,name,sort_order FROM choice_screens ORDER BY sort_order,id')) items.push({ sort: s.sort_order, number: String(s.sort_order), label: s.name, to: `/admin/choices?screen=${s.id}` });
  items.push({ sort: cfg.order, number: String(cfg.order), label: 'Funeral ceremony types', to: '/admin/ceremony' });
  for (const s of await q('SELECT id,name,sort_order FROM extras_screens ORDER BY sort_order,id')) items.push({ sort: s.sort_order, number: String(s.sort_order), label: s.name, to: `/admin/extras?screen=${s.id}` });
  for (const s of await q('SELECT id,name,sort_order FROM qty_screens ORDER BY sort_order,id')) items.push({ sort: s.sort_order, number: String(s.sort_order), label: s.name, to: `/admin/qty?screen=${s.id}` });
  res.json(items.sort((a, b) => a.sort - b.sort));
}));

// pages + site content
const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
async function savePage(id, b = {}) {
  const slug = slugify(b.slug || b.title);
  if (!b.title?.trim() || !slug) throw bad('Title is required');
  const sections = (Array.isArray(b.sections) ? b.sections : [])
    .map((s) => ({ heading: String(s.heading || '').trim(), body: String(s.body || ''), layout: String(s.layout || 'text'), image: String(s.image || '').trim(), icon: String(s.icon || '') }))
    .filter((s) => s.heading || s.body.trim());
  const vals = [slug, b.title.trim(), (b.nav_group || '').trim(), +b.nav_order || 0, b.show_in_nav ? 1 : 0, b.published ? 1 : 0,
    b.hero_title || '', b.hero_subtitle || '', JSON.stringify(sections), String(b.hero_image || '').trim()];
  try {
    if (id) {
      await q('UPDATE pages SET slug=?,title=?,nav_group=?,nav_order=?,show_in_nav=?,published=?,hero_title=?,hero_subtitle=?,sections=?,hero_image=? WHERE id=?', [...vals, id]);
      return id;
    }
    return (await q('INSERT INTO pages (slug,title,nav_group,nav_order,show_in_nav,published,hero_title,hero_subtitle,sections,hero_image) VALUES (?,?,?,?,?,?,?,?,?,?)', vals)).insertId;
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw bad('Another page already uses that URL');
    throw e;
  }
}
admin.get('/pages', wrap(async (req, res) => res.json((await q('SELECT * FROM pages ORDER BY nav_group, nav_order, id')).map(parsePage))));
admin.post('/pages', wrap(async (req, res) => res.json({ id: await savePage(null, req.body) })));
admin.put('/pages/:id', wrap(async (req, res) => res.json({ id: await savePage(+req.params.id, req.body) })));
admin.delete('/pages/:id', wrap(async (req, res) => {
  const p = await one('SELECT slug FROM pages WHERE id=?', [+req.params.id]);
  if (p?.slug === 'home') throw bad('The home page cannot be deleted');
  await q('DELETE FROM pages WHERE id=?', [+req.params.id]);
  res.json({ ok: true });
}));
admin.get('/settings', wrap(async (req, res) =>
  res.json(Object.fromEntries((await q('SELECT `key`,value FROM settings')).map((r) => [r.key, r.value])))));
admin.put('/settings', wrap(async (req, res) => {
  for (const [k, v] of Object.entries(req.body || {}))
    await q('INSERT INTO settings (`key`,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)', [k, String(v)]);
  res.json({ ok: true });
}));
admin.get('/messages', wrap(async (req, res) => res.json(await q('SELECT * FROM contact_messages ORDER BY id DESC'))));
admin.delete('/messages/:id', wrap(async (req, res) => { await q('DELETE FROM contact_messages WHERE id=?', [+req.params.id]); res.json({ ok: true }); }));

// ---------- packages, services, cart ----------
const money = (n) => Math.round((+n || 0) * 100) / 100;
const fee = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw bad('Fees must be a number of 0 or more');
  return money(n);
};

// Active packages with their included (active) services and the computed total.
async function loadPackages(onlyActive) {
  const pks = await q(`SELECT * FROM packages ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  const links = await q('SELECT package_id, service_id, fee FROM package_services');
  const svcs = await q('SELECT * FROM services ORDER BY sort_order, id');
  return pks.map((p) => {
    const pfee = money(p.fee);
    const included = svcs.filter((s) => links.some((x) => x.package_id === p.id && x.service_id === s.id));
    const counted = included.filter((s) => s.active);
    return {
      ...p, fee: pfee, active: !!p.active,
      included: included.map((s) => ({ id: s.id })),
      services: counted.map((s) => ({ id: s.id, name: s.name })),
      // Customer-facing: one line, the package fee the admin entered.
      lines: [{ label: p.name, fee: pfee }],
      total: pfee,
    };
  });
}

// Cart = package section + visitation section (each a snapshot); total is their sum.
function cartOut(c, choices = [], cer = null, extras = [], qtys = []) {
  // `order` = the screen number, so sections always list in screen order.
  const sections = [];
  if (c.package_name) sections.push({ key: 'package', kind: 'package', order: 3, title: c.package_name, lines: JSON.parse(c.line_items || '[]') });
  if (c.visit_name) {
    const note = c.embalming ? ` (embalming: ${c.embalming === 'yes' ? 'Yes' : 'No'})` : '';
    sections.push({ key: 'visitation', kind: 'visitation', order: 4, title: c.visit_name + note, lines: JSON.parse(c.visit_lines || '[]') });
  }
  for (const x of choices.filter((r) => !r.skipped))
    sections.push({ key: `choice-${x.screen_id}`, kind: 'choice', order: x.sort_order, screen_id: x.screen_id, title: x.screen_name, lines: [{ label: x.detail ? `${x.option_name}: ${x.detail}` : x.option_name, fee: money(x.fee) }] });
  if (cer) sections.push({ key: 'ceremony', kind: 'ceremony', order: cer.sort_order, title: cer.name, lines: JSON.parse(cer.line_items || '[]') });
  for (const x of extras.filter((r) => !r.skipped))
    sections.push({ key: `extras-${x.screen_id}`, kind: 'extras', order: x.sort_order, screen_id: x.screen_id, title: x.screen_name, lines: JSON.parse(x.line_items || '[]') });
  for (const x of qtys)
    sections.push({ key: `qty-${x.screen_id}`, kind: 'qty', order: x.sort_order, screen_id: x.screen_id, title: x.screen_name, lines: JSON.parse(x.line_items || '[]') });
  sections.sort((p, q2) => p.order - q2.order);
  const extra = choices.reduce((t, x) => t + +x.fee, 0) + (cer ? +cer.total : 0) + extras.reduce((t, x) => t + +x.total, 0) + qtys.reduce((t, x) => t + +x.total, 0);
  return {
    package_id: c.package_id, visitation_id: c.visitation_id, embalming: c.embalming, sections,
    choices: Object.fromEntries(choices.filter((r) => !r.skipped).map((x) => [x.screen_id, x.option_id])),
    choiceDetails: Object.fromEntries(choices.filter((r) => !r.skipped && r.detail).map((x) => [x.screen_id, x.detail])),
    skipped: choices.filter((r) => r.skipped).map((x) => x.screen_id),
    ceremony: cer ? { ceremony_id: cer.ceremony_id, addons: JSON.parse(cer.addons || '[]') } : null,
    extras: Object.fromEntries(extras.map((x) => [x.screen_id, JSON.parse(x.selection || '[]')])),
    qty: Object.fromEntries(qtys.map((x) => [x.screen_id, x.qty])),
    total: money(+c.total + +c.visit_total + extra),
  };
}

async function getCart(uid) {
  const row = await one('SELECT * FROM carts WHERE plan_id=?', [uid]);
  const choices = await q('SELECT * FROM cart_choices WHERE plan_id=? ORDER BY sort_order, screen_id', [uid]);
  const cer = await one('SELECT * FROM cart_ceremony WHERE plan_id=?', [uid]);
  const extras = await q('SELECT * FROM cart_extras WHERE plan_id=? ORDER BY sort_order, screen_id', [uid]);
  const qtys = await q('SELECT * FROM cart_qty WHERE plan_id=? ORDER BY sort_order, screen_id', [uid]);
  if (!row && !choices.length && !cer && !extras.length && !qtys.length) return null;
  const out = cartOut(row || { package_name: '', visit_name: '', total: 0, visit_total: 0 }, choices, cer, extras, qtys);
  const arr = await one('SELECT confirmed_at,total FROM arrangements WHERE plan_id=?', [uid]);
  out.confirmed_at = arr && money(arr.total) === out.total ? arr.confirmed_at : null;
  return out;
}

app.get('/api/packages', auth, wrap(async (req, res) => {
  const t = await one("SELECT value FROM settings WHERE `key`='screen3_title'");
  res.json({ title: t?.value || 'Choose a package', packages: await loadPackages(true) });
}));

app.get('/api/cart', auth, wrap(async (req, res) =>
  res.json({ cart: await getCart(req.plan.id) })));

app.post('/api/cart', auth, wrap(async (req, res) => {
  const pk = (await loadPackages(true)).find((p) => p.id === +req.body?.package_id);
  if (!pk) throw bad('Please choose a package');
  const lines = pk.lines;
  const title = (await one("SELECT value FROM settings WHERE `key`='screen3_title'"))?.value || 'Package';
  await tx(async (c) => {
    await q(`INSERT INTO carts (plan_id,package_id,package_name,line_items,total) VALUES (?,?,?,?,?)
      ON DUPLICATE KEY UPDATE package_id=VALUES(package_id),package_name=VALUES(package_name),line_items=VALUES(line_items),total=VALUES(total)`,
      [req.plan.id, pk.id, pk.name, JSON.stringify(lines), pk.total], c);
    // Record the choice with the other answers so it shows user-wise in the admin Submissions view.
    await q("DELETE FROM answers WHERE plan_id=? AND kind='package'", [req.plan.id], c);
    await q("INSERT INTO answers (plan_id,question_id,option_id,question_text,option_label,kind) VALUES (?,NULL,?,?,?,'package')", [req.plan.id, pk.id, title, pk.name], c);
  });
  res.json({ cart: await getCart(req.plan.id) });
}));

// ---------- visitation ----------
// Each visitation type has service rules: applies = 'always' | 'yes' | 'no' (the embalming follow-up answer).
async function loadVisitation(onlyActive) {
  const types = await q(`SELECT * FROM visitation_types ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  const rules = await q(`SELECT vs.id, vs.visitation_id, vs.service_id, vs.applies, vs.fee, s.name, s.active AS service_active
    FROM visitation_services vs JOIN services s ON s.id=vs.service_id ORDER BY s.sort_order, s.id`);
  return types.map((t) => {
    const mine = rules.filter((r) => r.visitation_id === t.id)
      .map((r) => ({ service_id: r.service_id, name: r.name, applies: r.applies, fee: money(r.fee), active: !!r.service_active }));
    return { ...t, active: !!t.active, rules: onlyActive ? mine.filter((r) => r.active) : mine };
  });
}
const visLines = (t, embalming) => t.rules.filter((r) => r.applies === 'always' || r.applies === embalming).map((r) => ({ label: r.name, fee: r.fee }));

app.get('/api/visitation', auth, wrap(async (req, res) => {
  const t = await one("SELECT value FROM settings WHERE `key`='screen4_title'");
  res.json({ title: t?.value || 'Will There Be A Visitation?', types: await loadVisitation(true) });
}));

app.post('/api/cart/visitation', auth, wrap(async (req, res) => {
  const t = (await loadVisitation(true)).find((x) => x.id === +req.body?.visitation_id);
  if (!t) throw bad('Please choose a visitation option');
  let emb = null;
  if (t.followup_title) {
    emb = req.body?.embalming;
    if (emb !== 'yes' && emb !== 'no') throw bad('Please answer the embalming question');
  }
  const lines = visLines(t, emb);
  const total = money(lines.reduce((s, l) => s + l.fee, 0));
  const title = (await one("SELECT value FROM settings WHERE `key`='screen4_title'"))?.value || 'Visitation';
  await tx(async (c) => {
    await q(`INSERT INTO carts (plan_id,package_id,package_name,line_items,total,visitation_id,visit_name,visit_lines,visit_total,embalming)
      VALUES (?,NULL,'','[]',0,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE visitation_id=VALUES(visitation_id),visit_name=VALUES(visit_name),visit_lines=VALUES(visit_lines),visit_total=VALUES(visit_total),embalming=VALUES(embalming)`,
      [req.plan.id, t.id, t.name, JSON.stringify(lines), total, emb], c);
    await q("DELETE FROM answers WHERE plan_id=? AND kind='visitation'", [req.plan.id], c);
    const ins = "INSERT INTO answers (plan_id,question_id,option_id,question_text,option_label,kind) VALUES (?,NULL,?,?,?,'visitation')";
    await q(ins, [req.plan.id, t.id, title, t.name], c);
    if (emb) await q(ins, [req.plan.id, t.id, t.followup_title, emb === 'yes' ? 'Yes' : 'No'], c);
  });
  res.json({ cart: await getCart(req.plan.id) });
}));

async function saveVisitation(id, b = {}) {
  if (!b.name?.trim()) throw bad('Name is required');
  const rules = (Array.isArray(b.rules) ? b.rules : []).map((r) => ({ service_id: Number(r.service_id), applies: r.applies, fee: fee(r.fee) }));
  const followup = (b.followup_title || '').trim();
  for (const r of rules) {
    if (!['always', 'yes', 'no'].includes(r.applies)) throw bad('Invalid service rule');
    if (r.applies !== 'always' && !followup) throw bad('Add a follow-up question before assigning services to its Yes / No answers');
  }
  const vals = [b.name.trim(), b.description || '', b.examples || '', followup, b.active ? 1 : 0, +b.sort_order || 0];
  return tx(async (c) => {
    let vid = id;
    if (id) await q('UPDATE visitation_types SET name=?,description=?,examples=?,followup_title=?,active=?,sort_order=? WHERE id=?', [...vals, id], c);
    else vid = (await q('INSERT INTO visitation_types (name,description,examples,followup_title,active,sort_order) VALUES (?,?,?,?,?,?)', vals, c)).insertId;
    await q('DELETE FROM visitation_services WHERE visitation_id=?', [vid], c);
    for (const r of rules)
      await q('INSERT INTO visitation_services (visitation_id,service_id,applies,fee) SELECT ?, id, ?, ? FROM services WHERE id=?', [vid, r.applies, r.fee, r.service_id], c);
    return vid;
  });
}
admin.get('/visitation', wrap(async (req, res) => res.json(await loadVisitation(false))));
admin.post('/visitation', wrap(async (req, res) => res.json({ id: await saveVisitation(null, req.body) })));
admin.put('/visitation/:id', wrap(async (req, res) => res.json({ id: await saveVisitation(+req.params.id, req.body) })));
admin.delete('/visitation/:id', wrap(async (req, res) => { await q('DELETE FROM visitation_types WHERE id=?', [+req.params.id]); res.json({ ok: true }); }));

admin.get('/services', wrap(async (req, res) =>
  res.json((await q('SELECT * FROM services ORDER BY sort_order, id')).map((s) => ({ ...s, fee: +s.fee, active: !!s.active })))));
admin.post('/services', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.name?.trim()) throw bad('Service name is required');
  const r = await q('INSERT INTO services (name,description,fee,active,sort_order) VALUES (?,?,?,?,?)',
    [b.name.trim(), b.description || '', fee(b.fee), b.active === false ? 0 : 1, +b.sort_order || 0]);
  res.json({ id: r.insertId });
}));
admin.put('/services/:id', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.name?.trim()) throw bad('Service name is required');
  await q('UPDATE services SET name=?,description=?,fee=?,active=?,sort_order=? WHERE id=?',
    [b.name.trim(), b.description || '', fee(b.fee), b.active ? 1 : 0, +b.sort_order || 0, +req.params.id]);
  res.json({ ok: true });
}));
admin.delete('/services/:id', wrap(async (req, res) => {
  await q('DELETE FROM services WHERE id=?', [+req.params.id]);
  res.json({ ok: true });
}));

async function savePackage(id, b = {}) {
  if (!b.name?.trim()) throw bad('Package name is required');
  const pfee = fee(b.fee);
  // services: [{ id }] - which services the package includes (no per-service fees).
  const svc = new Set((Array.isArray(b.services) ? b.services : []).map((s) => Number(s.id)));
  const vals = [b.name.trim(), b.tag || '', b.description || '', b.schedule || '', b.note || '', pfee, b.active ? 1 : 0, +b.sort_order || 0];
  return tx(async (c) => {
    let pid = id;
    if (id) await q('UPDATE packages SET name=?,tag=?,description=?,schedule=?,note=?,fee=?,active=?,sort_order=? WHERE id=?', [...vals, id], c);
    else pid = (await q('INSERT INTO packages (name,tag,description,schedule,note,fee,active,sort_order) VALUES (?,?,?,?,?,?,?,?)', vals, c)).insertId;
    await q('DELETE FROM package_services WHERE package_id=?', [pid], c);
    for (const sid of svc)
      await q('INSERT INTO package_services (package_id,service_id,fee) SELECT ?, id, 0 FROM services WHERE id=?', [pid, sid], c);
    return pid;
  });
}
admin.get('/packages', wrap(async (req, res) => res.json(await loadPackages(false))));
admin.post('/packages', wrap(async (req, res) => res.json({ id: await savePackage(null, req.body) })));
admin.put('/packages/:id', wrap(async (req, res) => res.json({ id: await savePackage(+req.params.id, req.body) })));
admin.delete('/packages/:id', wrap(async (req, res) => {
  await q('DELETE FROM packages WHERE id=?', [+req.params.id]);
  res.json({ ok: true });
}));

// ---------- choice screens (single priced choice per screen, e.g. Rosary / Prayer service) ----------
async function loadChoices(onlyActive) {
  const screens = await q(`SELECT * FROM choice_screens ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  const opts = await q(`SELECT * FROM choice_options ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  return screens
    .map((s) => ({
      ...s, active: !!s.active, skippable: !!s.skippable,
      options: opts.filter((o) => o.screen_id === s.id).map((o) => ({ ...o, fee: money(o.fee), active: !!o.active, ask_detail: !!o.ask_detail })),
    }))
    .filter((s) => !onlyActive || s.options.length);
}

app.get('/api/choices', auth, wrap(async (req, res) => res.json(await loadChoices(true))));

app.post('/api/cart/choice', auth, wrap(async (req, res) => {
  const screen = (await loadChoices(true)).find((s) => s.id === +req.body?.screen_id);
  if (screen && req.body?.skip) {
    if (!screen.skippable) throw bad('This step cannot be skipped');
    const kind = `choice-${screen.id}`;
    await tx(async (c) => {
      await q(`INSERT INTO cart_choices (plan_id,screen_id,option_id,screen_name,option_name,fee,sort_order,skipped) VALUES (?,?,NULL,?,'',0,?,1)
        ON DUPLICATE KEY UPDATE option_id=NULL,screen_name=VALUES(screen_name),option_name='',fee=0,sort_order=VALUES(sort_order),skipped=1`,
        [req.plan.id, screen.id, screen.name, screen.sort_order], c);
      await q('DELETE FROM answers WHERE plan_id=? AND kind=?', [req.plan.id, kind], c);
      await q('INSERT INTO answers (plan_id,question_id,option_id,question_text,option_label,kind) VALUES (?,NULL,NULL,?,?,?)', [req.plan.id, screen.title, 'Skipped', kind], c);
    });
    return res.json({ cart: await getCart(req.plan.id) });
  }
  const opt = screen?.options.find((o) => o.id === +req.body?.option_id);
  if (!screen || !opt) throw bad('Please choose an option');
  const kind = `choice-${screen.id}`;
  const detail = opt.ask_detail ? String(req.body?.detail || '').trim().slice(0, 500) : '';
  if (opt.ask_detail && !detail) throw bad(`Please enter: ${opt.detail_label || opt.name}`);
  await tx(async (c) => {
    await q(`INSERT INTO cart_choices (plan_id,screen_id,option_id,screen_name,option_name,detail,fee,sort_order) VALUES (?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE option_id=VALUES(option_id),screen_name=VALUES(screen_name),option_name=VALUES(option_name),detail=VALUES(detail),fee=VALUES(fee),sort_order=VALUES(sort_order),skipped=0`,
      [req.plan.id, screen.id, opt.id, screen.name, opt.name, detail, opt.fee, screen.sort_order], c);
    await q('DELETE FROM answers WHERE plan_id=? AND kind=?', [req.plan.id, kind], c);
    await q('INSERT INTO answers (plan_id,question_id,option_id,question_text,option_label,kind) VALUES (?,NULL,?,?,?,?)',
      [req.plan.id, opt.id, screen.title, detail ? `${opt.name}: ${detail}` : opt.name, kind], c);
  });
  res.json({ cart: await getCart(req.plan.id) });
}));

async function saveChoiceScreen(id, b = {}) {
  if (!b.name?.trim() || !b.title?.trim()) throw bad('Name and question text are required');
  const opts = (Array.isArray(b.options) ? b.options : []).filter((o) => o.name?.trim());
  if (!opts.length) throw bad('At least one option is required');
  const clean = opts.map((o) => ({ ...o, fee: fee(o.fee) }));
  return tx(async (c) => {
    let sid = id;
    if (id) await q('UPDATE choice_screens SET name=?,title=?,intro=?,sort_order=?,active=?,skippable=? WHERE id=?', [b.name.trim(), b.title.trim(), String(b.intro || '').slice(0, 1000), +b.sort_order || 0, b.active ? 1 : 0, b.skippable ? 1 : 0, id], c);
    else sid = (await q('INSERT INTO choice_screens (name,title,intro,sort_order,active,skippable) VALUES (?,?,?,?,?,?)', [b.name.trim(), b.title.trim(), String(b.intro || '').slice(0, 1000), +b.sort_order || 0, b.active ? 1 : 0, b.skippable ? 1 : 0], c)).insertId;
    const existing = (await q('SELECT id FROM choice_options WHERE screen_id=?', [sid], c)).map((r) => r.id);
    const keep = clean.filter((o) => existing.includes(+o.id)).map((o) => +o.id);
    for (const x of existing.filter((x) => !keep.includes(x))) await q('DELETE FROM choice_options WHERE id=?', [x], c);
    for (const [i, o] of clean.entries()) {
      const v = [o.name.trim(), o.description || '', o.examples || '', (o.examples_label || '').trim() || 'Common Example', String(o.note_title || '').slice(0, 255), String(o.note || ''), o.fee, o.active === false ? 0 : 1, i + 1, o.ask_detail ? 1 : 0, String(o.detail_label || '').slice(0, 255)];
      if (keep.includes(+o.id)) await q('UPDATE choice_options SET name=?,description=?,examples=?,examples_label=?,note_title=?,note=?,fee=?,active=?,sort_order=?,ask_detail=?,detail_label=? WHERE id=?', [...v, o.id], c);
      else await q('INSERT INTO choice_options (name,description,examples,examples_label,note_title,note,fee,active,sort_order,ask_detail,detail_label,screen_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [...v, sid], c);
    }
    return sid;
  });
}
admin.get('/choices', wrap(async (req, res) => res.json(await loadChoices(false))));
admin.post('/choices', wrap(async (req, res) => res.json({ id: await saveChoiceScreen(null, req.body) })));
admin.put('/choices/:id', wrap(async (req, res) => res.json({ id: await saveChoiceScreen(+req.params.id, req.body) })));
admin.delete('/choices/:id', wrap(async (req, res) => { await q('DELETE FROM choice_screens WHERE id=?', [+req.params.id]); res.json({ ok: true }); }));

// ---------- funeral ceremony types (Screen 7) ----------
// A type either has its own fee, or (has_addons) its cost is the sum of the add-ons the customer ticks.
// Add-on kinds: 'fixed' = admin fee; 'custom' = the customer types an amount that must be at least min_amount. `note` is shown to the customer. requires_option_id = only offered when that
// choice option (e.g. "Church Or Place Of Worship" on Screen 6) is in the customer's cart.
async function loadCeremony(onlyActive) {
  const types = await q(`SELECT * FROM ceremony_types ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  const adds = await q(`SELECT * FROM ceremony_addons ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  return types.map((t) => ({
    ...t, fee: money(t.fee), active: !!t.active, has_addons: !!t.has_addons,
    addons: adds.filter((a) => a.ceremony_id === t.id).map((a) => ({ ...a, fee: money(a.fee), active: !!a.active, recommended: !!a.recommended, min_amount: money(a.min_amount) })),
  }));
}
const ceremonyCfg = async () => {
  const rows = await q("SELECT `key`,value FROM settings WHERE `key` IN ('screen7_title','screen7_order')");
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { title: m.screen7_title || 'What Type Of Funeral Ceremony Will Be Held?', order: +m.screen7_order || 7 };
};

app.get('/api/ceremony', auth, wrap(async (req, res) =>
  res.json({ ...(await ceremonyCfg()), types: await loadCeremony(true) })));

app.post('/api/cart/ceremony', auth, wrap(async (req, res) => {
  const t = (await loadCeremony(true)).find((x) => x.id === +req.body?.ceremony_id);
  if (!t) throw bad('Please choose a ceremony type');
  const inCart = (await q('SELECT option_id FROM cart_choices WHERE plan_id=?', [req.plan.id])).map((r) => r.option_id);
  const picks = [];
  if (t.has_addons) {
    for (const p of Array.isArray(req.body?.addons) ? req.body.addons : []) {
      const a = t.addons.find((x) => x.id === +p.id);
      if (!a) throw bad('Invalid option');
      if (picks.some((x) => x.a.id === a.id)) continue;
      if (a.requires_option_id && !inCart.includes(a.requires_option_id)) throw bad(`"${a.name}" is not available for your selections`);
      let amount = null;
      if (a.kind === 'custom') {
        amount = Number(p.amount);
        if (p.amount === '' || p.amount == null || !Number.isFinite(amount) || amount <= 0)
          throw bad(`Please enter an amount for "${a.name}"`);
        if (amount < a.min_amount) throw bad(`The amount for "${a.name}" must be at least $${a.min_amount.toFixed(2)}`);
        if (amount > 1000000) throw bad(`The amount for "${a.name}" is too large`);
        amount = money(amount);
      }
      picks.push({ a, amount });
    }
    // exactly one option: required whenever the customer has at least one available option to choose from
    if (picks.length > 1) throw bad('Please choose only one option');
    if (!picks.length && t.addons.some((a) => !a.requires_option_id || inCart.includes(a.requires_option_id))) throw bad('Please choose one option');
  }
  const lines = t.has_addons ? picks.map(({ a, amount }) => ({ label: a.name, fee: a.kind === 'custom' ? amount : a.fee })) : [{ label: t.name, fee: t.fee }];
  const total = money(lines.reduce((s, l) => s + l.fee, 0));
  const cfg = await ceremonyCfg();
  const snapshot = picks.map(({ a, amount }) => ({ id: a.id, amount }));
  await tx(async (c) => {
    await q(`INSERT INTO cart_ceremony (plan_id,ceremony_id,name,line_items,addons,total,sort_order) VALUES (?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE ceremony_id=VALUES(ceremony_id),name=VALUES(name),line_items=VALUES(line_items),addons=VALUES(addons),total=VALUES(total),sort_order=VALUES(sort_order)`,
      [req.plan.id, t.id, t.name, JSON.stringify(lines), JSON.stringify(snapshot), total, cfg.order], c);
    await q("DELETE FROM answers WHERE plan_id=? AND kind='ceremony'", [req.plan.id], c);
    const ins = "INSERT INTO answers (plan_id,question_id,option_id,question_text,option_label,kind) VALUES (?,NULL,?,?,?,'ceremony')";
    await q(ins, [req.plan.id, t.id, cfg.title, t.name], c);
    for (const { a, amount } of picks)
      await q(ins, [req.plan.id, a.id, `${t.name}: options`, a.kind === 'custom' ? `${a.name} (${money(amount).toFixed(2)})` : a.name], c);
  });
  res.json({ cart: await getCart(req.plan.id) });
}));

async function saveCeremony(id, b = {}) {
  if (!b.name?.trim()) throw bad('Name is required');
  const addons = (Array.isArray(b.addons) ? b.addons : []).filter((a) => a.name?.trim())
    .map((a) => {
      const custom = a.kind === 'custom';
      return { ...a, kind: custom ? 'custom' : 'fixed', fee: custom ? 0 : fee(a.fee), min: custom ? fee(a.min_amount) : 0, note: String(a.note || '').slice(0, 1000), req: a.requires_option_id ? +a.requires_option_id : null };
    });
  if (b.has_addons && !addons.length) throw bad('Add at least one option, or turn off "cost from options"');
  const vals = [b.name.trim(), b.description || '', b.examples || '', (b.examples_label || '').trim() || 'Common Example', fee(b.fee), b.has_addons ? 1 : 0, b.active ? 1 : 0, +b.sort_order || 0];
  return tx(async (c) => {
    let cid = id;
    if (id) await q('UPDATE ceremony_types SET name=?,description=?,examples=?,examples_label=?,fee=?,has_addons=?,active=?,sort_order=? WHERE id=?', [...vals, id], c);
    else cid = (await q('INSERT INTO ceremony_types (name,description,examples,examples_label,fee,has_addons,active,sort_order) VALUES (?,?,?,?,?,?,?,?)', vals, c)).insertId;
    const existing = (await q('SELECT id FROM ceremony_addons WHERE ceremony_id=?', [cid], c)).map((r) => r.id);
    const keep = addons.filter((a) => existing.includes(+a.id)).map((a) => +a.id);
    for (const x of existing.filter((x) => !keep.includes(x))) await q('DELETE FROM ceremony_addons WHERE id=?', [x], c);
    for (const [i, a] of addons.entries()) {
      const v = [a.name.trim(), a.kind, a.fee, a.min, a.note, a.req, a.recommended ? 1 : 0, a.active === false ? 0 : 1, i + 1];
      if (keep.includes(+a.id)) await q('UPDATE ceremony_addons SET name=?,kind=?,fee=?,min_amount=?,note=?,requires_option_id=?,recommended=?,active=?,sort_order=? WHERE id=?', [...v, a.id], c);
      else await q('INSERT INTO ceremony_addons (name,kind,fee,min_amount,note,requires_option_id,recommended,active,sort_order,ceremony_id) VALUES (?,?,?,?,?,?,?,?,?,?)', [...v, cid], c);
    }
    return cid;
  });
}
admin.get('/ceremony', wrap(async (req, res) => res.json({ ...(await ceremonyCfg()), types: await loadCeremony(false) })));
admin.post('/ceremony', wrap(async (req, res) => res.json({ id: await saveCeremony(null, req.body) })));
admin.put('/ceremony/:id', wrap(async (req, res) => res.json({ id: await saveCeremony(+req.params.id, req.body) })));
admin.delete('/ceremony/:id', wrap(async (req, res) => { await q('DELETE FROM ceremony_types WHERE id=?', [+req.params.id]); res.json({ ok: true }); }));

// ---------- extras screens (tick-boxes; an item can ask for a priced preference or a text answer) ----------
// kind: 'plain' = fee when ticked | 'choices' = customer picks one priced preference | 'text' = customer types a text answer, fee when ticked
async function loadExtras(onlyActive) {
  const screens = await q(`SELECT * FROM extras_screens ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  const items = await q(`SELECT * FROM extras_items ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  const choices = await q(`SELECT * FROM extras_choices ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`);
  return screens
    .map((s) => ({
      ...s, active: !!s.active, skippable: !!s.skippable,
      items: items.filter((i) => i.screen_id === s.id).map((i) => ({
        ...i, fee: money(i.fee), active: !!i.active, recommended: !!i.recommended,
        choices: choices.filter((c) => c.item_id === i.id).map((c) => ({ ...c, fee: money(c.fee), active: !!c.active, ask_note: !!c.ask_note })),
      })),
    }))
    .filter((s) => !onlyActive || s.items.length);
}

app.get('/api/extras', auth, wrap(async (req, res) => res.json(await loadExtras(true))));

app.post('/api/cart/extras', auth, wrap(async (req, res) => {
  const screen = (await loadExtras(true)).find((s) => s.id === +req.body?.screen_id);
  if (!screen) throw bad('Screen not found', 404);
  if (req.body?.skip) {
    if (!screen.skippable) throw bad('This step cannot be skipped');
    const kind = `extras-${screen.id}`;
    await tx(async (c) => {
      await q(`INSERT INTO cart_extras (plan_id,screen_id,screen_name,line_items,selection,total,sort_order,skipped) VALUES (?,?,?,'[]','[]',0,?,1)
        ON DUPLICATE KEY UPDATE screen_name=VALUES(screen_name),line_items='[]',selection='[]',total=0,sort_order=VALUES(sort_order),skipped=1`,
        [req.plan.id, screen.id, screen.name, screen.sort_order], c);
      await q('DELETE FROM answers WHERE plan_id=? AND kind=?', [req.plan.id, kind], c);
      await q('INSERT INTO answers (plan_id,question_id,option_id,question_text,option_label,kind) VALUES (?,NULL,NULL,?,?,?)', [req.plan.id, screen.title, 'Skipped', kind], c);
    });
    return res.json({ cart: await getCart(req.plan.id) });
  }
  const lines = [];
  const selection = [];
  const answers = [];
  const seen = new Set();
  for (const p of Array.isArray(req.body?.selections) ? req.body.selections : []) {
    const item = screen.items.find((i) => i.id === +p.item_id);
    if (!item) throw bad('Invalid selection');
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    if (item.kind === 'choices') {
      const ch = item.choices.find((c) => c.id === +p.choice_id);
      if (!ch) throw bad(`Please choose a ${item.sub_title || 'preference'} for "${item.name}"`);
      let note = null;
      if (ch.ask_note) {
        note = String(p.note ?? '').trim().replace(/[ \t]+/g, ' ');
        if (!note) throw bad(`Please enter ${ch.note_label ? `"${ch.note_label}"` : 'a note'} for ${ch.name}`);
        if (note.length > 500) throw bad('Your note is too long (500 characters max)');
      }
      const label = note ? `${item.name}: ${ch.name} (${ch.note_label || 'Note'}: ${note})` : `${item.name}: ${ch.name}`;
      lines.push({ label, fee: ch.fee, item_id: item.id });
      selection.push({ item_id: item.id, choice_id: ch.id, ...(note ? { note } : {}) });
      answers.push(label);
    } else if (item.kind === 'multi') {
      const ids = [...new Set((Array.isArray(p.choice_ids) ? p.choice_ids : []).map(Number))];
      const picked = ids.map((cid) => item.choices.find((c) => c.id === cid));
      if (picked.some((c) => !c)) throw bad(`Invalid option for "${item.name}"`);
      if (ids.length < item.min_select) throw bad(`Please choose at least ${item.min_select === 1 ? 'one option' : `${item.min_select} options`} for "${item.name}"`);
      if (item.max_select > 0 && ids.length > item.max_select) throw bad(`You can choose up to ${item.max_select} for "${item.name}"`);
      if (item.bundle) {
        // one cart line: base price + every chosen option
        const names = picked.map((c) => c.name);
        lines.push({ label: `${item.name} (${names.length ? `base + ${names.join(', ')}` : 'base price'})`, fee: money(item.fee + picked.reduce((t, c) => t + c.fee, 0)), item_id: item.id });
      } else {
        if (item.fee > 0) lines.push({ label: item.name, fee: item.fee, item_id: item.id });
        for (const c of picked) lines.push({ label: `${item.name}: ${c.name}`, fee: c.fee, item_id: item.id });
      }
      answers.push(item.name, ...picked.map((c) => `${item.name}: ${c.name}`));
      selection.push({ item_id: item.id, choice_ids: ids });
    } else if (item.kind === 'text') {
      const text = String(p.text ?? '').trim().replace(/\s+/g, ' ');
      if (!text) throw bad(`Please enter your ${item.text_label || 'preference'} for "${item.name}"`);
      if (text.length > 200) throw bad(`Your ${item.text_label || 'preference'} is too long (200 characters max)`);
      lines.push({ label: `${item.name} (${item.text_label || 'Preference'}: ${text})`, fee: item.fee, item_id: item.id });
      selection.push({ item_id: item.id, text });
      answers.push(`${item.name} (${item.text_label || 'Preference'}: ${text})`);
    } else {
      lines.push({ label: item.name, fee: item.fee, item_id: item.id });
      selection.push({ item_id: item.id });
      answers.push(item.name);
    }
  }
  const total = money(lines.reduce((t, l) => t + l.fee, 0));
  const kind = `extras-${screen.id}`;
  await tx(async (c) => {
    await q(`INSERT INTO cart_extras (plan_id,screen_id,screen_name,line_items,selection,total,sort_order) VALUES (?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE screen_name=VALUES(screen_name),line_items=VALUES(line_items),selection=VALUES(selection),total=VALUES(total),sort_order=VALUES(sort_order),skipped=0`,
      [req.plan.id, screen.id, screen.name, JSON.stringify(lines), JSON.stringify(selection), total, screen.sort_order], c);
    await q('DELETE FROM answers WHERE plan_id=? AND kind=?', [req.plan.id, kind], c);
    for (const label of answers.length ? answers : ['None selected'])
      await q('INSERT INTO answers (plan_id,question_id,option_id,question_text,option_label,kind) VALUES (?,NULL,NULL,?,?,?)', [req.plan.id, screen.title, label, kind], c);
  });
  res.json({ cart: await getCart(req.plan.id) });
}));

async function saveExtras(id, b = {}) {
  if (!b.name?.trim() || !b.title?.trim()) throw bad('Name and question text are required');
  const items = (Array.isArray(b.items) ? b.items : []).filter((i) => i.name?.trim());
  if (!items.length) throw bad('Add at least one item');
  const clean = items.map((i) => {
    const kind = ['choices', 'multi', 'text'].includes(i.kind) ? i.kind : 'plain';
    const choices = (kind === 'choices' || kind === 'multi') ? (Array.isArray(i.choices) ? i.choices : []).filter((c) => c.name?.trim()).map((c) => ({ ...c, fee: fee(c.fee), ask: c.ask_note ? 1 : 0, nlabel: String(c.note_label || '').slice(0, 255) })) : [];
    if ((kind === 'choices' || kind === 'multi') && !choices.length) throw bad(`"${i.name}" needs at least one option`);
    return { ...i, kind, fee: kind === 'choices' ? 0 : fee(i.fee), choices, max: kind === 'multi' ? Math.max(0, Math.trunc(Number(i.max_select)) || 0) : 0,
      min: kind === 'multi' ? (Number.isFinite(Number(i.min_select)) && i.min_select !== '' && i.min_select != null ? Math.max(0, Math.trunc(Number(i.min_select))) : 1) : 1,
      bundle: kind === 'multi' && i.bundle ? 1 : 0 };
  });
  return tx(async (c) => {
    let sid = id;
    const sv = [b.name.trim(), b.title.trim(), String(b.intro || '').slice(0, 1000), +b.sort_order || 0, b.active ? 1 : 0, b.skippable ? 1 : 0];
    if (id) await q('UPDATE extras_screens SET name=?,title=?,intro=?,sort_order=?,active=?,skippable=? WHERE id=?', [...sv, id], c);
    else sid = (await q('INSERT INTO extras_screens (name,title,intro,sort_order,active,skippable) VALUES (?,?,?,?,?,?)', sv, c)).insertId;
    const existing = (await q('SELECT id FROM extras_items WHERE screen_id=?', [sid], c)).map((r) => r.id);
    const keep = clean.filter((i) => existing.includes(+i.id)).map((i) => +i.id);
    for (const x of existing.filter((x) => !keep.includes(x))) await q('DELETE FROM extras_items WHERE id=?', [x], c);
    for (const [n, i] of clean.entries()) {
      const v = [i.name.trim(), String(i.description || ''), String(i.examples || ''), (i.examples_label || '').trim() || 'Common Example', i.kind, i.fee,
        String(i.sub_title || '').slice(0, 255), String(i.text_label || '').slice(0, 255), String(i.text_placeholder || '').slice(0, 255), i.recommended ? 1 : 0, i.active === false ? 0 : 1, n + 1, i.max, String(i.info || ''), i.min, i.bundle];
      let iid;
      if (keep.includes(+i.id)) {
        iid = +i.id;
        await q('UPDATE extras_items SET name=?,description=?,examples=?,examples_label=?,kind=?,fee=?,sub_title=?,text_label=?,text_placeholder=?,recommended=?,active=?,sort_order=?,max_select=?,info=?,min_select=?,bundle=? WHERE id=?', [...v, iid], c);
      } else {
        iid = (await q('INSERT INTO extras_items (name,description,examples,examples_label,kind,fee,sub_title,text_label,text_placeholder,recommended,active,sort_order,max_select,info,min_select,bundle,screen_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [...v, sid], c)).insertId;
      }
      const ex = (await q('SELECT id FROM extras_choices WHERE item_id=?', [iid], c)).map((r) => r.id);
      const ck = i.choices.filter((ch) => ex.includes(+ch.id)).map((ch) => +ch.id);
      for (const x of ex.filter((x) => !ck.includes(x))) await q('DELETE FROM extras_choices WHERE id=?', [x], c);
      for (const [m, ch] of i.choices.entries()) {
        const cv = [ch.name.trim(), ch.fee, ch.ask, ch.nlabel, ch.active === false ? 0 : 1, m + 1];
        if (ck.includes(+ch.id)) await q('UPDATE extras_choices SET name=?,fee=?,ask_note=?,note_label=?,active=?,sort_order=? WHERE id=?', [...cv, ch.id], c);
        else await q('INSERT INTO extras_choices (name,fee,ask_note,note_label,active,sort_order,item_id) VALUES (?,?,?,?,?,?,?)', [...cv, iid], c);
      }
    }
    return sid;
  });
}
admin.get('/extras', wrap(async (req, res) => res.json(await loadExtras(false))));
admin.post('/extras', wrap(async (req, res) => res.json({ id: await saveExtras(null, req.body) })));
admin.put('/extras/:id', wrap(async (req, res) => res.json({ id: await saveExtras(+req.params.id, req.body) })));
admin.delete('/extras/:id', wrap(async (req, res) => { await q('DELETE FROM extras_screens WHERE id=?', [+req.params.id]); res.json({ ok: true }); }));

// ---------- quantity screens (e.g. certified death certificates: first copy price + additional copy price) ----------
const qtyLines = (s, n, T) => [
  { label: T('qty.line_first'), fee: s.first_price },
  ...(n > 1 ? [{ label: T(n - 1 === 1 ? 'qty.line_more_one' : 'qty.line_more_many', { n: n - 1, price: `$${s.extra_price.toFixed(2)}` }), fee: money((n - 1) * s.extra_price) }] : []),
];

async function loadQty(onlyActive) {
  return (await q(`SELECT * FROM qty_screens ${onlyActive ? 'WHERE active=1' : ''} ORDER BY sort_order, id`))
    .map((s) => ({ ...s, active: !!s.active, first_price: money(s.first_price), extra_price: money(s.extra_price) }));
}

app.get('/api/qty', auth, wrap(async (req, res) => res.json(await loadQty(true))));

app.post('/api/cart/qty', auth, wrap(async (req, res) => {
  const s = (await loadQty(true)).find((x) => x.id === +req.body?.screen_id);
  if (!s) throw bad('Screen not found', 404);
  const n = Number(req.body?.qty);
  if (!Number.isInteger(n) || n < s.min_qty || n > s.max_qty) throw bad(`Please choose between ${s.min_qty} and ${s.max_qty} copies`);
  const lines = qtyLines(s, n, await textFn());
  const total = money(lines.reduce((t, l) => t + l.fee, 0));
  const kind = `qty-${s.id}`;
  await tx(async (c) => {
    await q(`INSERT INTO cart_qty (plan_id,screen_id,screen_name,qty,line_items,total,sort_order) VALUES (?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE screen_name=VALUES(screen_name),qty=VALUES(qty),line_items=VALUES(line_items),total=VALUES(total),sort_order=VALUES(sort_order)`,
      [req.plan.id, s.id, s.name, n, JSON.stringify(lines), total, s.sort_order], c);
    await q('DELETE FROM answers WHERE plan_id=? AND kind=?', [req.plan.id, kind], c);
    await q('INSERT INTO answers (plan_id,question_id,option_id,question_text,option_label,kind) VALUES (?,NULL,NULL,?,?,?)',
      [req.plan.id, s.question || s.title, `${n} ${n === 1 ? 'copy' : 'copies'}`, kind], c);
  });
  res.json({ cart: await getCart(req.plan.id) });
}));

async function saveQty(id, b = {}) {
  if (!b.name?.trim() || !b.title?.trim()) throw bad('Name and title are required');
  const min = Math.trunc(Number(b.min_qty));
  const max = Math.trunc(Number(b.max_qty));
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 1 || max < min || max > 100) throw bad('Copies must range from at least 1 up to a maximum (100 at most), and the maximum cannot be below the minimum');
  const v = [b.name.trim(), b.title.trim(), String(b.intro || '').slice(0, 1000), String(b.uses_title || '').slice(0, 255), String(b.uses || ''),
    String(b.question || '').slice(0, 500), String(b.note || '').slice(0, 1000), fee(b.first_price), fee(b.extra_price), min, max, +b.sort_order || 0, b.active ? 1 : 0];
  if (id) { await q('UPDATE qty_screens SET name=?,title=?,intro=?,uses_title=?,uses=?,question=?,note=?,first_price=?,extra_price=?,min_qty=?,max_qty=?,sort_order=?,active=? WHERE id=?', [...v, id]); return id; }
  return (await q('INSERT INTO qty_screens (name,title,intro,uses_title,uses,question,note,first_price,extra_price,min_qty,max_qty,sort_order,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', v)).insertId;
}
admin.get('/qty', wrap(async (req, res) => res.json(await loadQty(false))));
admin.post('/qty', wrap(async (req, res) => res.json({ id: await saveQty(null, req.body) })));
admin.put('/qty/:id', wrap(async (req, res) => res.json({ id: await saveQty(+req.params.id, req.body) })));
admin.delete('/qty/:id', wrap(async (req, res) => { await q('DELETE FROM qty_screens WHERE id=?', [+req.params.id]); res.json({ ok: true }); }));

// ---------- review arrangement (final step): groups of earlier selections + estimated total ----------
// (The review rows are fixed for now; there is no admin screen for them.)
// A review group pulls from "sources": q:<questionId> (answer text only), package, visitation, ceremony,
// choice:<screenId>, extras:<screenId>, extras:<screenId>:<itemId> (one item of a tick-box screen), qty:<screenId>.
// The wizard step each source belongs to (used for the "Edit" buttons).
const sourceStep = (key) => {
  const [k, id] = key.split(':');
  return { q: `q-${id}`, package: 'pkg', visitation: 'vis', ceremony: 'cer', choice: `choice-${id}`, extras: `extras-${id}`, qty: `qty-${id}` }[k];
};

async function buildReview(uid) {
  const cart = await getCart(uid);
  const sections = cart?.sections || [];
  const answers = await q('SELECT question_id,question_text,option_label FROM answers WHERE plan_id=? AND question_id IS NOT NULL ORDER BY id', [uid]);
  const itemNames = Object.fromEntries((await q('SELECT id,name FROM extras_items')).map((i) => [i.id, i.name]));
  const used = new Set();
  const groups = [];
  for (const g of await q('SELECT * FROM review_groups WHERE active=1 ORDER BY sort_order,id')) {
    const sources = JSON.parse(g.sources || '[]');
    const details = [];
    const lines = [];
    for (const key of sources) {
      const [kind, a, b] = key.split(':');
      if (kind === 'q') {
        const rows = answers.filter((r) => r.question_id === +a);
        if (rows.length) details.push(rows.map((r) => r.option_label).join(', '));
        continue;
      }
      const secKey = { package: 'package', visitation: 'visitation', ceremony: 'ceremony', choice: `choice-${a}`, extras: `extras-${a}`, qty: `qty-${a}` }[kind];
      const sec = sections.find((s) => s.key === secKey);
      if (!sec) continue;
      let take = sec.lines;
      if (kind === 'extras' && b) {
        const nm = itemNames[+b];
        take = sec.lines.filter((l) => (l.item_id != null ? l.item_id === +b : nm && l.label.startsWith(nm)));
      }
      if (['package', 'visitation', 'ceremony'].includes(kind) && sec.title) details.push(sec.title);
      if (kind === 'qty' && cart.qty?.[a]) details.push(`${cart.qty[a]} ${cart.qty[a] === 1 ? 'copy' : 'copies'}`);
      for (const l of take) if (!used.has(l)) { used.add(l); lines.push({ label: l.label, fee: money(l.fee) }); }
    }
    groups.push({ id: g.id, label: g.label, details, lines, subtotal: money(lines.reduce((t, l) => t + l.fee, 0)), steps: sources.map(sourceStep).filter(Boolean) });
  }
  // anything in the cart that no group covers still counts towards the total
  const rest = sections.flatMap((s) => s.lines.filter((l) => !used.has(l)).map((l) => ({ label: `${s.title}: ${l.label}`, fee: money(l.fee) })));
  if (rest.length) groups.push({ id: 0, label: 'Other selections', details: [], lines: rest, subtotal: money(rest.reduce((t, l) => t + l.fee, 0)), steps: [] });
  return { groups, total: cart ? cart.total : 0, confirmed_at: cart?.confirmed_at || null };
}

app.get('/api/review', auth, wrap(async (req, res) => res.json(await buildReview(req.plan.id))));

// Confirming stores a snapshot of the summary; it is not a payment.
app.post('/api/arrangement/confirm', auth, wrap(async (req, res) => {
  const r = await buildReview(req.plan.id);
  await q(`INSERT INTO arrangements (plan_id,confirmed_at,total,summary) VALUES (?,NOW(),?,?)
    ON DUPLICATE KEY UPDATE confirmed_at=NOW(),total=VALUES(total),summary=VALUES(summary)`, [req.plan.id, r.total, JSON.stringify(r.groups)]);
  res.json(await buildReview(req.plan.id));
}));


// ---------- site texts: defaults in ui-texts.js, overrides saved by the admin in `ui_texts` ----------
async function getTexts() {
  const over = Object.fromEntries((await q('SELECT k,v FROM ui_texts')).map((r) => [r.k, r.v]));
  return { ...UI_TEXT_DEFAULTS, ...over };
}
const fillText = (str, vars) => String(str).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? vars[k] : m));
// T('key', { name: 'x' }) -> the admin's wording with the {placeholders} filled in
async function textFn() {
  const all = await getTexts();
  return (key, vars) => fillText(all[key] ?? key, vars);
}

// ---------- integrations (email + Stripe) live in `config`, never in `settings` (which /api/site publishes) ----------
const CONFIG_KEYS = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'mail_from_name', 'mail_from_email', 'consult_to',
  'stripe_enabled', 'stripe_mode', 'stripe_test_pk', 'stripe_test_sk', 'stripe_live_pk', 'stripe_live_sk', 'stripe_deposit_percent'];
const SECRET_KEYS = ['smtp_pass', 'stripe_test_sk', 'stripe_live_sk'];

async function getConfig() {
  return Object.fromEntries((await q('SELECT k,v FROM config')).map((r) => [r.k, r.v]));
}
async function setConfig(values) {
  for (const [k, v] of Object.entries(values)) await q('INSERT INTO config (k,v) VALUES (?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)', [k, String(v)]);
}
const hint = (v) => (v ? `••••${String(v).slice(-4)}` : '');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = (n) => `$${(+n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const siteName = async () => (await one("SELECT value FROM settings WHERE `key`='site_name'"))?.value || 'Gámez & Sons Funeral and Cremation Services';

async function sendMail({ to, subject, html, text, replyTo }) {
  const c = await getConfig();
  if (!c.smtp_host || !c.mail_from_email) throw Object.assign(new Error('Email is not set up on this site yet.'), { code: 'NO_SMTP' });
  const transport = nodemailer.createTransport({
    host: c.smtp_host, port: +c.smtp_port || 587, secure: c.smtp_secure === '1',
    auth: c.smtp_user ? { user: c.smtp_user, pass: c.smtp_pass || '' } : undefined,
  });
  await transport.sendMail({ from: `"${(c.mail_from_name || (await siteName())).replace(/"/g, '')}" <${c.mail_from_email}>`, to, subject, html, text, replyTo });
}

// The estimate as an email / printable block: grouped selections, subtotals and the estimated total.
function estimateHtml({ site, plan, who, summary, intro, T }) {
  const groups = summary.groups.filter((g) => g.lines.length || g.details.length);
  const rows = groups.map((g) => `
    <tr><td colspan="2" style="padding:14px 0 4px;font:700 13px Arial;letter-spacing:.06em;text-transform:uppercase;color:#780080">${esc(g.label)}${g.details.length ? ` &ndash; ${esc(g.details.join(', '))}` : ''}</td></tr>
    ${g.lines.map((l) => `<tr><td style="padding:4px 0;border-bottom:1px solid #eee">${esc(l.label)}</td><td style="padding:4px 0;border-bottom:1px solid #eee;text-align:right">${usd(l.fee)}</td></tr>`).join('')}`).join('');
  return `<div style="font:15px/1.5 Arial,sans-serif;color:#24303a;max-width:640px">
    <h2 style="margin:0 0 4px;color:#780080">${esc(site)}</h2>
    <p style="margin:0 0 14px;color:#6b7680">${esc(intro)}</p>
    <p style="margin:0 0 10px"><strong>${esc(T('email.plan'))}</strong> ${esc(plan)}<br/>${who ? `<strong>${esc(T('email.for'))}</strong> ${esc(who)}<br/>` : ''}<strong>${esc(T('email.date'))}</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <table style="width:100%;border-collapse:collapse">${rows || `<tr><td>${esc(T('email.empty'))}</td></tr>`}
      <tr><td style="padding:16px 0 0;font:700 18px Arial">${esc(T('email.total'))}</td><td style="padding:16px 0 0;font:700 18px Arial;text-align:right;color:#780080">${usd(summary.total)}</td></tr>
    </table>
    <p style="margin:18px 0 0;font-size:12px;color:#6b7680">${esc(T('estimate.disclaimer'))}</p></div>`;
}
const estimateText = (site, plan, summary, T) =>
  `${site}\n${T('print.title')}: ${plan}\n\n${summary.groups.filter((g) => g.lines.length).map((g) => `${g.label}\n${g.lines.map((l) => `  ${l.label}: ${usd(l.fee)}`).join('\n')}`).join('\n\n')}\n\n${T('email.total')}: ${usd(summary.total)}\n`;

// ---------- estimates: save, list, email ----------
app.get('/api/estimates', auth, wrap(async (req, res) =>
  res.json((await q('SELECT id,created_at,total FROM estimates WHERE plan_id=? ORDER BY id DESC', [req.plan.id])).map((e) => ({ ...e, total: money(e.total) })))));

app.get('/api/estimates/:id', auth, wrap(async (req, res) => {
  const e = await one('SELECT * FROM estimates WHERE id=? AND plan_id=?', [+req.params.id, req.plan.id]);
  if (!e) throw bad('Estimate not found', 404);
  res.json({ id: e.id, created_at: e.created_at, ...JSON.parse(e.summary) });
}));

app.post('/api/estimates', auth, wrap(async (req, res) => {
  const n = (await one('SELECT COUNT(*) AS n FROM estimates WHERE plan_id=?', [req.plan.id])).n;
  if (n >= 30) throw bad('You have saved 30 estimates for this plan. Please delete an older one first.');
  const r = await buildReview(req.plan.id);
  const id = (await q('INSERT INTO estimates (plan_id,total,summary) VALUES (?,?,?)', [req.plan.id, r.total, JSON.stringify({ groups: r.groups, total: r.total })])).insertId;
  res.json({ id, total: r.total });
}));

app.delete('/api/estimates/:id', auth, wrap(async (req, res) => {
  await q('DELETE FROM estimates WHERE id=? AND plan_id=?', [+req.params.id, req.plan.id]);
  res.json({ ok: true });
}));

// email the current estimate (or a saved one) to the address the customer types
app.post('/api/estimates/email', auth, wrap(async (req, res) => {
  const to = String(req.body?.to || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(to)) throw bad('Please enter a valid email address');
  let summary;
  if (req.body?.estimate_id) {
    const e = await one('SELECT summary FROM estimates WHERE id=? AND plan_id=?', [+req.body.estimate_id, req.plan.id]);
    if (!e) throw bad('Estimate not found', 404);
    summary = JSON.parse(e.summary);
  } else summary = await buildReview(req.plan.id);
  const site = await siteName();
  const T = await textFn();
  try {
    await sendMail({
      to, subject: T('email.estimate_subject', { site }), text: estimateText(site, req.plan.name, summary, T),
      html: estimateHtml({ site, plan: req.plan.name, who: req.user.name, summary, intro: T('email.estimate_intro'), T }),
    });
  } catch (e) {
    if (e.code === 'NO_SMTP') throw bad('Email is not available on this site yet. You can print or save your estimate instead.', 503);
    console.error('estimate email failed:', e.message);
    throw bad('We could not send the email. Please check the address and try again.', 502);
  }
  res.json({ ok: true });
}));

// ---------- funding (Stripe Checkout) ----------
async function stripeApi(path, { method = 'GET', form, mode } = {}) {
  const c = await getConfig();
  const m = mode || (c.stripe_mode === 'live' ? 'live' : 'test');
  const key = c[`stripe_${m}_sk`];
  if (c.stripe_enabled !== '1' || !key) throw bad('Online payment is not available yet. Please schedule a consultation or call us.', 503);
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: form ? new URLSearchParams(form) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw bad(data.error?.message || 'The payment provider returned an error.', 502);
  return { data, mode: m };
}
const depositPct = (c) => Math.min(100, Math.max(1, Math.round(+c.stripe_deposit_percent || 100)));

// what the customer-facing "Continue to funding" button needs (no secrets)
app.get('/api/funding/config', auth, wrap(async (req, res) => {
  const c = await getConfig();
  res.json({ enabled: c.stripe_enabled === '1' && !!c[`stripe_${c.stripe_mode === 'live' ? 'live' : 'test'}_sk`], mode: c.stripe_mode === 'live' ? 'live' : 'test', deposit_percent: depositPct(c) });
}));

app.get('/api/payments', auth, wrap(async (req, res) =>
  res.json((await q('SELECT id,amount,currency,mode,status,created_at,paid_at FROM payments WHERE plan_id=? ORDER BY id DESC', [req.plan.id])).map((p) => ({ ...p, amount: money(p.amount) })))));

app.post('/api/payments/checkout', auth, wrap(async (req, res) => {
  const review = await buildReview(req.plan.id);
  if (!review.confirmed_at) throw bad('Please confirm your arrangement first.');
  const c = await getConfig();
  const pct = depositPct(c);
  const amount = money((review.total * pct) / 100);
  const cents = Math.round(amount * 100);
  if (cents < 50) throw bad('The amount is too small to pay online. Please schedule a consultation.');
  const origin = String(req.headers.origin || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const site = await siteName();
  const { data, mode } = await stripeApi('/checkout/sessions', {
    method: 'POST',
    form: {
      mode: 'payment',
      success_url: `${origin}/funding/success?session_id={CHECKOUT_SESSION_ID}&plan=${req.plan.id}`,
      cancel_url: `${origin}/funding/cancel?plan=${req.plan.id}`,
      customer_email: req.user.email,
      client_reference_id: String(req.plan.id),
      'metadata[plan_id]': String(req.plan.id),
      'metadata[user_id]': String(req.plan.user_id),
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(cents),
      'line_items[0][price_data][product_data][name]': `${site}: ${req.plan.name}`,
      'line_items[0][price_data][product_data][description]': pct < 100 ? `${pct}% of the estimated total ${usd(review.total)}` : `Estimated total ${usd(review.total)}`,
    },
  });
  await q('INSERT INTO payments (plan_id,plan_name,user_id,stripe_session_id,amount,currency,mode,status) VALUES (?,?,?,?,?,?,?,?)',
    [req.plan.id, req.plan.name, req.plan.user_id, data.id, amount, 'usd', mode, 'pending']);
  res.json({ url: data.url });
}));

// called when Stripe sends the customer back: confirm with Stripe that the session was really paid
app.post('/api/payments/verify', auth, wrap(async (req, res) => {
  const sid = String(req.body?.session_id || '');
  const pay = await one('SELECT * FROM payments WHERE stripe_session_id=? AND plan_id=?', [sid, req.plan.id]);
  if (!pay) throw bad('Payment not found', 404);
  const { data } = await stripeApi(`/checkout/sessions/${encodeURIComponent(sid)}`, { mode: pay.mode });
  const paid = data.payment_status === 'paid';
  if (paid && pay.status !== 'paid') await q("UPDATE payments SET status='paid', paid_at=NOW() WHERE id=?", [pay.id]);
  res.json({ paid, amount: money(pay.amount), mode: pay.mode });
}));

// ---------- schedule a consultation: saved for the admin, emailed to the admin's address(es) ----------
app.post('/api/consultations', auth, wrap(async (req, res) => {
  const review = await buildReview(req.plan.id);
  if (!review.confirmed_at) throw bad('Please confirm your arrangement first.');
  const b = req.body || {};
  const phone = String(b.phone || '').trim().slice(0, 60);
  if (phone.replace(/\D/g, '').length < 7) throw bad('Please enter a phone number we can reach you on');
  const method = ['phone', 'text', 'email'].includes(b.contact_method) ? b.contact_method : 'phone';
  const when = String(b.preferred_time || '').trim().slice(0, 255);
  const notes = String(b.notes || '').trim().slice(0, 2000);
  const summary = { groups: review.groups, total: review.total };
  const id = (await q(`INSERT INTO consultations (plan_id,plan_name,user_id,name,email,phone,contact_method,preferred_time,notes,total,summary)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [req.plan.id, req.plan.name, req.plan.user_id, req.user.name, req.user.email, phone, method, when, notes, review.total, JSON.stringify(summary)])).insertId;

  // email everything the customer filled in to the admin; the request is kept either way
  let status = 'sent';
  let error = '';
  try {
    const c = await getConfig();
    const to = (c.consult_to || '').split(/[,;\s]+/).filter(Boolean);
    if (!to.length) throw Object.assign(new Error('No consultation recipient is set'), { code: 'NO_SMTP' });
    const site = await siteName();
    const T = await textFn();
    const details = `<h3 style="margin:0 0 8px;font:700 16px Arial;color:#780080">${esc(T('email.consult_heading'))}</h3>
      <p style="margin:0 0 14px;font:15px/1.6 Arial">
        <strong>Name:</strong> ${esc(req.user.name)}<br/><strong>Email:</strong> ${esc(req.user.email)}<br/><strong>Phone:</strong> ${esc(phone)}<br/>
        <strong>Best way to reach them:</strong> ${esc(method)}<br/><strong>Preferred day / time:</strong> ${esc(when || 'Not specified')}<br/>
        <strong>Notes:</strong> ${esc(notes || 'None')}</p>`;
    await sendMail({
      to: to.join(','), replyTo: req.user.email, subject: T('email.consult_subject', { name: req.user.name, plan: req.plan.name }),
      text: `New consultation request\nName: ${req.user.name}\nEmail: ${req.user.email}\nPhone: ${phone}\nContact by: ${method}\nPreferred time: ${when || 'Not specified'}\nNotes: ${notes || 'None'}\n\n${estimateText(site, req.plan.name, summary, T)}`,
      html: details + estimateHtml({ site, plan: req.plan.name, who: req.user.name, summary, intro: T('email.consult_intro'), T }),
    });
  } catch (e) {
    status = e.code === 'NO_SMTP' ? 'not_configured' : 'failed';
    error = String(e.message || '').slice(0, 480);
    console.error('consultation email not sent:', error);
  }
  await q('UPDATE consultations SET email_status=?, email_error=? WHERE id=?', [status, error, id]);
  res.json({ ok: true });
}));

// ---------- admin: email + Stripe settings, consultation requests ----------
admin.get('/integrations', wrap(async (req, res) => {
  const c = await getConfig();
  const out = { ...Object.fromEntries(CONFIG_KEYS.filter((k) => !SECRET_KEYS.includes(k)).map((k) => [k, c[k] ?? ''])) };
  out.smtp_port = out.smtp_port || '587';
  out.stripe_mode = out.stripe_mode === 'live' ? 'live' : 'test';
  out.stripe_deposit_percent = out.stripe_deposit_percent || '100';
  for (const k of SECRET_KEYS) { out[`${k}_set`] = !!c[k]; out[`${k}_hint`] = hint(c[k]); }
  res.json(out);
}));

admin.put('/integrations', wrap(async (req, res) => {
  const b = req.body || {};
  const set = {};
  for (const k of CONFIG_KEYS) {
    if (b[k] === undefined) continue;
    const v = typeof b[k] === 'boolean' ? (b[k] ? '1' : '0') : String(b[k]).trim();
    if (SECRET_KEYS.includes(k) && !v) continue; // blank secret = keep the saved one
    set[k] = v;
  }
  if (set.stripe_mode && !['test', 'live'].includes(set.stripe_mode)) throw bad('Mode must be test or live');
  if (set.stripe_deposit_percent !== undefined) {
    const p = Number(set.stripe_deposit_percent);
    if (!Number.isFinite(p) || p < 1 || p > 100) throw bad('The amount to collect must be between 1% and 100%');
    set.stripe_deposit_percent = String(Math.round(p));
  }
  const keyRules = [['stripe_test_sk', /^(sk|rk)_test_/, 'The test secret key must start with sk_test_'], ['stripe_live_sk', /^(sk|rk)_live_/, 'The live secret key must start with sk_live_'],
    ['stripe_test_pk', /^pk_test_/, 'The test publishable key must start with pk_test_'], ['stripe_live_pk', /^pk_live_/, 'The live publishable key must start with pk_live_']];
  for (const [k, re, msg] of keyRules) if (set[k] && !re.test(set[k])) throw bad(msg);
  if (set.mail_from_email && !/^\S+@\S+\.\S+$/.test(set.mail_from_email)) throw bad('Please enter a valid "from" email address');
  if (set.consult_to) for (const e of set.consult_to.split(/[,;\s]+/).filter(Boolean)) if (!/^\S+@\S+\.\S+$/.test(e)) throw bad(`"${e}" is not a valid email address`);
  if (set.smtp_port && !(+set.smtp_port > 0 && +set.smtp_port < 65536)) throw bad('Please enter a valid port number');
  await setConfig(set);
  res.json({ ok: true });
}));

admin.post('/integrations/test-email', wrap(async (req, res) => {
  const to = String(req.body?.to || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(to)) throw bad('Please enter a valid email address to send the test to');
  try {
    await sendMail({ to, subject: 'Test email from your funeral planning site', text: 'If you can read this, your email settings work.', html: '<p>If you can read this, your email settings work.</p>' });
  } catch (e) {
    throw bad(e.code === 'NO_SMTP' ? 'Please save the SMTP host and the "from" email first.' : `The email could not be sent: ${e.message}`, 502);
  }
  res.json({ ok: true });
}));

admin.post('/integrations/test-stripe', wrap(async (req, res) => {
  const { data, mode } = await stripeApi('/balance', { mode: req.body?.mode === 'live' ? 'live' : 'test' });
  res.json({ ok: true, mode, livemode: !!data.livemode });
}));

admin.get('/texts', wrap(async (req, res) => {
  const over = Object.fromEntries((await q('SELECT k,v FROM ui_texts')).map((r) => [r.k, r.v]));
  res.json(UI_TEXTS.map((t) => ({ key: t.key, group: t.group, label: t.label, default: t.text, long: t.long, value: over[t.key] ?? t.text, changed: over[t.key] !== undefined })));
}));
// { values: { key: "new wording" } } - a blank value (or the default wording) puts the default back
admin.put('/texts', wrap(async (req, res) => {
  const values = req.body?.values && typeof req.body.values === 'object' ? req.body.values : {};
  for (const [k, raw] of Object.entries(values)) {
    if (!(k in UI_TEXT_DEFAULTS)) continue;
    const v = String(raw ?? '');
    if (v.length > 2000) throw bad('That text is too long');
    if (!v.trim() || v === UI_TEXT_DEFAULTS[k]) await q('DELETE FROM ui_texts WHERE k=?', [k]);
    else await q('INSERT INTO ui_texts (k,v) VALUES (?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)', [k, v]);
  }
  res.json({ ok: true });
}));

admin.get('/consultations', wrap(async (req, res) =>
  res.json((await q('SELECT * FROM consultations ORDER BY id DESC')).map((c) => ({ ...c, total: money(c.total), summary: JSON.parse(c.summary || '{}') })))));
admin.put('/consultations/:id', wrap(async (req, res) => {
  const st = ['new', 'contacted', 'scheduled', 'done'].includes(req.body?.status) ? req.body.status : 'new';
  await q('UPDATE consultations SET status=? WHERE id=?', [st, +req.params.id]);
  res.json({ ok: true });
}));
admin.delete('/consultations/:id', wrap(async (req, res) => { await q('DELETE FROM consultations WHERE id=?', [+req.params.id]); res.json({ ok: true }); }));

// ---------- static client (production) ----------
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error', ...(err.fields ? { fields: err.fields } : {}) });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
