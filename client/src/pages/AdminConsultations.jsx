import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { money } from '../site.jsx';

const fmt = (s) => (s ? new Date(String(s).replace(' ', 'T') + 'Z').toLocaleString() : '—');
const MAIL = { sent: ['ok', 'Emailed to admin'], failed: ['', 'Email failed'], not_configured: ['', 'Email not set up'], pending: ['', 'Pending'] };

// Consultation requests from customers (also emailed to your team when email is set up).
export default function AdminConsultations() {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const load = () => api('/admin/consultations').then(setList);
  useEffect(() => { load(); }, []);

  const setStatus = async (c, status) => { await api(`/admin/consultations/${c.id}`, { method: 'PUT', body: { status } }); load(); };
  const remove = async (c) => { if (!confirm(`Delete the request from ${c.name}?`)) return; await api(`/admin/consultations/${c.id}`, { method: 'DELETE' }); load(); };

  if (!list) return <p className="muted">Loading…</p>;
  return (
    <div className="wide">
      <h1>Consultation requests</h1>
      <p className="muted">Customers who confirmed an arrangement and asked for a call. Each request keeps a copy of everything they selected.</p>
      {!list.length && <p className="muted">No requests yet.</p>}
      {list.map((c) => {
        const [cls, label] = MAIL[c.email_status] || MAIL.pending;
        const groups = (c.summary.groups || []).filter((g) => g.lines.length || g.details.length);
        return (
          <div className="card" key={c.id}>
            <div className="row between">
              <div>
                <h2 style={{ margin: 0 }}>{c.name} <span className={'badge ' + (c.status === 'new' ? '' : 'ok')}>{c.status}</span></h2>
                <p className="muted" style={{ margin: '4px 0 0' }}>{fmt(c.created_at)} &middot; plan &ldquo;{c.plan_name}&rdquo; &middot; estimate <strong>{money(c.total)}</strong></p>
              </div>
              <div className="nowrap">
                <select value={c.status} onChange={(e) => setStatus(c, e.target.value)} aria-label="Status" style={{ width: 'auto', display: 'inline-block', margin: 0 }}>
                  {['new', 'contacted', 'scheduled', 'done'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>{' '}
                <button className="secondary" onClick={() => setOpen(open === c.id ? null : c.id)}>{open === c.id ? 'Hide' : 'View selections'}</button>{' '}
                <button className="danger" onClick={() => remove(c)}>Delete</button>
              </div>
            </div>
            <table><tbody>
              <tr><td>Phone</td><td><a href={`tel:${c.phone}`}>{c.phone}</a> ({c.contact_method})</td></tr>
              <tr><td>Email</td><td><a href={`mailto:${c.email}`}>{c.email}</a></td></tr>
              <tr><td>Preferred day / time</td><td>{c.preferred_time || '—'}</td></tr>
              <tr><td>Notes</td><td style={{ whiteSpace: 'pre-wrap' }}>{c.notes || '—'}</td></tr>
              <tr><td>Email to admin</td><td><span className={'badge ' + cls}>{label}</span>{c.email_error && <span className="muted"> {c.email_error}</span>}</td></tr>
            </tbody></table>
            {open === c.id && (
              <div className="admin-summary">
                <div className="as-grid">
                  {groups.map((g) => (
                    <article key={g.id} className="rv-card">
                      <header><h2>{g.label}</h2><span className="rv-sub">{money(g.subtotal)}</span></header>
                      {g.details.length > 0 && <ul className="rv-details">{g.details.map((x, i) => <li key={i}>{x}</li>)}</ul>}
                      <table><tbody>{g.lines.map((l, i) => <tr key={i}><td>{l.label}</td><td className="amt">{money(l.fee)}</td></tr>)}</tbody></table>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
