import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { money } from '../site.jsx';

const blank = () => ({ name: '', description: '', fee: 0, active: true, sort_order: 0 });

export default function AdminServices() {
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/admin/services').then(setList);
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = async () => {
    try {
      await api(edit.id ? `/admin/services/${edit.id}` : '/admin/services', { method: edit.id ? 'PUT' : 'POST', body: edit });
      setEdit(null); setError(''); load();
    } catch (e) { setError(e.message); }
  };
  const remove = async (s) => {
    if (!confirm(`Delete "${s.name}"? It will be removed from every package.`)) return;
    await api(`/admin/services/${s.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="wide">
      <div className="row between">
        <h1>Casket Services &amp; Fees</h1>
        <button className="primary" onClick={() => setEdit({ ...blank(), sort_order: list.length + 1 })}>+ New service</button>
      </div>
      <p className="muted">The default fee pre-fills when you add a service to a package. Set the fee each service carries inside a package on the Packages page.</p>

      {edit && (
        <div className="card">
          <div className="row">
            <label>Service name<input value={edit.name} onChange={set('name')} /></label>
            <label>Default fee (USD)<input type="number" min="0" step="0.01" value={edit.fee} onChange={set('fee')} /></label>
            <label>Order<input type="number" value={edit.sort_order} onChange={set('sort_order')} /></label>
          </div>
          <label>Description (optional)<input value={edit.description} onChange={set('description')} /></label>
          <label className="check"><input type="checkbox" checked={edit.active} onChange={set('active')} /> Active</label>
          {error && <p className="error">{error}</p>}
          <div className="actions">
            <button className="secondary" onClick={() => { setEdit(null); setError(''); }}>Cancel</button>
            <button className="primary" onClick={save}>Save service</button>
          </div>
        </div>
      )}

      <table>
        <thead><tr><th>Order</th><th>Service</th><th>Description</th><th>Fee</th><th>Status</th><th /></tr></thead>
        <tbody>
          {list.map((s) => (
            <tr key={s.id}>
              <td>{s.sort_order}</td><td>{s.name}</td><td>{s.description}</td><td>{money(s.fee)}</td>
              <td>{s.active ? 'Active' : <span className="badge">Inactive</span>}</td>
              <td className="nowrap">
                <button className="secondary" onClick={() => setEdit(s)}>Edit</button>{' '}
                <button className="danger" onClick={() => remove(s)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
