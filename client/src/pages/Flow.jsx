import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, setPlan } from '../api.js';
import { useAuth } from '../auth.jsx';
import { money, useT } from '../site.jsx';
import Cart from '../Cart.jsx';
import { PlanSkeleton } from '../Skeleton.jsx';
import ReviewStep from '../Review.jsx';
import NextSteps from '../NextSteps.jsx';

// Schedule text: plain line = bullet, "### Day 1" = group heading.
function Schedule({ text }) {
  const groups = [];
  (text || '').split('\n').map((l) => l.trim()).filter(Boolean).forEach((l) => {
    if (l.startsWith('### ')) groups.push({ head: l.slice(4), items: [] });
    else {
      if (!groups.length) groups.push({ head: '', items: [] });
      groups[groups.length - 1].items.push(l);
    }
  });
  return groups.map((g, i) => (
    <span key={i} className="sched">
      {g.head && <strong className="sched-head">{g.head}</strong>}
      <ul>{g.items.map((x, j) => <li key={j}>{x}</li>)}</ul>
    </span>
  ));
}

const Examples = ({ text, label }) => {
  const T = useT();
  const items = (text || '').split('\n').filter((x) => x.trim());
  return items.length ? (
    <span className="examples"><em>{label || T('ui.common_example')}</em><ul>{items.map((x, i) => <li key={i}>{x.trim()}</li>)}</ul></span>
  ) : null;
};

const rulesFor = (t, applies) => (t ? t.rules.filter((r) => r.applies === applies) : []);
const sum = (rules) => rules.reduce((t, r) => t + r.fee, 0);
const lineList = (rules) => rules.map((r) => ({ label: r.name, fee: r.fee }));
const stepKey = (s) => (s.kind === 'q' ? `q-${s.q.id}` : s.kind === 'choice' ? `choice-${s.screen.id}` : s.kind === 'extras' ? `extras-${s.screen.id}` : s.kind === 'qty' ? `qty-${s.screen.id}` : s.kind);
const stepLabel = (s, vis, pkgs, cer, reviewLabel) => ({ q: s.q?.title, pkg: pkgs.title, vis: vis.title, choice: s.screen?.title, extras: s.screen?.title, qty: s.screen?.title, cer: cer.title, review: reviewLabel }[s.kind]);

// Questions first, then the screens in screen-number order (package 3, visitation 4, choice screens 5-6, ceremony 7 ...).
function buildSteps({ qs, pk, v, ch, cer, ex = [], qy = [] }) {
  const later = [
    ...(pk.packages.length ? [{ kind: 'pkg', order: 3 }] : []),
    ...(v.types.length ? [{ kind: 'vis', order: 4 }] : []),
    ...ch.map((x) => ({ kind: 'choice', screen: x, order: x.sort_order })),
    ...(cer.types.length ? [{ kind: 'cer', order: cer.order }] : []),
    ...ex.map((x) => ({ kind: 'extras', screen: x, order: x.sort_order })),
    ...qy.map((x) => ({ kind: 'qty', screen: x, order: x.sort_order })),
  ].sort((a, b) => a.order - b.order);
  const all = [...qs.map((x) => ({ kind: 'q', q: x })), ...later];
  return all.length ? [...all, { kind: 'review' }] : all; // the review is always the last step
}

// "### Heading" + text blocks (e.g. "What Is This?", "Important") shown under an item.
function InfoBlocks({ text }) {
  const blocks = [];
  (text || '').split('\n').map((l) => l.trim()).filter(Boolean).forEach((l) => {
    if (l.startsWith('### ')) blocks.push({ title: l.slice(4), body: [] });
    else {
      if (!blocks.length) blocks.push({ title: '', body: [] });
      blocks[blocks.length - 1].body.push(l);
    }
  });
  return blocks.map((b, i) => (
    <span key={i} className="info-block">
      {b.title && <strong>{b.title}</strong>}
      <span>{b.body.join(' ')}</span>
    </span>
  ));
}

// Cart lines for a quantity screen: the first copy, then the additional copies at the additional price.
const qtyLines = (sc, n, T) => [
  { label: T('qty.line_first'), fee: sc.first_price },
  ...(n > 1 ? [{ label: T(n - 1 === 1 ? 'qty.line_more_one' : 'qty.line_more_many', { n: n - 1, price: money(sc.extra_price) }), fee: Math.round((n - 1) * sc.extra_price * 100) / 100 }] : []),
];

