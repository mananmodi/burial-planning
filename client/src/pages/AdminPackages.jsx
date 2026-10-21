import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { money } from '../site.jsx';

const blank = () => ({ name: '', tag: '', description: '', schedule: '', note: '', fee: 0, active: true, sort_order: 0, included: [] });

function Editor({ pkg, services, onSave, onCancel }) {
  const [f, setF] = useState(pkg);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const toggle = (s) => setF({
    ...f,
    included: f.included.some((x) => x.id === s.id) ? f.included.filter((x) => x.id !== s.id) : [...f.included, { id: s.id }],
  });

  const save = async () => {
    try {
      await api(f.id ? `/admin/packages/${f.id}` : '/admin/packages', {
        method: f.id ? 'PUT' : 'POST', body: { ...f, services: f.included },
      });
      onSave();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="card editor">
      <h2>{f.id ? `Edit: ${pkg.name}` : 'New package'}</h2>
      <div className="row">
        <label>Package name<input value={f.name} onChange={set('name')} /></label>
        <label>Label in brackets (optional)<input value={f.tag} onChange={set('tag')} placeholder="e.g. Cremation package" /></label>
        <label>Package fee (USD) — price to customer<input type="number" min="0" step="0.01" value={f.fee} onChange={set('fee')} /></label>
        <label>Order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
      </div>
      <label>Description<textarea rows={2} value={f.description} onChange={set('description')} /></label>
      <label>Example schedule (one item per line; <code>### Day 1</code> starts a group)
        <textarea rows={6} value={f.schedule} onChange={set('schedule')} />
      </label>
      <label>Closing note<textarea rows={2} value={f.note} onChange={set('note')} /></label>

      <h3>Services included in this package</h3>
      <p className="muted hint">Just tick what the package includes. Customers see the package fee above as one price; there are no separate service fees.</p>
      <table className="svc-table">
        <thead><tr><th>Include</th><th>Service</th></tr></thead>
        <tbody>
          {services.map((s) => {
            const on = f.included.some((x) => x.id === s.id);
            return (
              <tr key={s.id}>
                <td><input type="checkbox" checked={on} onChange={() => toggle(s)} aria-label={`Include ${s.name}`} /></td>
                <td>{s.name}{!s.active && <span className="badge">inactive</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Shown to customers</label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={save}>Save package</button>
      </div>
    </div>
  );
}

export default function AdminPackages() {
  const [list, setList] = useState([]);
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => Promise.all([api('/admin/packages'), api('/admin/services'), api('/admin/settings')])
    .then(([p, s, st]) => { setList(p); setServices(s); setTitle(st.screen3_title || ''); });
  useEffect(() => { load(); }, []);

  const saveTitle = async () => { await api('/admin/settings', { method: 'PUT', body: { screen3_title: title } }); setMsg('Saved.'); };
  const remove = async (p) => {
    if (!confirm(`Delete package "${p.name}"? Customers' saved carts keep their prices.`)) return;
    await api(`/admin/packages/${p.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="wide">
      <div className="row between">
        <h1>Packages</h1>
        <button className="primary" onClick={() => setEditing({ ...blank(), sort_order: list.length + 1 })}>+ New package</button>
      </div>

      <div className="card">
        <label>Screen 3 question shown to customers
          <input value={title ?? ''} onChange={(e) => { setTitle(e.target.value); setMsg(''); }} />
        </label>
        <button className="secondary" onClick={saveTitle}>Save question text</button> <span className="muted">{msg}</span>
      </div>

      {editing && <Editor key={editing.id || 'new'} pkg={editing} services={services} onCancel={() => setEditing(null)}
        onSave={() => { setEditing(null); load(); }} />}

      {list.map((p) => (
        <div className="card" key={p.id}>
          <div className="row between">
            <h2>{p.name}{p.tag && ` (${p.tag})`} {!p.active && <span className="badge">Hidden</span>}</h2>
            <div className="nowrap">
              <button className="secondary" onClick={() => { setEditing(p); window.scrollTo(0, 0); }}>Edit</button>{' '}
              <button className="danger" onClick={() => remove(p)}>Delete</button>
            </div>
          </div>
          <table>
            <tbody>
              <tr className="total"><td>Package fee</td><td className="amt">{money(p.total)}</td></tr>
              {p.services.length > 0 && <tr><td colSpan={2} className="muted">Includes: {p.services.map((x) => x.name).join(', ')}</td></tr>}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
