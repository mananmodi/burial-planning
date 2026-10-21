import './env.js';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { iconicPages } from './inner-pages.js';
import { settings as seedSettings, pages as seedPages } from './seed-content.js';

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};
const DB_NAME = process.env.DB_NAME || 'burial_planning';

export let pool;

// Run a query on the pool (or on a transaction connection) and return rows / result header.
export async function q(sql, params = [], conn = pool) {
  const [rows] = await conn.query(sql, params);
  return rows;
}
export const one = async (sql, params, conn) => (await q(sql, params, conn))[0];

export async function tx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const r = await fn(conn);
    await conn.commit();
    return r;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function init() {
  const boot = await mysql.createConnection(cfg);
  // On shared hosting the database already exists and the user may not be allowed to create one - that is fine.
  try { await boot.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); } catch (e) { console.warn('Skipping CREATE DATABASE:', e.message); }
  await boot.end();
  pool = mysql.createPool({ ...cfg, database: DB_NAME, connectionLimit: 10, charset: 'utf8mb4', dateStrings: true });

  await q(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500) NOT NULL DEFAULT '',
    type VARCHAR(10) NOT NULL DEFAULT 'single',
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    label VARCHAR(500) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  // Answers keep a text snapshot so history survives later edits of questions/options.
  await q(`CREATE TABLE IF NOT EXISTS answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NULL,
    option_id INT NULL,
    question_text VARCHAR(500) NOT NULL,
    option_label VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id, question_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    nav_group VARCHAR(100) NOT NULL DEFAULT '',
    nav_order INT NOT NULL DEFAULT 0,
    show_in_nav TINYINT(1) NOT NULL DEFAULT 1,
    published TINYINT(1) NOT NULL DEFAULT 1,
    hero_title VARCHAR(500) NOT NULL DEFAULT '',
    hero_subtitle VARCHAR(1000) NOT NULL DEFAULT '',
    sections LONGTEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS settings (
    \`key\` VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);

  if (!(await one('SELECT 1 AS x FROM pages LIMIT 1'))) {
    for (const p of seedPages)
      await q('INSERT INTO pages (slug,title,nav_group,nav_order,show_in_nav,hero_title,hero_subtitle,sections) VALUES (?,?,?,?,?,?,?,?)',
        [p.slug, p.title, p.nav_group, p.nav_order, p.nav_group ? 1 : 0, p.hero_title, p.hero_subtitle, JSON.stringify(p.sections)]);
  }
  for (const [k, v] of Object.entries(seedSettings))
    await q('INSERT IGNORE INTO settings (`key`,value) VALUES (?,?)', [k, v]);

  if (!(await one('SELECT 1 AS x FROM users LIMIT 1'))) {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const pass = process.env.ADMIN_PASSWORD || 'admin123';
    await q('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',
      ['Administrator', email, bcrypt.hashSync(pass, 10), 'admin']);
    console.log(`Seeded admin: ${email} / ${pass}`);
  }
  // Migration: per-option "Common Example" bullet list (one item per line).
  if (!(await one("SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name='options' AND column_name='examples'", [DB_NAME])))
    await q('ALTER TABLE options ADD COLUMN examples TEXT NULL');

  if (!(await one('SELECT 1 AS x FROM questions LIMIT 1'))) {
    const r = await q('INSERT INTO questions (title,subtitle,type,sort_order) VALUES (?,?,?,?)',
      ['Who Are You Planning For?', '', 'single', 1]);
    const opts = [
      ['Myself', 'Plan arrangements according to your own wishes and preferences.'],
      ['A Loved One', 'Plan arrangements for a family member or someone you care about.'],
      ['Exploring Options', 'Learn about available options before making decisions.'],
    ];
    for (const [i, [l, d]] of opts.entries())
      await q('INSERT INTO options (question_id,label,description,sort_order) VALUES (?,?,?,?)', [r.insertId, l, d, i + 1]);
  }

  // Screen 2 is seeded once (flag in settings) so an admin can delete or rewrite it afterwards.
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_screen2'"))) {
    const r = await q('INSERT INTO questions (title,subtitle,type,sort_order) VALUES (?,?,?,?)',
      ['What Type of Arrangement Are You Planning?', '', 'single', 2]);
    const opts = [
      ['Burial', 'The deceased will be placed in a casket and buried in a cemetery.',
        'Visitation\nRosary or prayer service (if desired)\nFuneral ceremony\nCemetery service'],
      ['Cremation', 'The deceased will be cremated.',
        'Visitation\nMemorial service\nCelebration of life\nUrn placement'],
    ];
    for (const [i, [l, d, ex]] of opts.entries())
      await q('INSERT INTO options (question_id,label,description,examples,sort_order) VALUES (?,?,?,?,?)', [r.insertId, l, d, ex, i + 1]);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_screen2','1')");
  }

  // ----- services, packages, cart -----
  await q(`CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tag VARCHAR(255) NOT NULL DEFAULT '',
    description VARCHAR(1000) NOT NULL DEFAULT '',
    schedule TEXT NULL,
    note VARCHAR(1000) NOT NULL DEFAULT '',
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS package_services (
    package_id INT NOT NULL,
    service_id INT NOT NULL,
    PRIMARY KEY (package_id, service_id),
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  // Migration: each service carries its own fee inside a package.
  if (!(await one("SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name='package_services' AND column_name='fee'", [DB_NAME])))
    await q('ALTER TABLE package_services ADD COLUMN fee DECIMAL(10,2) NOT NULL DEFAULT 0');
  // One cart per user; line items are a snapshot so later fee changes don't alter a saved cart.
  await q(`CREATE TABLE IF NOT EXISTS carts (
    user_id INT PRIMARY KEY,
    package_id INT NULL,
    package_name VARCHAR(255) NOT NULL,
    line_items LONGTEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);

  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_packages'"))) {
    const ids = {};
    for (const [i, name] of ['Visitation Fee', 'Funeral Service Fee', 'Graveside Service Fee'].entries())
      ids[name] = (await q('INSERT INTO services (name,fee,sort_order) VALUES (?,0,?)', [name, i + 1])).insertId;
    const pk = [
      ['One-Day Arrangement', 'Cremation package',
        'The visitation, funeral ceremony, and cemetery service all take place on the same day.',
        'Morning visitation\nFuneral ceremony\nCemetery service',
        'Many families choose this option when they prefer a simpler schedule.',
        ['Funeral Service Fee', 'Graveside Service Fee']],
      ['Traditional Arrangement', '',
        'The visitation occurs on one day and the funeral ceremony occurs on a later day.',
        '### Day 1\nEvening visitation\nRosary or prayer service may be held during the visitation\n### Day 2\nAdditional visitation period before departure\nFuneral ceremony or Mass\nCemetery service',
        'Many families choose this option when larger attendance is expected or when a church service is planned.',
        ['Visitation Fee', 'Funeral Service Fee', 'Graveside Service Fee']],
    ];
    for (const [i, [name, tag, desc, sched, note, inc]] of pk.entries()) {
      const r = await q('INSERT INTO packages (name,tag,description,schedule,note,sort_order) VALUES (?,?,?,?,?,?)', [name, tag, desc, sched, note, i + 1]);
      for (const s of inc) await q('INSERT INTO package_services (package_id,service_id) VALUES (?,?)', [r.insertId, ids[s]]);
    }
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_packages','1')");
  }
  // ----- visitation (Screen 4) + cart/answer migrations -----
  const addCol = async (table, col, ddl) => {
    if (!(await one('SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name=? AND column_name=?', [DB_NAME, table, col])))
      await q(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
  };
  await addCol('users', 'profile', 'LONGTEXT NULL');
  await addCol('pages', 'hero_image', "VARCHAR(500) NOT NULL DEFAULT ''");
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_iconic_pages'"))) {
    // Give the still-plain seeded inner pages icons and pictures; pages the admin already styled are left alone.
    for (const [slug, v] of Object.entries(iconicPages)) {
      const row = await one('SELECT sections FROM pages WHERE slug=?', [slug]);
      if (!row) continue;
      const plain = JSON.parse(row.sections || '[]').every((s) => !s.layout || s.layout === 'text');
      if (plain) await q('UPDATE pages SET sections=?, hero_image=? WHERE slug=?', [JSON.stringify(v.sections), v.hero_image, slug]);
    }
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_iconic_pages','1')");
  }
  await addCol('carts', 'visitation_id', 'INT NULL');
  await addCol('carts', 'visit_name', "VARCHAR(255) NOT NULL DEFAULT ''");
  await addCol('carts', 'visit_lines', 'LONGTEXT NULL');
  await addCol('carts', 'visit_total', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
  await addCol('carts', 'embalming', 'VARCHAR(5) NULL');
  if (!(await one("SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name='answers' AND column_name='kind'", [DB_NAME]))) {
    await q('ALTER TABLE answers ADD COLUMN kind VARCHAR(20) NULL');
    await q("UPDATE answers SET kind='package' WHERE question_id IS NULL");
  }

  await q(`CREATE TABLE IF NOT EXISTS visitation_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    examples TEXT NULL,
    followup_title VARCHAR(500) NOT NULL DEFAULT '',
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB`);
  // applies: 'always' = added automatically; 'yes' / 'no' = added when the embalming follow-up gets that answer.
  await q(`CREATE TABLE IF NOT EXISTS visitation_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitation_id INT NOT NULL,
    service_id INT NOT NULL,
    applies VARCHAR(10) NOT NULL DEFAULT 'always',
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (visitation_id) REFERENCES visitation_types(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);

  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_visitation'"))) {
    const sid = {};
    for (const name of ['Embalming', 'Dressing', 'Casketing', 'Basic cosmetology', 'Handling of remains']) {
      const ex = await one('SELECT id FROM services WHERE name=?', [name]);
      sid[name] = ex ? ex.id : (await q('INSERT INTO services (name,fee,sort_order) VALUES (?,0,?)', [name, 10 + Object.keys(sid).length])).insertId;
    }
    const FU = 'Would You Like Embalming Performed?';
    const types = [
      ['Open Casket Visitation', 'Family and friends may gather and view the deceased.',
        'Guests visit with family and may approach the casket to pay their respects.\nFor Catholic families, a Rosary is often held during the visitation.', '',
        [['always', 'Embalming'], ['always', 'Dressing'], ['always', 'Casketing'], ['always', 'Basic cosmetology']]],
      ['Closed Casket Visitation', 'Family and friends may gather while the casket remains closed.',
        'Guests spend time with the family during the visitation without public viewing.\nA Rosary or prayer service may still be held.', FU,
        [['yes', 'Handling of remains'], ['yes', 'Embalming'], ['no', 'Handling of remains']]],
      ['No Visitation', 'The first public event will be the funeral ceremony.',
        'A funeral ceremony is held without a separate visitation period.', FU,
        [['yes', 'Handling of remains'], ['yes', 'Embalming'], ['no', 'Handling of remains']]],
    ];
    for (const [i, [name, desc, ex, fu, rules]] of types.entries()) {
      const r = await q('INSERT INTO visitation_types (name,description,examples,followup_title,sort_order) VALUES (?,?,?,?,?)', [name, desc, ex, fu, i + 1]);
      for (const [applies, svc] of rules)
        await q('INSERT INTO visitation_services (visitation_id,service_id,applies,fee) VALUES (?,?,?,0)', [r.insertId, sid[svc], applies]);
    }
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_visitation','1')");
  }
  // ----- choice screens (Screen 5: Rosary / Prayer service, and any later single-choice priced screen) -----
  await q(`CREATE TABLE IF NOT EXISTS choice_screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS choice_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    screen_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    examples TEXT NULL,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (screen_id) REFERENCES choice_screens(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  // One selection per user per screen; name and fee are snapshots so later edits don't change a saved cart.
  await q(`CREATE TABLE IF NOT EXISTS cart_choices (
    user_id INT NOT NULL,
    screen_id INT NOT NULL,
    option_id INT NULL,
    screen_name VARCHAR(255) NOT NULL,
    option_name VARCHAR(255) NOT NULL,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, screen_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await addCol('choice_options', 'examples_label', "VARCHAR(100) NOT NULL DEFAULT 'Common Example'");
  await addCol('choice_options', 'note_title', "VARCHAR(255) NOT NULL DEFAULT ''");
  await addCol('choice_options', 'note', 'TEXT NULL');
  await addCol('choice_screens', 'intro', "VARCHAR(1000) NOT NULL DEFAULT ''");
  await addCol('cart_choices', 'skipped', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addCol('choice_options', 'ask_detail', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addCol('choice_options', 'detail_label', "VARCHAR(255) NOT NULL DEFAULT ''");
  await addCol('cart_choices', 'detail', "VARCHAR(500) NOT NULL DEFAULT ''");
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_other_location_detail'"))) {
    await q("UPDATE choice_options o JOIN choice_screens s ON s.id=o.screen_id SET o.ask_detail=1, o.detail_label='Please tell us the location' WHERE s.name='Funeral Ceremony Location' AND o.name='Other Location'");
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_other_location_detail','1')");
  }
  // skippable: the customer may continue without choosing anything (Screen 8 is skippable by default)
  if (!(await one("SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name='choice_screens' AND column_name='skippable'", [DB_NAME]))) {
    await q('ALTER TABLE choice_screens ADD COLUMN skippable TINYINT(1) NOT NULL DEFAULT 0');
    await q("UPDATE choice_screens SET skippable=1 WHERE name='Memorial Package'");
  }
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_choice_screen5'"))) {
    const r = await q('INSERT INTO choice_screens (name,title,sort_order) VALUES (?,?,?)', ['Rosary or Prayer Service', 'Will There Be A Rosary Or Prayer Service?', 5]);
    const opts = [
      ['Rosary Service', 'A Catholic prayer service typically held during the visitation.',
        'Family and friends gather for a Rosary during the evening visitation before the Funeral Mass the following day.'],
      ['Prayer Service', 'A prayer service conducted by clergy, family, or another leader.', ''],
      ['No Rosary or Prayer Service', 'Proceed with visitation and funeral ceremony only.', ''],
    ];
    for (const [i, [n, d, ex]] of opts.entries())
      await q('INSERT INTO choice_options (screen_id,name,description,examples,sort_order) VALUES (?,?,?,?,?)', [r.insertId, n, d, ex, i + 1]);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_choice_screen5','1')");
  }
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_choice_screen6'"))) {
    const r = await q('INSERT INTO choice_screens (name,title,sort_order) VALUES (?,?,?)', ['Funeral Ceremony Location', 'Where Will The Funeral Ceremony Take Place?', 6]);
    const opts = [
      ['Funeral Home Chapel', 'The ceremony will be held at the funeral home before proceeding to the cemetery.', '', 'Common Example'],
      ['Church Or Place Of Worship', 'The ceremony will be held at a church or other religious location.', 'A Funeral Mass or worship service followed by burial.', 'Common Example'],
      ['Other Location', 'The ceremony will be held at another meaningful location.', 'Community center\nCivic building\nPrivate venue', 'Examples'],
    ];
    for (const [i, [n, d, ex, lab]] of opts.entries())
      await q('INSERT INTO choice_options (screen_id,name,description,examples,examples_label,sort_order) VALUES (?,?,?,?,?,?)', [r.insertId, n, d, ex, lab, i + 1]);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_choice_screen6','1')");
  }
  // ----- funeral ceremony types (Screen 7) -----
  await q(`CREATE TABLE IF NOT EXISTS ceremony_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    examples TEXT NULL,
    examples_label VARCHAR(100) NOT NULL DEFAULT 'Common Example',
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    has_addons TINYINT(1) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS ceremony_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ceremony_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    kind VARCHAR(10) NOT NULL DEFAULT 'fixed',
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    requires_option_id INT NULL,
    recommended TINYINT(1) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (ceremony_id) REFERENCES ceremony_types(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS cart_ceremony (
    user_id INT PRIMARY KEY,
    ceremony_id INT NULL,
    name VARCHAR(255) NOT NULL,
    line_items LONGTEXT NOT NULL,
    addons LONGTEXT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 7,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await addCol('ceremony_addons', 'ask_text', 'TINYINT(1) NOT NULL DEFAULT 0');
  await addCol('ceremony_addons', 'min_amount', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
  if (!(await one("SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name='ceremony_addons' AND column_name='note'", [DB_NAME]))) {
    await q("ALTER TABLE ceremony_addons ADD COLUMN note VARCHAR(1000) NOT NULL DEFAULT ''");
    await q("UPDATE ceremony_addons SET note='Please enter the clergy honorarium amount you would like to provide.' WHERE name LIKE 'Other custom%' OR ask_text=1");
  }
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_ceremony'"))) {
    const church = await one("SELECT id FROM choice_options WHERE name='Church Or Place Of Worship' LIMIT 1");
    const types = [
      ['Catholic Funeral Mass', 'One of the most common arrangements in our area.', '### Day 1\nVisitation\nRosary\n### Day 2\nFuneral Mass\nCemetery service', 1],
      ['Protestant / Christian Service', '', 'Visitation\nWorship service\nCemetery service', 0],
      ['Other Religious Ceremony', 'A service conducted according to the customs and traditions of a particular faith.', '', 0],
      ['Non-Religious Ceremony', 'A family-led tribute, celebration of life, or memorial ceremony.', '', 0],
    ];
    for (const [i, [name, desc, ex, addons]] of types.entries()) {
      const r = await q('INSERT INTO ceremony_types (name,description,examples,has_addons,sort_order) VALUES (?,?,?,?,?)', [name, desc, ex, addons, i + 1]);
      if (addons) {
        const adds = [['Clergy honorarium', 'fixed', null, 1], ['Escort service', 'fixed', church?.id ?? null, 1], ['Other custom clergy honorarium', 'custom', null, 0]];
        for (const [j, [n, kind, req, rec]] of adds.entries())
          await q('INSERT INTO ceremony_addons (ceremony_id,name,kind,requires_option_id,recommended,sort_order) VALUES (?,?,?,?,?,?)', [r.insertId, n, kind, req, rec, j + 1]);
      }
    }
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_ceremony','1')");
  }
  // kind='custom' = the customer types the amount (must be >= min_amount); ask_text is retired.
  await q("UPDATE ceremony_addons SET kind='custom', ask_text=0 WHERE ask_text=1");
  await q("INSERT IGNORE INTO settings (`key`,value) VALUES ('screen7_title','What Type Of Funeral Ceremony Will Be Held?')");
  await q("INSERT IGNORE INTO settings (`key`,value) VALUES ('screen7_order','7')");
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_choice_screen8'"))) {
    const r = await q('INSERT INTO choice_screens (name,title,intro,sort_order,skippable) VALUES (?,?,?,?,1)',
      ['Memorial Package', 'Memorial Package', 'Every burial arrangement includes:', 8]);
    await q('INSERT INTO choice_options (screen_id,name,description,examples,examples_label,note_title,note,sort_order) VALUES (?,?,?,?,?,?,?,?)',
      [r.insertId, 'In Memory Memorial Package', '',
        'Register book\n100 prayer cards\n50 acknowledgement cards\nCross or crucifix\nRosary (if applicable)\nTemporary grave marker',
        'Includes', 'Why Are These Included?',
        'These are the items most families traditionally use during visitations and funeral ceremonies.', 1]);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_choice_screen8','1')");
  }
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_choice_screen9'"))) {
    const r = await q('INSERT INTO choice_screens (name,title,intro,sort_order) VALUES (?,?,?,?)',
      ['Casket', 'Select A Casket',
        'A casket serves as the final resting place and is often chosen based on personal preference, appearance, and budget.\nCategories:', 9]);
    const opts = [
      ['Good', 'Simple and dignified selections.'],
      ['Better', 'Enhanced appearance and interior features.'],
      ['Best', 'Premium materials and craftsmanship.'],
    ];
    for (const [i, [n, d]] of opts.entries())
      await q('INSERT INTO choice_options (screen_id,name,description,sort_order) VALUES (?,?,?,?)', [r.insertId, n, d, i + 1]);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_choice_screen9','1')");
  }
  // ----- extras screens (Screen 10: floral tributes) -----
  await q(`CREATE TABLE IF NOT EXISTS extras_screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    intro VARCHAR(1000) NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS extras_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    screen_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    examples TEXT NULL,
    examples_label VARCHAR(100) NOT NULL DEFAULT 'Common Example',
    kind VARCHAR(10) NOT NULL DEFAULT 'plain',
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    sub_title VARCHAR(255) NOT NULL DEFAULT '',
    text_label VARCHAR(255) NOT NULL DEFAULT '',
    text_placeholder VARCHAR(255) NOT NULL DEFAULT '',
    recommended TINYINT(1) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (screen_id) REFERENCES extras_screens(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS extras_choices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES extras_items(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  // Name/fee/selection are snapshots so later admin edits don't change a saved cart.
  await q(`CREATE TABLE IF NOT EXISTS cart_extras (
    user_id INT NOT NULL,
    screen_id INT NOT NULL,
    screen_name VARCHAR(255) NOT NULL,
    line_items LONGTEXT NOT NULL,
    selection LONGTEXT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, screen_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  // A preference can ask the customer for a free-text note (ask_note); "Custom" flowers does by default.
  if (!(await one("SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name='extras_choices' AND column_name='ask_note'", [DB_NAME]))) {
    await q('ALTER TABLE extras_choices ADD COLUMN ask_note TINYINT(1) NOT NULL DEFAULT 0');
    await q("ALTER TABLE extras_choices ADD COLUMN note_label VARCHAR(255) NOT NULL DEFAULT ''");
    await q("UPDATE extras_choices c JOIN extras_items i ON i.id=c.item_id SET c.ask_note=1, c.note_label='Describe your custom flowers' WHERE c.name='Custom' AND i.name='Floral Tribute Selection'");
  }
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_extras10'"))) {
    const r = await q('INSERT INTO extras_screens (name,title,intro,sort_order) VALUES (?,?,?,?)',
      ['Floral Tributes', 'Would You Like To Include Floral Tributes?', 'Tick any items you would like to include in your package.', 10]);
    const floral = await q('INSERT INTO extras_items (screen_id,name,description,kind,sub_title,sort_order) VALUES (?,?,?,?,?,?)',
      [r.insertId, 'Floral Tribute Selection',
        'Flowers provide a visual tribute and are often displayed during the visitation, funeral ceremony, or cemetery service.', 'choices', 'Flower Preference', 1]);
    for (const [i, n] of ['Standard', 'Premium', 'Custom'].entries())
      await q('INSERT INTO extras_choices (item_id,name,sort_order) VALUES (?,?,?)', [floral.insertId, n, i + 1]);
    await q('INSERT INTO extras_items (screen_id,name,description,examples,examples_label,kind,text_label,text_placeholder,recommended,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [r.insertId, 'Standard Family Spray', 'Recommended starting option.',
        '### Many families select colors that reflect:\nFavorite colors\nReligious traditions\nSchool colors\nMilitary service\nPersonal interests',
        'Common Example', 'text', 'Color Preference', 'e.g. white and blue', 1, 2]);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_extras10','1')");
  }
  // extras screens can be skippable (the choice is stored as 'skipped' so the customer is not sent back to it)
  await addCol('cart_extras', 'skipped', 'TINYINT(1) NOT NULL DEFAULT 0');
  if (!(await one("SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name='extras_screens' AND column_name='skippable'", [DB_NAME])))
    await q('ALTER TABLE extras_screens ADD COLUMN skippable TINYINT(1) NOT NULL DEFAULT 0');

  // Screen 12: additional professional services
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_extras12'"))) {
    const r = await q('INSERT INTO extras_screens (name,title,intro,sort_order,skippable) VALUES (?,?,?,?,1)',
      ['Additional Professional Services', 'Additional Professional Services', 'Tick any services you would like to add, or skip this step.', 12]);
    const items = [
      ['Clergy Honorarium', 'A contribution often given to clergy participating in the service.', '', 'Common Example'],
      ['Escort Service', 'An escort may help keep the funeral procession together when traveling between locations.', 'Funeral Home \u2192 Church \u2192 Cemetery', 'Common Example'],
      ['Newspaper Obituary', 'A published announcement containing service information and family details.', 'Name\nFamily information\nService details\nSurvivors', 'Typical obituary includes'],
    ];
    for (const [i, [n, d, ex, lab]] of items.entries())
      await q('INSERT INTO extras_items (screen_id,name,description,examples,examples_label,kind,sort_order) VALUES (?,?,?,?,?,?,?)', [r.insertId, n, d, ex, lab, 'plain', i + 1]);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_extras12','1')");
  }

  // 'multi' items: the customer ticks any of several priced options (max_select caps how many; 0 = no cap).
  // info: "### Heading" blocks of explanatory text shown under the item.
  await addCol('extras_items', 'max_select', 'INT NOT NULL DEFAULT 0');
  await addCol('extras_items', 'info', 'TEXT NULL');
  // min_select: fewest options a customer must tick once the item is ticked (0 = the options are optional).
  // bundle: show base price + chosen options as ONE cart line (e.g. Additional Transportation).
  if (!(await one("SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name='extras_items' AND column_name='min_select'", [DB_NAME]))) {
    await q('ALTER TABLE extras_items ADD COLUMN min_select INT NOT NULL DEFAULT 1');
    await q('ALTER TABLE extras_items ADD COLUMN bundle TINYINT(1) NOT NULL DEFAULT 0');
    await q("UPDATE extras_items SET min_select=0, bundle=1 WHERE name='Additional Transportation'");
  }

  // Screen 13: additional options & upgrades
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_extras13'"))) {
    const r = await q('INSERT INTO extras_screens (name,title,intro,sort_order) VALUES (?,?,?,?)',
      ['Additional Options & Upgrades', 'Additional Options & Upgrades', 'Tick any options you would like to add to your package.', 13]);
    const add = async (n, d, kind, sub, ex, exl, info, max, order, choices) => {
      const it = await q('INSERT INTO extras_items (screen_id,name,description,examples,examples_label,kind,sub_title,info,max_select,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [r.insertId, n, d, ex, exl, kind, sub, info, max, order]);
      for (const [i, c] of choices.entries()) await q('INSERT INTO extras_choices (item_id,name,sort_order) VALUES (?,?,?)', [it.insertId, c, i + 1]);
    };
    await add('Outer Burial Containers', '', 'choices', 'Container type', '', 'Common Example',
      '### What Is This?\nAn outer burial container surrounds the casket underground and helps support the ground above the grave.\n### Important\nNot required by law, although some cemeteries may require one.',
      0, 1, ['Grave Liner', 'Standard Vault', 'Premium Vault']);
    await add('Additional Memorial Items', '', 'multi', 'Choose your memorial items', '', 'Common Example', '', 0, 2,
      ['Additional prayer cards', 'Additional acknowledgement cards', 'Memorial candles', 'Bookmarks', 'Portrait displays', 'Video tribute']);
    await add('Additional Floral Arrangements', '', 'multi', 'Choose your arrangements', '', 'Common Example', '', 0, 3,
      ['Standing sprays', 'Wreaths', 'Family pieces']);
    await add('Additional Transportation', '', 'multi', 'Optional family vehicles', 'Hearse\nFlower vehicle', 'Included', 'Maximum of two family vehicles.', 2, 4,
      ['Family Vehicle #1', 'Family Vehicle #2']);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_extras13','1')");
  }
  // ----- quantity screens (Screen 11: certified death certificates) -----
  await q(`CREATE TABLE IF NOT EXISTS qty_screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    intro VARCHAR(1000) NOT NULL DEFAULT '',
    uses_title VARCHAR(255) NOT NULL DEFAULT '',
    uses TEXT NULL,
    question VARCHAR(500) NOT NULL DEFAULT '',
    note VARCHAR(1000) NOT NULL DEFAULT '',
    first_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    extra_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_qty INT NOT NULL DEFAULT 1,
    max_qty INT NOT NULL DEFAULT 10,
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS cart_qty (
    user_id INT NOT NULL,
    screen_id INT NOT NULL,
    screen_name VARCHAR(255) NOT NULL,
    qty INT NOT NULL,
    line_items LONGTEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, screen_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_qty11'"))) {
    await q('INSERT INTO qty_screens (name,title,intro,uses_title,uses,question,note,first_price,extra_price,min_qty,max_qty,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      ['Certified Death Certificates', 'Certified Death Certificates',
        'Certified death certificates are often needed to settle financial and legal matters.',
        'Common Uses', 'Insurance claims\nSocial Security\nBank accounts\nProperty transfers\nPension benefits',
        'How Many Certified Copies Would You Like?', 'Most families obtain between 5 and 10 copies.', 21, 4, 1, 10, 11]);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_qty11','1')");
  }
  // ----- review arrangement (final step) -----
  await q(`CREATE TABLE IF NOT EXISTS review_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    sources TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS arrangements (
    user_id INT PRIMARY KEY,
    confirmed_at TIMESTAMP NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    summary LONGTEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  if (!(await one("SELECT 1 AS x FROM settings WHERE `key`='seeded_review14'"))) {
    const id = async (sql, p) => (await one(sql, p))?.id;
    const qArr = await id("SELECT id FROM questions WHERE title LIKE 'What Type of Arrangement%' LIMIT 1");
    const choice = (name) => id('SELECT id FROM choice_screens WHERE name=? LIMIT 1', [name]);
    const extras = (name) => id('SELECT id FROM extras_screens WHERE name=? LIMIT 1', [name]);
    const item = async (screen, name) => (await one('SELECT i.id AS id FROM extras_items i JOIN extras_screens s ON s.id=i.screen_id WHERE s.name=? AND i.name=? LIMIT 1', [screen, name]))?.id;
    const qty = (name) => id('SELECT id FROM qty_screens WHERE name=? LIMIT 1', [name]);
    const pro = 'Additional Professional Services';
    const groups = [
      ['Arrangement Schedule', [qArr && `q:${qArr}`, 'package']],
      ['Visitation Selection', ['visitation']],
      ['Rosary / Prayer Service', [`choice:${await choice('Rosary or Prayer Service')}`]],
      ['Funeral Ceremony', [`choice:${await choice('Funeral Ceremony Location')}`, 'ceremony']],
      ['Memorial Package', [`choice:${await choice('Memorial Package')}`]],
      ['Casket', [`choice:${await choice('Casket')}`]],
      ['Flowers', [`extras:${await extras('Floral Tributes')}`]],
      ['Death Certificates', [`qty:${await qty('Certified Death Certificates')}`]],
      ['Clergy', [`extras:${await extras(pro)}:${await item(pro, 'Clergy Honorarium')}`]],
      ['Escort', [`extras:${await extras(pro)}:${await item(pro, 'Escort Service')}`]],
      ['Obituary', [`extras:${await extras(pro)}:${await item(pro, 'Newspaper Obituary')}`]],
      ['Additional Options', [`extras:${await extras('Additional Options & Upgrades')}`]],
    ];
    for (const [i, [label, src]] of groups.entries())
      await q('INSERT INTO review_groups (label,sources,sort_order) VALUES (?,?,?)', [label, JSON.stringify(src.filter((x) => x && !/:(undefined|null)/.test(x))), i + 1]);
    await q("INSERT INTO settings (`key`,value) VALUES ('seeded_review14','1')");
  }
  await q("INSERT IGNORE INTO settings (`key`,value) VALUES ('screen4_title','Will There Be A Visitation?')");
  await q("INSERT IGNORE INTO settings (`key`,value) VALUES ('screen3_title','How Would You Like The Events To Be Scheduled?')");

  // ----- integrations (email + Stripe keys), saved estimates, payments, consultation requests -----
  await q(`CREATE TABLE IF NOT EXISTS config (k VARCHAR(100) PRIMARY KEY, v TEXT NOT NULL) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS estimates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    summary LONGTEXT NOT NULL,
    INDEX (plan_id)
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NULL,
    plan_name VARCHAR(255) NOT NULL DEFAULT '',
    user_id INT NULL,
    stripe_session_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'usd',
    mode VARCHAR(10) NOT NULL DEFAULT 'test',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    INDEX (plan_id)
  ) ENGINE=InnoDB`);
  await q(`CREATE TABLE IF NOT EXISTS consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NULL,
    plan_name VARCHAR(255) NOT NULL DEFAULT '',
    user_id INT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(60) NOT NULL DEFAULT '',
    contact_method VARCHAR(10) NOT NULL DEFAULT 'phone',
    preferred_time VARCHAR(255) NOT NULL DEFAULT '',
    notes TEXT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    summary LONGTEXT NULL,
    email_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    email_error VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);

  await q(`CREATE TABLE IF NOT EXISTS ui_texts (k VARCHAR(120) PRIMARY KEY, v TEXT NOT NULL) ENGINE=InnoDB`);

  // ----- plans: one customer can keep several plannings. Every planning table is keyed by plan_id. -----
  await q(`CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    archived TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  const hasCol = async (t, c) => !!(await one('SELECT 1 AS x FROM information_schema.columns WHERE table_schema=? AND table_name=? AND column_name=?', [DB_NAME, t, c]));
  // table -> primary key once keyed by plan (null = keeps its own id key)
  const keyed = { answers: null, carts: 'plan_id', cart_choices: 'plan_id, screen_id', cart_ceremony: 'plan_id', cart_extras: 'plan_id, screen_id', cart_qty: 'plan_id, screen_id', arrangements: 'plan_id' };
  const legacy = [];
  for (const t of Object.keys(keyed)) if (await hasCol(t, 'user_id')) legacy.push(t);
  if (legacy.length) {
    // every customer who already has data gets one plan ("My plan") holding it
    const owners = new Set();
    for (const t of legacy) for (const r of await q(`SELECT DISTINCT user_id FROM ${t}`)) owners.add(r.user_id);
    for (const uid of owners)
      if (!(await one('SELECT 1 AS x FROM plans WHERE user_id=?', [uid]))) await q("INSERT INTO plans (user_id,name) VALUES (?,'My plan')", [uid]);
    for (const t of legacy) {
      await q(`ALTER TABLE ${t} ADD COLUMN plan_id INT NULL`);
      await q(`UPDATE ${t} x JOIN plans p ON p.user_id=x.user_id SET x.plan_id=p.id`);
      await q(`ALTER TABLE ${t} MODIFY plan_id INT NOT NULL`);
      for (const f of await q("SELECT constraint_name AS n FROM information_schema.key_column_usage WHERE table_schema=? AND table_name=? AND column_name='user_id' AND referenced_table_name IS NOT NULL", [DB_NAME, t]))
        await q(`ALTER TABLE ${t} DROP FOREIGN KEY \`${f.n}\``);
      if (keyed[t]) await q(`ALTER TABLE ${t} DROP PRIMARY KEY, ADD PRIMARY KEY (${keyed[t]})`);
      await q(`ALTER TABLE ${t} DROP COLUMN user_id`);
      if (!keyed[t]) await q(`ALTER TABLE ${t} ADD INDEX idx_${t}_plan (plan_id, question_id)`);
      await q(`ALTER TABLE ${t} ADD CONSTRAINT fk_${t}_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE`);
    }
  }

  if (!(await one("SELECT 1 AS x FROM information_schema.table_constraints WHERE table_schema=? AND table_name='estimates' AND constraint_name='fk_estimates_plan'", [DB_NAME])))
    await q('ALTER TABLE estimates ADD CONSTRAINT fk_estimates_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE');
}