// Cart lines for an extras screen from the customer's current tick-boxes ({ [item_id]: { on, choice_id, text } }).
function exLines(screen, sel) {
  return screen.items.filter((i) => sel[i.id]?.on).flatMap((i) => {
    const st = sel[i.id];
    if (i.kind === 'choices') {
      const c = i.choices.find((x) => x.id === st.choice_id);
      const noteTxt = c?.ask_note && st.note?.trim() ? ` (${c.note_label || 'Note'}: ${st.note.trim()})` : '';
      return [{ label: c ? `${i.name}: ${c.name}${noteTxt}` : `${i.name}: choose a ${(i.sub_title || 'preference').toLowerCase()}`, fee: c ? c.fee : 0 }];
    }
    if (i.kind === 'multi') {
      const picked = i.choices.filter((c) => (st.choice_ids || []).includes(c.id));
      if (i.bundle) {
        const names = picked.map((c) => c.name);
        return [{ label: `${i.name} (${names.length ? `base + ${names.join(', ')}` : 'base price'})`, fee: Math.round((i.fee + picked.reduce((t, c) => t + c.fee, 0)) * 100) / 100 }];
      }
      return [...(i.fee > 0 ? [{ label: i.name, fee: i.fee }] : []), ...picked.map((c) => ({ label: `${i.name}: ${c.name}`, fee: c.fee }))];
    }
    if (i.kind === 'text') return [{ label: st.text?.trim() ? `${i.name} (${i.text_label || 'Preference'}: ${st.text.trim()})` : i.name, fee: i.fee }];
    return [{ label: i.name, fee: i.fee }];
  });
}

// Ceremony cart lines for a type + the customer's ticked add-ons ({ [addon_id]: { on, amount } }). A custom option uses the amount the customer typed.
function ceremonyLines(type, picks, available) {
  if (!type) return [];
  if (!type.has_addons) return [{ label: type.name, fee: type.fee }];
  return type.addons
    .filter((a) => picks[a.id]?.on && available(a))
    .map((a) => ({ label: a.name, fee: a.kind === 'custom' ? Math.round((+picks[a.id].amount || 0) * 100) / 100 : a.fee }));
}

