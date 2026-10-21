import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { money } from '../site.jsx';

const maskSsn = (s) => (s ? `•••-••-${String(s).slice(-4)}` : '—');
function Profile({ p }) {
  if (!p) return null;
  const rows = [
    ['Sex', p.sex], ['Date of birth', p.dob], ['Age', p.age], ['Height', `${p.height_ft}′ ${p.height_in}″`], ['Weight', `${p.weight} lbs`], ['Social Security #', maskSsn(p.ssn)],
    ['Address', `${p.address}, ${p.city}, ${p.state} ${p.zip}`], ['Home phone', p.home_phone || '—'], ['Cell phone', p.cell_phone || '—'],
    ['Primary beneficiary', `${p.primary_name} (${p.primary_relationship})`], ['Contingent beneficiary', p.contingent_name ? `${p.contingent_name} (${p.contingent_relationship})` : '—'],
  ];
  return (
    <div className="card profile-card">
      <h2 style={{ marginTop: 0 }}>Profile</h2>
      <dl className="profile-dl">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </div>
  );
}

const fmt = (s) => (s ? new Date(String(s).replace(' ', 'T') + 'Z').toLocaleString() : '—');

// Everything one plan holds: grouped selections with costs, the total, and the customer's raw answers.
function PlanSummary({ planId }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [raw, setRaw] = useState(false);
  useEffect(() => { api(`/admin/plans/${planId}`).then(setD).catch((e) => setError(e.message)); }, [planId]);
  if (error) return <p className="error">{error}</p>;
  if (!d) return <p className="muted">Loading summary…</p>;
  const { summary } = d;
  const chosen = summary.groups.filter((g) => g.lines.length || g.details.length);
  return (
    <div className="admin-summary">
      <div className="as-top">
        <div><span className="as-label">Estimated total</span><strong className="as-total">{money(summary.total)}</strong></div>
        <div>{summary.confirmed_at ? <span className="badge ok">Confirmed {fmt(summary.confirmed_at)}</span> : <span className="badge">Not confirmed yet</span>}</div>
      </div>
      {chosen.length === 0 && <p className="muted">Nothing selected in this plan yet.</p>}
      <div className="as-grid">
        {chosen.map((g) => (
          <article key={g.id} className="rv-card">
            <header>
              <h2>{g.label}</h2>
              <span className="rv-sub">{money(g.subtotal)}</span>
            </header>
            {g.details.length > 0 && <ul className="rv-details">{g.details.map((x, i) => <li key={i}>{x}</li>)}</ul>}
            {g.lines.length > 0 && <table><tbody>{g.lines.map((l, i) => <tr key={i}><td>{l.label}</td><td className="amt">{money(l.fee)}</td></tr>)}</tbody></table>}
          </article>
        ))}
      </div>
      {summary.groups.length > chosen.length && (
        <p className="muted">Not selected: {summary.groups.filter((g) => !g.lines.length && !g.details.length).map((g) => g.label).join(', ')}.</p>
      )}
      {d.payments?.length > 0 && (
        <p className="as-pay">{d.payments.map((p) => (
          <span key={p.id} className={'badge ' + (p.status === 'paid' ? 'ok' : '')}>Payment {p.amount} &middot; {p.status} &middot; {p.mode}</span>
        ))}</p>
      )}
      <button className="link" onClick={() => setRaw(!raw)}>{raw ? 'Hide' : 'Show'} the customer's answers ({d.answers.length})</button>
      {raw && (
        <table>
          <thead><tr><th>Question</th><th>Answer</th><th>When</th></tr></thead>
          <tbody>{d.answers.map((a, i) => <tr key={i}><td>{a.question_text}</td><td>{a.option_label}</td><td>{fmt(a.created_at)}</td></tr>)}</tbody>
        </table>
      )}
    </div>
  );
}

// One customer: their plans, each with a full summary and simple management buttons.
export default function AdminCustomer() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  const load = () => api(`/admin/customers/${id}`).then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  const act = async (fn) => { setError(''); try { await fn(); await load(); } catch (e) { setError(e.message); } };
  const rename = (p) => {
    const name = prompt('Plan name', p.name);
    if (name && name.trim()) act(() => api(`/admin/plans/${p.id}`, { method: 'PUT', body: { name, archived: p.archived } }));
  };
  const archive = (p) => act(() => api(`/admin/plans/${p.id}`, { method: 'PUT', body: { name: p.name, archived: !p.archived } }));
  const remove = (p) => {
    if (!confirm(`Delete "${p.name}"? Everything chosen in this plan is removed. This cannot be undone.`)) return;
    act(async () => { await api(`/admin/plans/${p.id}`, { method: 'DELETE' }); setOpen(null); });
  };

  if (error && !data) return <div className="wide"><p className="error">{error}</p><Link to="/admin/customers">← All customers</Link></div>;
  if (!data) return <div className="wide"><p className="muted">Loading…</p></div>;
  const { user, plans } = data;

  return (
    <div className="wide">
      <p><Link to="/admin/customers">&larr; All customers</Link></p>
      <div className="row between">
        <div>
          <h1 style={{ marginBottom: 2 }}>{user.name}</h1>
          <p className="muted" style={{ margin: 0 }}>{user.email} &middot; {user.role === 'admin' ? 'Admin' : 'Customer'} &middot; joined {fmt(user.created_at)}</p>
        </div>
      </div>
      <Profile p={user.profile} />
      {error && <p className="error" role="alert">{error}</p>}
      <h2>Plans ({plans.length})</h2>
      {plans.length === 0 && <p className="muted">This customer has not started a plan yet.</p>}

      {plans.map((p) => (
        <div className={'card plan-admin' + (p.archived ? ' archived' : '')} key={p.id}>
          <div className="row between">
            <div>
              <h3 style={{ margin: 0 }}>{p.name} {p.archived && <span className="badge">Archived</span>} {p.confirmed_at ? <span className="badge ok">Confirmed</span> : <span className="badge">{p.items ? 'In progress' : 'Not started'}</span>}</h3>
              <p className="muted" style={{ margin: '4px 0 0' }}>{p.items} selection{p.items === 1 ? '' : 's'} &middot; updated {fmt(p.updated_at)} &middot; estimated total <strong>{money(p.total)}</strong></p>
            </div>
            <div className="nowrap plan-admin-actions">
              <button className="secondary" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Hide summary' : 'View summary'}</button>{' '}
              <a className="btn-sm" href={`/plan/${p.id}`} target="_blank" rel="noreferrer">Edit in planner ↗</a>{' '}
              <button className="secondary" onClick={() => rename(p)}>Rename</button>{' '}
              <button className="secondary" onClick={() => archive(p)}>{p.archived ? 'Restore' : 'Archive'}</button>{' '}
              <button className="danger" onClick={() => remove(p)}>Delete</button>
            </div>
          </div>
          {open === p.id && <PlanSummary planId={p.id} />}
        </div>
      ))}
    </div>
  );
}
