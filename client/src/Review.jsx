import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from './api.js';
import { money, useSite, useT } from './site.jsx';
import { useAuth } from './auth.jsx';
import NextSteps from './NextSteps.jsx';

const when = (s) => (s ? new Date(String(s).replace(' ', 'T') + 'Z').toLocaleString() : '');
const day = (s) => (s ? new Date(String(s).replace(' ', 'T') + 'Z') : new Date()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

// What gets printed: rendered into <body> (outside the app) and shown only by the print stylesheet.
function PrintSheet({ data, planName, who }) {
  const T = useT();
  const { settings: s } = useSite();
  if (!data) return null;
  const groups = data.groups.filter((g) => g.lines.length || g.details.length);
  return createPortal(
    <div className="print-root" aria-hidden="true">
      <header className="ps-head">
        <img src="/logo.png" alt="" height="70" />
        <div>
          <h1>{T('print.title')}</h1>
          <p>{s.site_name}<br />{s.address}<br />{s.phone} &middot; {s.email}</p>
        </div>
      </header>
      <p className="ps-meta"><strong>{T('print.plan')}</strong> {planName}<br />{who && <><strong>{T('print.prepared')}</strong> {who}<br /></>}<strong>{T('print.date')}</strong> {day(data.created_at)}</p>
      <table>
        <tbody>
          {groups.map((g) => (
            <React.Fragment key={g.id}>
              <tr className="ps-sec"><td colSpan={2}>{g.label}{g.details.length > 0 && ` – ${g.details.join(', ')}`}</td></tr>
              {g.lines.map((l, i) => <tr key={i}><td>{l.label}</td><td className="amt">{money(l.fee)}</td></tr>)}
            </React.Fragment>
          ))}
          {groups.length === 0 && <tr><td>{T('print.empty')}</td><td /></tr>}
          <tr className="ps-total"><td>{T('print.total')}</td><td className="amt">{money(data.total)}</td></tr>
        </tbody>
      </table>
      <p className="ps-fine">{T('estimate.disclaimer')}</p>
    </div>,
    document.body,
  );
}

// Save / email / print the estimate, and the list of estimates saved for this plan.
function EstimateTools({ data, planName, onPrint }) {
  const T = useT();
  const { user } = useAuth();
  const [saved, setSaved] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [emailOpen, setEmailOpen] = useState(false);
  const [to, setTo] = useState(user?.email || '');
  const [busy, setBusy] = useState(false);

  const load = () => api('/estimates').then(setSaved).catch(() => {});
  useEffect(() => { load(); }, []);

  const run = async (fn, ok) => {
    setBusy(true); setMsg({ type: '', text: '' });
    try { await fn(); setMsg({ type: 'ok', text: ok }); } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setBusy(false);
  };
  const save = () => run(async () => { await api('/estimates', { method: 'POST' }); await load(); }, T('est.msg_saved'));
  const email = (e) => { e.preventDefault(); run(() => api('/estimates/email', { method: 'POST', body: { to } }), T('est.msg_sent', { email: to })); };
  const printSaved = async (id) => { try { onPrint(await api(`/estimates/${id}`)); } catch (e) { setMsg({ type: 'err', text: e.message }); } };
  const del = async (id) => { if (!confirm(T('est.confirm_delete'))) return; await api(`/estimates/${id}`, { method: 'DELETE' }); load(); };

  return (
    <div className="est-card">
      <h3>{T('est.title')}</h3>
      <div className="est-buttons">
        <button type="button" className="secondary" disabled={busy} onClick={save}>{T('est.save')}</button>
        <button type="button" className="secondary" disabled={busy} onClick={() => setEmailOpen(!emailOpen)} aria-expanded={emailOpen}>{T('est.email')}</button>
        <button type="button" className="secondary" onClick={() => onPrint({ groups: data.groups, total: data.total })}>{T('est.print')}</button>
      </div>
      {emailOpen && (
        <form className="est-email" onSubmit={email}>
          <label htmlFor="est-to">{T('est.send_to')}</label>
          <div><input id="est-to" type="email" required value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@example.com" /><button className="primary" disabled={busy}>{T('est.send')}</button></div>
        </form>
      )}
      {msg.text && <p className={msg.type === 'ok' ? 'est-ok' : 'error'} role={msg.type === 'ok' ? 'status' : 'alert'}>{msg.text}</p>}
      {saved.length > 0 && (
        <>
          <h4>{T('est.saved_title')}</h4>
          <ul className="est-saved">
            {saved.map((s) => (
              <li key={s.id}>
                <span>{when(s.created_at)}<strong>{money(s.total)}</strong></span>
                <span><button type="button" className="link" onClick={() => printSaved(s.id)}>{T('est.print_link')}</button><button type="button" className="link" onClick={() => del(s.id)}>{T('est.delete')}</button></span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Final step: grouped summary of every earlier selection, the estimated total, estimate tools and a confirm button.
// Rendered inside .plan-grid, so it returns the two columns (summary + total panel).
export default function ReviewStep({ stepKeys, planName, onEdit, onBack, onConfirmed }) {
  const T = useT();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [printData, setPrintData] = useState(null);

  useEffect(() => { api('/review').then(setData).catch((e) => setError(e.message)); }, []);

  const doPrint = (snap) => { setPrintData(snap); setTimeout(() => window.print(), 200); };

  if (error && !data) return <p className="error plan-error">{error}</p>;
  if (!data) {
    return (
      <>
        <div className="plan-main" role="status" aria-busy="true" aria-label="Loading your summary">
          <span className="sk" style={{ width: '60%', height: 38 }} />
          <div style={{ height: 18 }} />
          {[0, 1, 2, 3].map((i) => <div key={i} className="sk sk-card" />)}
        </div>
        <div className="review-total"><div className="sk sk-cart" style={{ height: 260 }} /></div>
      </>
    );
  }

  const chosen = data.groups.filter((g) => g.lines.length || g.details.length);
  const confirm = async () => {
    setBusy(true); setError('');
    try { await api('/arrangement/confirm', { method: 'POST' }); await onConfirmed(); }
    catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <>
      <section className="plan-main review" aria-labelledby="step-title">
        <h1 id="step-title">{T('review.title')}</h1>
        <p className="plan-sub">{T('review.summary')}</p>
        <p className="screen-intro">{T('review.intro')}</p>

        {data.confirmed_at && <NextSteps planName={planName} />}

        {data.groups.map((g) => {
          const empty = !g.lines.length && !g.details.length;
          const target = g.steps.map((k) => stepKeys.indexOf(k)).find((i) => i >= 0);
          return (
            <article key={g.id} className={'rv-card' + (empty ? ' empty' : '')}>
              <header>
                <h2>{g.label}</h2>
                {!empty && <span className="rv-sub">{money(g.subtotal)}</span>}
                {target !== undefined && <button type="button" className="secondary rv-edit" onClick={() => onEdit(target)} aria-label={`${T('review.edit')} ${g.label}`}>{T('review.edit')}</button>}
              </header>
              {empty ? <p className="muted rv-none">{T('review.not_selected')}</p> : (
                <>
                  {g.details.length > 0 && <ul className="rv-details">{g.details.map((d, i) => <li key={i}>{d}</li>)}</ul>}
                  {g.lines.length > 0 && (
                    <table>
                      <tbody>{g.lines.map((l, i) => <tr key={i}><td>{l.label}</td><td className="amt">{money(l.fee)}</td></tr>)}</tbody>
                    </table>
                  )}
                </>
              )}
            </article>
          );
        })}
        <div className="actions"><button className="secondary" onClick={onBack}>{T('review.back')}</button></div>
      </section>

      <aside className="review-total" aria-label="Estimated total">
        <div className="review-total-in">
          <span className="rt-label">{T('review.total_label')}</span>
          <strong className="rt-amount" aria-live="polite">{money(data.total)}</strong>
          <p className="rt-note">{T(chosen.length === 1 ? 'review.items_one' : 'review.items_many', { count: chosen.length })}</p>
          {data.confirmed_at && <p className="rt-ok" role="status">{T('review.confirmed_on', { date: when(data.confirmed_at) })}</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary rt-confirm" disabled={busy} onClick={confirm}>{busy ? T('review.saving') : data.confirmed_at ? T('review.confirm_again') : T('review.confirm')}</button>
          <p className="rt-fine">{T('review.fine')}</p>
        </div>
        <EstimateTools data={data} planName={planName} onPrint={doPrint} />
      </aside>
      <PrintSheet data={printData} planName={planName} who={user?.name} />
    </>
  );
}