export default function Flow({ planId }) {
  const T = useT();
  const { user } = useAuth();
  const [planInfo, setPlanInfo] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [pkgs, setPkgs] = useState({ title: '', packages: [] });
  const [vis, setVis] = useState({ title: '', types: [] });
  const [screens, setScreens] = useState([]); // choice screens (Screen 5+)
  const [cer, setCer] = useState({ title: '', order: 7, types: [] }); // funeral ceremony (Screen 7)
  const [cerPick, setCerPick] = useState(null);
  const [cerAdd, setCerAdd] = useState({}); // addon_id -> { on, amount }
  const [qtyScreens, setQtyScreens] = useState([]); // quantity screens (e.g. certified copies)
  const [qtyPick, setQtyPick] = useState({}); // screen_id -> number of copies
  const [exScreens, setExScreens] = useState([]); // extras screens (tick-boxes, e.g. floral tributes)
  const [exSel, setExSel] = useState({}); // item_id -> { on, choice_id, text }
  const [cart, setCart] = useState(null);
  const [pkgPick, setPkgPick] = useState(null);
  const [visPick, setVisPick] = useState(null);
  const [emb, setEmb] = useState(null); // 'yes' | 'no'
  const [choicePick, setChoicePick] = useState({}); // screen_id -> option_id
  const [choiceDetail, setChoiceDetail] = useState({}); // screen_id -> typed detail (e.g. the other location)
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(new Set()); // keys of steps already saved
  const [picked, setPicked] = useState({}); // question_id -> [option_id]
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [cartOpen, setCartOpen] = useState(false); // mobile cart sheet

  useEffect(() => {
    setPlan(planId); // every request below belongs to this plan
    Promise.all([api('/questions'), api('/answers/mine'), api('/packages'), api('/visitation'), api('/choices'), api('/ceremony'), api('/extras'), api('/qty'), api('/cart'), api(`/plans/${planId}`)])
      .then(([qs, mine, pk, v, ch, ce, ex, qy, c, pl]) => {
        setPlanInfo(pl);
        const p = {};
        mine.forEach((a) => { if (a.question_id) (p[a.question_id] ||= []).push(a.option_id); });
        setPicked(p);
        setQuestions(qs);
        setPkgs(pk);
        setVis(v);
        setScreens(ch);
        setCer(ce);
        setCart(c.cart);
        setPkgPick(c.cart?.package_id ?? null);
        setVisPick(c.cart?.visitation_id ?? null);
        setEmb(c.cart?.embalming ?? null);
        setChoicePick(c.cart?.choices ?? {});
        setChoiceDetail(c.cart?.choiceDetails ?? {});
        setExScreens(ex);
        setQtyScreens(qy);
        setQtyPick(c.cart?.qty ?? {});
        setExSel(Object.fromEntries(Object.values(c.cart?.extras ?? {}).flat().map((x) => [x.item_id, { on: true, choice_id: x.choice_id, choice_ids: x.choice_ids ?? [], text: x.text ?? '', note: x.note ?? '' }])));
        setCerPick(c.cart?.ceremony?.ceremony_id ?? null);
        setCerAdd(Object.fromEntries((c.cart?.ceremony?.addons ?? []).slice(0, 1).map((a) => [a.id, { on: true, amount: a.amount ?? '' }])));

        // Work out which steps were already saved, and resume at the first one still pending.
        const cart = c.cart;
        const doneKeys = new Set();
        qs.forEach((x) => { if (p[x.id]?.length) doneKeys.add(`q-${x.id}`); });
        if (cart?.package_id && pk.packages.some((x) => x.id === cart.package_id)) doneKeys.add('pkg');
        const vt = v.types.find((x) => x.id === cart?.visitation_id);
        if (vt && (!vt.followup_title || cart.embalming)) doneKeys.add('vis');
        ch.forEach((x) => { if (x.options.some((o) => o.id === cart?.choices?.[x.id]) || (x.skippable && cart?.skipped?.includes(x.id))) doneKeys.add(`choice-${x.id}`); });
        if (ce.types.some((x) => x.id === cart?.ceremony?.ceremony_id)) doneKeys.add('cer');
        if (cart?.confirmed_at) doneKeys.add('review');
        ex.forEach((x) => { if (cart?.extras && x.id in cart.extras) doneKeys.add(`extras-${x.id}`); });
        qy.forEach((x) => { if (cart?.qty && x.id in cart.qty) doneKeys.add(`qty-${x.id}`); });
        setCompleted(doneKeys);
        const all = buildSteps({ qs, pk, v, ch, cer: ce, ex, qy });
        const pending = all.findIndex((x) => !doneKeys.has(stepKey(x)));
        if (pending === -1) setDone(true);
        else setStep(pending);
      }).catch((e) => setError(e.message));
  }, [planId]);

  if (error && !questions) return <div className="narrow center"><p className="error">{error}</p><Link to="/plans">{T('planner.back_plans')}</Link></div>;
  if (!questions) return <PlanSkeleton />;

  const visType = vis.types.find((t) => t.id === visPick);
  const steps = buildSteps({ qs: questions, pk: pkgs, v: vis, ch: screens, cer, ex: exScreens, qy: qtyScreens });

  if (done)
    return (
      <div className="card done-card center">
        <span className="ns-check" aria-hidden="true">&#10003;</span>
        <h1>{T('thanks.title')}</h1>
        <p className="muted">{cart?.confirmed_at ? T('thanks.confirmed') : T('thanks.saved')}</p>
        <dl className="done-summary" aria-label="Summary of your plan">
          <div><dt>{T('thanks.plan_label')}</dt><dd>{planInfo?.name || T('thanks.default_plan')}</dd></div>
          <div><dt>{T('thanks.selections_label')}</dt><dd>{(cart?.sections || []).filter((x) => x.lines.length).length}</dd></div>
          <div className="total"><dt>{T('thanks.total_label')}</dt><dd>{money(cart?.total || 0)}</dd></div>
        </dl>
        {cart?.confirmed_at && <NextSteps planName={planInfo?.name} />}
        <div className="done-nav">
          <p className="done-nav-title">{T('thanks.change')}</p>
          <nav className="stepper" aria-label="Go to a step">
            {steps.map((st, i) => (
              <button key={stepKey(st)} type="button" className={'stp done' + (st.kind === 'review' ? ' review-dot' : '')}
                title={stepLabel(st, vis, pkgs, cer, T('review.step_label'))} aria-label={`Go to step ${i + 1}: ${stepLabel(st, vis, pkgs, cer, T('review.step_label'))}`}
                onClick={() => { setDone(false); setStep(i); window.scrollTo(0, 0); }}>{i + 1}</button>
            ))}
          </nav>
        </div>
        <div className="done-actions">
          <Link className="btn-go" to="/plans">{T('thanks.back_plans')}</Link>
          <button type="button" className="btn-go strong" onClick={() => { setDone(false); setStep(steps.length - 1); window.scrollTo(0, 0); }}>{T('thanks.view_summary')}</button>
        </div>
      </div>
    );

  const cur = steps[Math.min(step, steps.length - 1)];
  const isLast = step + 1 >= steps.length;
  const q = cur.q;
  const sel = q ? picked[q.id] || [] : [];
  const pickedPkg = pkgs.packages.find((p) => p.id === pkgPick);
  const detailOf = (screen) => (choiceDetail[screen.id] || '').trim();
  const chosenOpt = cur.kind === 'choice' ? cur.screen.options.find((o) => o.id === choicePick[cur.screen.id]) : undefined;
  const cerType = cer.types.find((t) => t.id === cerPick);
  // An add-on tied to a choice option (e.g. escort service -> church) only shows when that option is selected.
  const addonAvailable = (a) => !a.requires_option_id || Object.values(choicePick).includes(a.requires_option_id);
  // a ticked custom-amount option is mandatory and must be at least the admin's minimum
  const amountBad = (a) => a.kind === 'custom' && addonAvailable(a) && !!cerAdd[a.id]?.on && !(+cerAdd[a.id].amount > 0 && +cerAdd[a.id].amount >= a.min_amount);
  const customBad = !!cerType?.has_addons && cerType.addons.some(amountBad);
  const visibleAddons = cerType?.has_addons ? cerType.addons.filter(addonAvailable) : [];
  const noAddonPicked = visibleAddons.length > 0 && !visibleAddons.some((a) => cerAdd[a.id]?.on);

  const toggle = (id) => {
    setError('');
    setPicked({ ...picked, [q.id]: q.type === 'multi' ? (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]) : [id] });
  };

  const exInvalid = (i) => {
    const st = exSel[i.id];
    if (!st?.on) return false;
    if (i.kind === 'choices') {
      const c = i.choices.find((x) => x.id === st.choice_id);
      return !c || (c.ask_note && !st.note?.trim());
    }
    if (i.kind === 'multi') {
      const n = (st.choice_ids || []).length;
      return n < (i.min_select ?? 1) || (i.max_select > 0 && n > i.max_select);
    }
    if (i.kind === 'text') return !st.text?.trim();
    return false;
  };
  const qtyN = cur.kind === 'qty' ? qtyPick[cur.screen.id] : undefined;
  const exBad = cur.kind === 'extras' && cur.screen.items.some(exInvalid);

  const ready = {
    review: true, q: sel.length > 0, pkg: !!pkgPick, vis: !!visPick && (!visType?.followup_title || !!emb), choice: !!chosenOpt && (!chosenOpt.ask_detail || !!detailOf(cur.screen)), cer: !!cerType && !customBad && !noAddonPicked, extras: !exBad, qty: !!qtyN,
  }[cur.kind];

  const next = async () => {
    setError('');
    if (!ready)
      return setError(
        cur.kind === 'vis' && visPick && !emb ? T('err.followup')
          : cur.kind === 'extras' ? T('err.extras')
          : cur.kind === 'qty' ? T('err.qty')
          : cur.kind === 'cer' && cerType && noAddonPicked ? T('err.cer_pick')
          : cur.kind === 'cer' && cerType ? T('err.cer_amount')
            : T('err.choose'));
    setBusy(true);
    try {
      if (cur.kind === 'q') await api('/answers', { method: 'POST', body: { question_id: q.id, option_ids: sel } });
      else if (cur.kind === 'pkg') setCart((await api('/cart', { method: 'POST', body: { package_id: pkgPick } })).cart);
      else if (cur.kind === 'vis')
        setCart((await api('/cart/visitation', { method: 'POST', body: { visitation_id: visPick, ...(visType.followup_title ? { embalming: emb } : {}) } })).cart);
      else if (cur.kind === 'qty') setCart((await api('/cart/qty', { method: 'POST', body: { screen_id: cur.screen.id, qty: qtyN } })).cart);
      else if (cur.kind === 'extras')
        setCart((await api('/cart/extras', { method: 'POST', body: {
          screen_id: cur.screen.id,
          selections: cur.screen.items.filter((i) => exSel[i.id]?.on).map((i) => ({
            item_id: i.id,
            ...(i.kind === 'choices' ? { choice_id: exSel[i.id].choice_id, ...(exSel[i.id].note?.trim() ? { note: exSel[i.id].note.trim() } : {}) } : {}),
            ...(i.kind === 'multi' ? { choice_ids: exSel[i.id].choice_ids || [] } : {}),
            ...(i.kind === 'text' ? { text: exSel[i.id].text.trim() } : {}),
          })),
        } })).cart);
      else if (cur.kind === 'cer') {
        const addons = cerType.has_addons
          ? cerType.addons.filter((a) => cerAdd[a.id]?.on && addonAvailable(a)).map((a) => ({ id: a.id, ...(a.kind === 'custom' ? { amount: +cerAdd[a.id].amount } : {}) }))
          : [];
        setCart((await api('/cart/ceremony', { method: 'POST', body: { ceremony_id: cerPick, addons } })).cart);
      } else setCart((await api('/cart/choice', { method: 'POST', body: { screen_id: cur.screen.id, option_id: choicePick[cur.screen.id], ...(chosenOpt?.ask_detail ? { detail: detailOf(cur.screen) } : {}) } })).cart);
      setCompleted(new Set([...completed, stepKey(cur)]));
      isLast ? setDone(true) : setStep(step + 1);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  // Skippable choice screens let the customer move on without picking anything; the skip is saved so they aren't sent back.
  const skip = async () => {
    setError(''); setBusy(true);
    try {
      if (cur.kind === 'extras') {
        setCart((await api('/cart/extras', { method: 'POST', body: { screen_id: cur.screen.id, skip: true } })).cart);
        setExSel(Object.fromEntries(Object.entries(exSel).filter(([k]) => !cur.screen.items.some((i) => i.id === +k))));
      } else {
        setCart((await api('/cart/choice', { method: 'POST', body: { screen_id: cur.screen.id, skip: true } })).cart);
        setChoicePick(Object.fromEntries(Object.entries(choicePick).filter(([k]) => +k !== cur.screen.id)));
      }
      setCompleted(new Set([...completed, stepKey(cur)]));
      isLast ? setDone(true) : setStep(step + 1);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const title = { q: q?.title, pkg: pkgs.title, vis: vis.title, choice: cur.screen?.title, extras: cur.screen?.title, qty: cur.screen?.title, cer: cer.title, review: T('review.title') }[cur.kind];

  // Live cart preview: saved sections, with the section for the current screen replaced by the pending selection.
  const preview = (() => {
    let key = null;
    let section = null;
    if (cur.kind === 'pkg' && pickedPkg) { key = 'package'; section = { key, order: 3, title: pickedPkg.name, lines: pickedPkg.lines }; }
    if (cur.kind === 'vis' && visType) {
      const answered = visType.followup_title && emb;
      key = 'visitation';
      section = {
        key, order: 4, title: visType.name + (answered ? ` (${T('ui.embalming', { answer: emb === 'yes' ? T('ui.yes') : T('ui.no') })})` : ''),
        lines: lineList([...rulesFor(visType, 'always'), ...(answered ? rulesFor(visType, emb) : [])]),
      };
    }
    if (cur.kind === 'choice' && chosenOpt) {
      key = `choice-${cur.screen.id}`;
      section = { key, order: cur.screen.sort_order, screen_id: cur.screen.id, title: cur.screen.name, lines: [{ label: chosenOpt.ask_detail && detailOf(cur.screen) ? `${chosenOpt.name}: ${detailOf(cur.screen)}` : chosenOpt.name, fee: chosenOpt.fee }] };
    }
    if (cur.kind === 'cer' && cerType) {
      key = 'ceremony';
      section = { key, order: cer.order, title: cerType.name, lines: ceremonyLines(cerType, cerAdd, addonAvailable) };
    }
    if (cur.kind === 'extras') {
      key = `extras-${cur.screen.id}`;
      section = { key, order: cur.screen.sort_order, screen_id: cur.screen.id, title: cur.screen.name, lines: exLines(cur.screen, exSel) };
    }
    if (cur.kind === 'qty' && qtyN) {
      key = `qty-${cur.screen.id}`;
      section = { key, order: cur.screen.sort_order, screen_id: cur.screen.id, title: cur.screen.name, lines: qtyLines(cur.screen, qtyN, T) };
    }
    if (!section) return null;
    section = { ...section, pending: true }; // highlighted in the cart as the selection being made
    return { sections: [...(cart?.sections || []).filter((s) => s.key !== key), section].sort((a, b) => a.order - b.order) };
  })();

  const cards = {
    qty: () => {
      const sc = cur.screen;
      const nums = Array.from({ length: sc.max_qty - sc.min_qty + 1 }, (_, k) => sc.min_qty + k);
      const lines = qtyN ? qtyLines(sc, qtyN, T) : [];
      const sum = lines.reduce((t, l) => t + l.fee, 0);
      return (
        <div className="qty-wrap">
          {sc.uses && (
            <div className="qty-box">
              <strong>{sc.uses_title || T('qty.uses_default')}</strong>
              <ul>{sc.uses.split('\n').filter((x) => x.trim()).map((x, i) => <li key={i}>{x.trim()}</li>)}</ul>
            </div>
          )}
          <h2 id="qty-q" className="qty-q">{sc.question || T('qty.question_default')}</h2>
          <div className="qty-box pricing">
            <strong>{T('qty.pricing')}</strong>
            <ul>
              <li>{T('qty.first_price', { price: money(sc.first_price) })}</li>
              <li>{T('qty.extra_price', { price: money(sc.extra_price) })}</li>
            </ul>
          </div>
          <div className="qty-grid" role="radiogroup" aria-labelledby="qty-q">
            {nums.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={qtyN === k} className={'qty-btn' + (qtyN === k ? ' on' : '')}
                onClick={() => { setError(''); setQtyPick({ ...qtyPick, [sc.id]: k }); }}>
                <span className="n">{k}</span><span className="u">{k === 1 ? T('qty.copy') : T('qty.copies')}</span>
              </button>
            ))}
          </div>
          <p className="qty-summary" aria-live="polite">
            {qtyN ? (qtyN === 1 ? T('qty.summary_one', { n: qtyN, first: money(sc.first_price), total: money(sum) }) : T('qty.summary_many', { n: qtyN, first: money(sc.first_price), more: qtyN - 1, price: money(sc.extra_price), total: money(sum) })) : T('qty.choose')}
          </p>
          {sc.note && <p className="qty-note">{sc.note}</p>}
        </div>
      );
    },
    extras: () => cur.screen.items.map((i) => {
      const st = exSel[i.id] || {};
      const set = (patch) => { setError(''); setExSel({ ...exSel, [i.id]: { ...st, ...patch } }); };
      return (
        <div key={i.id} className={'extra' + (st.on ? ' on' : '')}>
          <label className="extra-head">
            <input type="checkbox" checked={!!st.on} onChange={(e) => set({ on: e.target.checked })} />
            <span className="extra-body">
              <strong>{i.name}{i.recommended && <em className="rec">{T('ui.recommended')}</em>}</strong>
              {i.description && <span>{i.description}</span>}
              {i.examples && <span className="examples"><em>{i.examples_label || T('ui.common_example')}</em><Schedule text={i.examples} /></span>}
              <InfoBlocks text={i.info} />
            </span>
            <span className="price">{i.kind === 'choices' ? T('ui.price_by_pref') : i.kind === 'multi' ? (i.fee > 0 ? T('ui.from_price', { price: money(i.fee) }) : T('ui.price_by_sel')) : money(i.fee)}</span>
          </label>
          {st.on && i.kind === 'choices' && (
            <fieldset className="extra-sub" role="radiogroup">
              <legend>{i.sub_title || T('ui.pref_default')} <span className="req" aria-hidden="true">*</span></legend>
              {i.choices.map((c) => (
                <label key={c.id} className={'extra-choice' + (st.choice_id === c.id ? ' on' : '')}>
                  <input type="radio" name={`ex-${i.id}`} checked={st.choice_id === c.id} onChange={() => set({ choice_id: c.id })} />
                  <span>{c.name}</span><span className="price">{money(c.fee)}</span>
                </label>
              ))}
              {i.choices.find((c) => c.id === st.choice_id)?.ask_note && (() => {
                const c = i.choices.find((x) => x.id === st.choice_id);
                const bad = !st.note?.trim();
                return (
                  <div className="extra-note">
                    <label htmlFor={`ex-n-${i.id}`}>{c.note_label || T('ui.note_default')} <span className="req" aria-hidden="true">*</span></label>
                    <textarea id={`ex-n-${i.id}`} rows={3} maxLength={500} required value={st.note ?? ''} aria-invalid={bad}
                      placeholder={T('ui.note_placeholder')} onChange={(e) => set({ note: e.target.value })} />
                    <p className={bad ? 'error' : 'muted'}>{T('ui.note_required', { n: (st.note || '').length })}</p>
                  </div>
                );
              })()}
            </fieldset>
          )}
          {st.on && i.kind === 'multi' && (() => {
            const ids = st.choice_ids || [];
            const max = i.max_select > 0 ? i.max_select : 0;
            const min = i.min_select ?? 1;
            const picked = i.choices.filter((c) => ids.includes(c.id));
            const extra = picked.reduce((t, c) => t + c.fee, 0);
            return (
              <fieldset className="extra-sub" role="group">
                <legend>
                  {i.sub_title || T('ui.choose_default')}
                  {min > 0 ? <span className="req" aria-hidden="true"> *</span> : <span className="muted"> {T('ui.optional')}</span>}
                  {max > 0 && <span className="muted"> {T('ui.choose_up_to', { max })}</span>}
                </legend>
                {i.choices.map((c) => {
                  const on = ids.includes(c.id);
                  const blocked = !on && max > 0 && ids.length >= max;
                  return (
                    <label key={c.id} className={'extra-choice' + (on ? ' on' : '') + (blocked ? ' off' : '')}>
                      <input type="checkbox" checked={on} disabled={blocked}
                        onChange={() => set({ choice_ids: on ? ids.filter((x) => x !== c.id) : [...ids, c.id] })} />
                      <span>{c.name}</span><span className="price">+ {money(c.fee)}</span>
                    </label>
                  );
                })}
                <p className={exInvalid(i) ? 'error' : 'muted'}>
                  {ids.length ? (max ? T('ui.selected_of', { n: ids.length, max }) : T('ui.selected', { n: ids.length })) : min > 0 ? T('ui.choose_min') : T('ui.tick_optional')}
                </p>
                {(i.fee > 0 || i.bundle) && (
                  <div className="bundle-total" aria-live="polite">
                    <span>{i.name}</span>
                    <span>{picked.length > 0 ? T('ui.base_total', { base: money(i.fee), extra: money(extra), total: money(i.fee + extra) }) : T('ui.base_only', { base: money(i.fee), total: money(i.fee) })}</span>
                  </div>
                )}
              </fieldset>
            );
          })()}
          {st.on && i.kind === 'text' && (
            <div className="extra-sub">
              <label htmlFor={`ex-t-${i.id}`}>{i.text_label || T('ui.pref_default')} <span className="req" aria-hidden="true">*</span></label>
              <input id={`ex-t-${i.id}`} type="text" maxLength={200} required placeholder={i.text_placeholder || ''} value={st.text ?? ''}
                aria-invalid={exInvalid(i)} onChange={(e) => set({ text: e.target.value })} />
              <p className={exInvalid(i) ? 'error' : 'muted'}>{T('ui.text_required', { label: (i.text_label || T('ui.pref_default')).toLowerCase() })}</p>
            </div>
          )}
        </div>
      );
    }),
    pkg: () => pkgs.packages.map((p) => (
      <button key={p.id} type="button" className={'option' + (pkgPick === p.id ? ' selected' : '')}
        role="radio" aria-checked={pkgPick === p.id} onClick={() => { setError(''); setPkgPick(p.id); }}>
        <strong>{p.name}{p.tag && ` (${p.tag})`}</strong>
        {p.description && <span>{p.description}</span>}
        {p.schedule && <span className="examples"><em>{T('ui.example')}</em><Schedule text={p.schedule} /></span>}
        {p.note && <span>{p.note}</span>}
        {p.services.length > 0 && <span className="muted">{T('ui.includes', { items: p.services.map((x) => x.name).join(', ') })}</span>}
        <span className="price">{money(p.total)}</span>
      </button>
    )),
    vis: () => vis.types.map((t) => {
      const inc = rulesFor(t, 'always');
      return (
        <button key={t.id} type="button" className={'option' + (visPick === t.id ? ' selected' : '')}
          role="radio" aria-checked={visPick === t.id} onClick={() => { setError(''); setVisPick(t.id); if (t.id !== visPick) setEmb(null); }}>
          <strong>{t.name}</strong>
          {t.description && <span>{t.description}</span>}
          <Examples text={t.examples} />
          {inc.length > 0 && <span className="muted">{T('ui.includes', { items: inc.map((r) => r.name).join(', ') })}</span>}
          {inc.length > 0 && <span className="price">{money(sum(inc))}</span>}
        </button>
      );
    }),
    emb: () => ['yes', 'no'].map((a) => {
      const rs = rulesFor(visType, a);
      return (
        <button key={a} type="button" className={'option' + (emb === a ? ' selected' : '')}
          role="radio" aria-checked={emb === a} onClick={() => { setError(''); setEmb(a); }}>
          <strong>{a === 'yes' ? T('ui.yes') : T('ui.no')}</strong>
          {rs.length > 0 && <span className="muted">{T('ui.includes', { items: rs.map((r) => r.name).join(', ') })}</span>}
          <span className="price">{money(sum(rs))}</span>
        </button>
      );
    }),
    cer: () => cer.types.map((t) => (
      <button key={t.id} type="button" className={'option' + (cerPick === t.id ? ' selected' : '')}
        role="radio" aria-checked={cerPick === t.id} onClick={() => { setError(''); setCerPick(t.id); }}>
        <strong>{t.name}</strong>
        {t.description && <span>{t.description}</span>}
        {t.examples && <span className="examples"><em>{t.examples_label || T('ui.common_example')}</em><Schedule text={t.examples} /></span>}
        <span className="price">{t.has_addons ? T('ui.cer_cost') : money(t.fee)}</span>
      </button>
    )),
    choice: () => cur.screen.options.map((o) => (
      <button key={o.id} type="button" className={'option' + (choicePick[cur.screen.id] === o.id ? ' selected' : '')}
        role="radio" aria-checked={choicePick[cur.screen.id] === o.id}
        onClick={() => { setError(''); setChoicePick({ ...choicePick, [cur.screen.id]: o.id }); }}>
        <strong>{o.name}</strong>
        {o.description && <span>{o.description}</span>}
        <Examples text={o.examples} label={o.examples_label || T('ui.common_example')} />
        {o.note && (
          <span className="why">
            {o.note_title && <strong>{o.note_title}</strong>}
            <span>{o.note}</span>
          </span>
        )}
        <span className="price">{money(o.fee)}</span>
      </button>
    )),
  };

  const shownCart = preview || cart; // the cart panel always shows something: the live preview, else what is saved
  const cartTotal = (shownCart?.sections || []).reduce((t, x) => t + x.lines.reduce((a, l) => a + +l.fee, 0), 0);
  const optCount = { q: q?.options.length, pkg: pkgs.packages.length, vis: vis.types.length, choice: cur.kind === 'choice' ? cur.screen.options.length : 0, cer: cer.types.length }[cur.kind];
  const optsClass = 'options' + (optCount === 2 ? ' two' : '');

  return (
    <div className="flow plan">
      <div className="plan-bar">
        <Link to="/plans">{T('planner.my_plans')}</Link>
        {planInfo && <span className="plan-name">{planInfo.name}</span>}
        {planInfo && user && planInfo.user_id !== user.id && <span className="plan-owner">{T('planner.editing', { name: planInfo.owner_name })}</span>}
      </div>
      <div className="plan-head">
        <div className="progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
          <div style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <nav className="stepper" aria-label="Planning steps">
          {steps.map((s, i) => {
            const isDone = completed.has(stepKey(s));
            const reachable = steps.slice(0, i).every((x) => completed.has(stepKey(x))); // can't skip past an unanswered step
            return (
              <button key={stepKey(s)} type="button" disabled={!reachable}
                className={'stp' + (i === step ? ' current' : '') + (isDone ? ' done' : '')}
                aria-current={i === step ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${stepLabel(s, vis, pkgs, cer, T('review.step_label'))}${isDone ? ' (completed)' : ''}`}
                title={stepLabel(s, vis, pkgs, cer, T('review.step_label'))}
                onClick={() => { setError(''); setStep(i); }}>
                {isDone && i !== step ? '\u2713' : i + 1}
              </button>
            );
          })}
        </nav>
        <p className="plan-count"><strong>{T('planner.step_of', { n: step + 1, total: steps.length })}</strong><span> &middot; {T('planner.saved')}</span></p>
      </div>

      <div className="plan-grid">
        {cur.kind === 'review' ? (
          <ReviewStep planName={planInfo?.name} stepKeys={steps.map(stepKey)} onBack={() => setStep(step - 1)} onEdit={(i) => { setError(''); setStep(i); window.scrollTo(0, 0); }}
            onConfirmed={async () => { setCompleted(new Set([...completed, 'review'])); setCart((await api('/cart')).cart); setDone(true); window.scrollTo(0, 0); }} />
        ) : (
          <>
        <section className="plan-main" aria-labelledby="step-title">
          <h1 id="step-title">{title}</h1>
          {cur.kind === 'q' && q.subtitle && <p className="plan-sub">{q.subtitle}</p>}
          {(cur.kind === 'choice' || cur.kind === 'extras' || cur.kind === 'qty') && cur.screen.intro && <p className="screen-intro">{cur.screen.intro}</p>}
          {cur.kind === 'q' && q.type === 'multi' && <p className="plan-sub">{T('planner.select_all')}</p>}

          {cur.kind === 'q' ? (
            <div className={optsClass} role={q.type === 'multi' ? 'group' : 'radiogroup'} aria-labelledby="step-title">
              {q.options.map((o) => (
                <button key={o.id} type="button" className={'option' + (sel.includes(o.id) ? ' selected' : '')}
                  role={q.type === 'multi' ? 'checkbox' : 'radio'} aria-checked={sel.includes(o.id)} onClick={() => toggle(o.id)}>
                  <strong>{o.label}</strong>
                  {o.description && <span>{o.description}</span>}
                  <Examples text={o.examples} />
                </button>
              ))}
            </div>
          ) : (
            <div className={optsClass} role={cur.kind === 'extras' || cur.kind === 'qty' ? 'group' : 'radiogroup'} aria-labelledby="step-title">{cards[cur.kind]()}</div>
          )}
          {cur.kind === 'choice' && chosenOpt?.ask_detail && (
            <div className="followup detail-ask">
              <label htmlFor="choice-detail">{chosenOpt.detail_label || chosenOpt.name}</label>
              <input id="choice-detail" value={choiceDetail[cur.screen.id] || ''} maxLength={500} required autoFocus
                onChange={(e) => { setError(''); setChoiceDetail({ ...choiceDetail, [cur.screen.id]: e.target.value }); }} />
            </div>
          )}

          {cur.kind === 'vis' && visType?.followup_title && (
            <div className="followup" role="group" aria-labelledby="followup-q">
              <h2 id="followup-q">{visType.followup_title}</h2>
              <div className="options two" role="radiogroup" aria-labelledby="followup-q">{cards.emb()}</div>
            </div>
          )}

          {cur.kind === 'cer' && cerType?.has_addons && (
            <fieldset className="followup addons" role="radiogroup">
              <legend>{T('planner.legend_cer', { name: cerType.name })}</legend>
              {cerType.addons.filter(addonAvailable).map((a) => {
                const st = cerAdd[a.id] || {};
                return (
                  <div key={a.id} className={'addon' + (st.on ? ' on' : '')}>
                    <label className="check">
                      <input type="radio" name="cer-addon" checked={!!st.on}
                        onChange={() => { setError(''); setCerAdd({ [a.id]: { on: true, amount: st.amount ?? '' } }); }} />
                      <span>{a.name}{a.recommended && <em className="rec">{T('ui.recommended')}</em>}</span>
                      {a.kind === 'fixed' ? <span className="price">{money(a.fee)}</span> : <span className="price">{st.on && +st.amount > 0 ? money(st.amount) : T('ui.your_amount')}</span>}
                    </label>
                    {a.note && <p className="addon-note">{a.note}</p>}
                    {a.kind === 'custom' && st.on && (
                      <div className="custom-amt">
                        <label htmlFor={`amt-${a.id}`}>{T('ui.amount_label')} <span className="req" aria-hidden="true">*</span></label>
                        <input id={`amt-${a.id}`} type="number" required min={a.min_amount || 0} step="0.01" inputMode="decimal" placeholder="0.00"
                          value={st.amount ?? ''} aria-invalid={amountBad(a)} aria-describedby={`amt-help-${a.id}`}
                          onChange={(e) => { setError(''); setCerAdd({ ...cerAdd, [a.id]: { ...st, amount: e.target.value } }); }} />
                        <p id={`amt-help-${a.id}`} className={amountBad(a) ? 'error' : 'muted'}>
                          {a.min_amount > 0 ? T('ui.amount_min', { min: money(a.min_amount) }) : T('ui.amount_any')}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </fieldset>
          )}

          {error && <p className="error plan-error" role="alert">{error}</p>}
          <div className="actions">
            <button className="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>{T('planner.back')}</button>
            {(cur.kind === 'choice' || cur.kind === 'extras') && cur.screen.skippable && (
              <button className="link skip-btn" disabled={busy} onClick={skip}>{isLast ? T('planner.skip_finish') : T('planner.skip')}</button>
            )}
            <button className="primary" disabled={busy} onClick={next}>{isLast ? T('planner.finish') : T('planner.continue')}</button>
          </div>
        </section>

        <aside className={'plan-cart' + (cartOpen ? ' open' : '')} aria-label="Your cart">
          <div className="plan-cart-in">
            <button type="button" className="cart-close secondary" onClick={() => setCartOpen(false)}>{T('planner.close_cart')}</button>
            <Cart cart={shownCart} emptyText={T('planner.cart_empty')} />
            <p className="cart-note">{T('planner.cart_note')}</p>
          </div>
        </aside>
          </>
        )}
      </div>

      <div className={'cart-bar' + (cur.kind === 'review' ? ' hide' : '')}>
        <div><span>{T('planner.cart_total')}</span><strong>{money(cartTotal)}</strong></div>
        <button type="button" className="secondary" onClick={() => setCartOpen(true)}>{T('planner.view_cart')}</button>
      </div>
    </div>
  );
}
