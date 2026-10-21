import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { money, useT } from '../site.jsx';
import { useAuth } from '../auth.jsx';

const when = (s) => (s ? new Date(String(s).replace(' ', 'T') + 'Z').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');

// "My plans": a customer can keep several plannings (for different people, or to compare options).
export default function Plans() {
  const T = useT();
  const { user } = useAuth();
  const nav = useNavigate();
  const [plans, setPlans] = useState(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api('/plans').then(setPlans).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const create = (e) => {
    e.preventDefault();
    run(async () => { const p = await api('/plans', { method: 'POST', body: { name } }); nav(`/plan/${p.id}`); });
  };
  const rename = (e) => {
    e.preventDefault();
    run(async () => { await api(`/plans/${editing.id}`, { method: 'PUT', body: { name: editing.name } }); setEditing(null); await load(); });
  };
  const duplicate = (p) => run(async () => { await api(`/plans/${p.id}/duplicate`, { method: 'POST' }); await load(); });
  const remove = (p) => {
    if (!confirm(T('plans.confirm_delete', { name: p.name }))) return;
    run(async () => { await api(`/plans/${p.id}`, { method: 'DELETE' }); await load(); });
  };

  return (
    <div className="plans-page">
      <div className="plans-head">
        <div>
          <h1>{T('plans.title')}</h1>
          <p className="muted">{T('plans.intro', { name: user?.name })}</p>
        </div>
        <form className="new-plan" onSubmit={create}>
          <label className="sr-only" htmlFor="new-plan-name">Name for a new plan</label>
          <input id="new-plan-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder={T('plans.name_placeholder')} />
          <button className="primary" disabled={busy}>{T('plans.new_btn')}</button>
        </form>
      </div>
      {error && <p className="error plan-error" role="alert">{error}</p>}

      {!plans && <div className="plan-cards" role="status" aria-busy="true">{[0, 1].map((i) => <div key={i} className="sk plan-card-sk" />)}</div>}

      {plans && plans.length === 0 && (
        <div className="card center empty-plans">
          <h2>{T('plans.empty_title')}</h2>
          <p className="muted">{T('plans.empty_body')}</p>
        </div>
      )}

      <div className="plan-cards">
        {(plans || []).map((p) => (
          <article key={p.id} className="plan-card">
            <header>
              {editing?.id === p.id ? (
                <form className="rename" onSubmit={rename}>
                  <input autoFocus value={editing.name} maxLength={120} aria-label="Plan name" onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  <button className="primary" disabled={busy}>{T('plans.btn_save')}</button>
                  <button type="button" className="secondary" onClick={() => setEditing(null)}>{T('plans.btn_cancel')}</button>
                </form>
              ) : <h2>{p.name}</h2>}
              <span className={'pill ' + (p.confirmed_at ? 'ok' : 'wip')}>{p.confirmed_at ? T('plans.status_confirmed') : p.items ? T('plans.status_progress') : T('plans.status_new')}</span>
            </header>
            <dl>
              <div><dt>{T('plans.total')}</dt><dd className="big">{money(p.total)}</dd></div>
              <div><dt>{T('plans.selections')}</dt><dd>{p.items}</dd></div>
              <div><dt>{T('plans.updated')}</dt><dd>{when(p.updated_at)}</dd></div>
            </dl>
            <div className="plan-actions">
              <Link className="primary btn" to={`/plan/${p.id}`}>{p.confirmed_at ? T('plans.btn_edit') : p.items ? T('plans.btn_continue') : T('plans.btn_start')}</Link>
              <button className="secondary" disabled={busy} onClick={() => setEditing({ id: p.id, name: p.name })}>{T('plans.btn_rename')}</button>
              <button className="secondary" disabled={busy} onClick={() => duplicate(p)}>{T('plans.btn_duplicate')}</button>
              <button className="danger" disabled={busy} onClick={() => remove(p)}>{T('plans.btn_delete')}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
