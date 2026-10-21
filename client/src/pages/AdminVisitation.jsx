import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { money } from '../site.jsx';

const blank = () => ({ name: '', description: '', examples: '', followup_title: '', active: true, sort_order: 0, rules: [] });
const GROUPS = [
  ['always', 'Automatically added'],
  ['yes', 'Added if the answer is Yes'],
  ['no', 'Added if the answer is No'],
];
const r2 = (n) => Math.round((+n || 0) * 100) / 100;

// Checklist of services for one rule group, each with its own fee for this visitation type.
function RuleGroup({ applies, label, rules, services, onChange }) {
  const mine = (id) => rules.find((r) => r.applies === applies && r.service_id === id);
  const toggle = (s) => onChange(mine(s.id)
    ? rules.filter((r) => r !== mine(s.id))
    : [...rules, { service_id: s.id, applies, fee: s.fee }]);
  const setFee = (id, v) => onChange(rules.map((r) => (r === mine(id) ? { ...r, fee: v } : r)));
  const total = r2(rules.filter((r) => r.applies === applies).reduce((t, r) => t + (+r.fee || 0), 0));
  return (
    <fieldset className="rule-group">
      <legend>{label} <span className="muted">— subtotal {money(total)}</span></legend>
      <table className="svc-table">
        <tbody>
          {services.map((s) => {
            const r = mine(s.id);
            return (
              <tr key={s.id}>
                <td><input type="checkbox" checked={!!r} onChange={() => toggle(s)} aria-label={`${label}: ${s.name}`} /></td>
                <td>{s.name}{!s.active && <span className="badge">inactive</span>}</td>
                <td>{r
                  ? <input className="fee-in" type="number" min="0" step="0.01" value={r.fee} onChange={(e) => setFee(s.id, e.target.value)} aria-label={`${s.name} fee`} />
                  : <span className="muted">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </fieldset>
  );
}

function Editor({ item, services, onSave, onCancel }) {
  const [f, setF] = useState(item);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const hasFollow = f.followup_title.trim() !== '';
  const save = async () => {
    try {
      await api(f.id ? `/admin/visitation/${f.id}` : '/admin/visitation', { method: f.id ? 'PUT' : 'POST', body: f });
      onSave();
    } catch (e) { setError(e.message); }
  };
  // Rules for Yes/No are only meaningful while a follow-up question exists.
  const shown = GROUPS.filter(([a]) => a === 'always' || hasFollow);
  return (
    <div className="card editor">
      <h2>{f.id ? `Edit: ${item.name}` : 'New visitation type'}</h2>
      <div className="row">
        <label>Name<input value={f.name} onChange={set('name')} /></label>
        <label>Order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Shown to customers</label>
      </div>
      <label>Description<textarea rows={2} value={f.description} onChange={set('description')} /></label>
      <label>Common Example (one line each)<textarea rows={3} value={f.examples} onChange={set('examples')} /></label>
      <label>Follow-up question (optional, answered Yes / No){' '}
        <input value={f.followup_title} onChange={set('followup_title')} placeholder="e.g. Would You Like Embalming Performed?" />
      </label>
      <p className="muted hint">Leave the follow-up blank for types like Open Casket where services are always added.</p>

      <h3>Casket Services and Fees</h3>
      {shown.map(([a, label]) => (
        <RuleGroup key={a} applies={a} label={label} rules={f.rules} services={services} onChange={(rules) => setF({ ...f, rules })} />
      ))}
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}

export default function AdminVisitation() {
  const [list, setList] = useState([]);
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => Promise.all([api('/admin/visitation'), api('/admin/services'), api('/admin/settings')])
    .then(([v, s, st]) => { setList(v); setServices(s); setTitle(st.screen4_title || ''); });
  useEffect(() => { load(); }, []);

  const saveTitle = async () => { await api('/admin/settings', { method: 'PUT', body: { screen4_title: title } }); setMsg('Saved.'); };
  const remove = async (v) => {
    if (!confirm(`Delete "${v.name}"? Customers' saved carts keep their prices.`)) return;
    await api(`/admin/visitation/${v.id}`, { method: 'DELETE' });
    load();
  };
  const sub = (v, a) => r2(v.rules.filter((r) => r.applies === a && r.active).reduce((t, r) => t + r.fee, 0));

  return (
    <div className="wide">
      <div className="row between">
        <h1>Visitation</h1>
        <button className="primary" onClick={() => setEditing({ ...blank(), sort_order: list.length + 1 })}>+ New visitation type</button>
      </div>

      <div className="card">
        <label>Screen 4 question shown to customers
          <input value={title ?? ''} onChange={(e) => { setTitle(e.target.value); setMsg(''); }} />
        </label>
        <button className="secondary" onClick={saveTitle}>Save question text</button> <span className="muted">{msg}</span>
      </div>

      {editing && <Editor key={editing.id || 'new'} item={editing} services={services} onCancel={() => setEditing(null)}
        onSave={() => { setEditing(null); load(); }} />}

      {list.map((v) => (
        <div className="card" key={v.id}>
          <div className="row between">
            <h2>{v.name} {!v.active && <span className="badge">Hidden</span>}</h2>
            <div className="nowrap">
              <button className="secondary" onClick={() => { setEditing(v); window.scrollTo(0, 0); }}>Edit</button>{' '}
              <button className="danger" onClick={() => remove(v)}>Delete</button>
            </div>
          </div>
          <p className="muted">{v.description}</p>
          {v.followup_title && <p><strong>Asks:</strong> {v.followup_title}</p>}
          <table>
            <tbody>
              {GROUPS.filter(([a]) => v.rules.some((r) => r.applies === a)).map(([a, label]) => (
                <React.Fragment key={a}>
                  <tr className="sec"><td colSpan={2}>{label}</td></tr>
                  {v.rules.filter((r) => r.applies === a).map((r) => (
                    <tr key={a + r.service_id}><td>{r.name}{!r.active && ' (inactive: not charged)'}</td><td className="amt">{money(r.fee)}</td></tr>
                  ))}
                  <tr className="subtotal"><td>Subtotal</td><td className="amt">{money(sub(v, a))}</td></tr>
                </React.Fragment>
              ))}
              {!v.rules.length && <tr><td className="muted">No services (no charge)</td><td className="amt">{money(0)}</td></tr>}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
