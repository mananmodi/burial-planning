import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const fmt = (s) => (s ? new Date(String(s).replace(' ', 'T') + 'Z').toLocaleString() : '—');
const day = (s) => (s ? new Date(String(s).replace(' ', 'T') + 'Z').toLocaleDateString() : '—');
const blank = () => ({ name: '', email: '', role: 'user', password: '' });

// Customers: add, edit (including a new password), delete, and jump to each customer's plans.
export default function AdminCustomers() {
  const [users, setUsers] = useState(null);
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api('/admin/customers').then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const t = search.trim().toLowerCase();
    return (users || []).filter((u) => !t || u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t));
  }, [users, search]);

  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await api(edit.id ? `/admin/customers/${edit.id}` : '/admin/customers', { method: edit.id ? 'PUT' : 'POST', body: edit });
      setMsg(edit.id ? 'Saved.' : 'Customer added.');
      setEdit(null);
      load();
    } catch (err) { setError(err.message); }
  };
  const remove = async (u) => {
    if (!confirm(`Delete ${u.name} (${u.email})? Their ${u.plans} plan(s) and everything chosen in them will be removed. This cannot be undone.`)) return;
    setError(''); setMsg('');
    try { await api(`/admin/customers/${u.id}`, { method: 'DELETE' }); load(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="wide">
      <div className="row between">
        <h1>Customers</h1>
        <div className="plan-filters">
          <input type="search" placeholder="Search name or email" aria-label="Search customers" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="primary" onClick={() => { setEdit(blank()); setMsg(''); }}>+ New customer</button>
        </div>
      </div>
      <p className="muted">Everyone with an account. Open a customer to see all of their plans and exactly what they selected.</p>
      {error && <p className="error" role="alert">{error}</p>}
      {msg && <p className="muted" role="status">{msg}</p>}

      {edit && (
        <form className="card" onSubmit={save}>
          <h2>{edit.id ? `Edit ${edit.name || 'customer'}` : 'New customer'}</h2>
          <div className="row">
            <label>Name<input value={edit.name} onChange={set('name')} required /></label>
            <label>Email<input type="email" value={edit.email} onChange={set('email')} required /></label>
            <label>Role
              <select value={edit.role} onChange={set('role')}>
                <option value="user">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <label>{edit.id ? 'New password (leave blank to keep the current one)' : 'Password (at least 6 characters)'}
            <input type="text" autoComplete="new-password" value={edit.password} onChange={set('password')} minLength={edit.password ? 6 : undefined} required={!edit.id} />
          </label>
          <div className="actions">
            <button type="button" className="secondary" onClick={() => setEdit(null)}>Cancel</button>
            <button className="primary">{edit.id ? 'Save changes' : 'Add customer'}</button>
          </div>
        </form>
      )}

      {!users && <p className="muted">Loading…</p>}
      {users && (
        <table>
          <thead><tr><th>Customer</th><th>Role</th><th>Plans</th><th>Last activity</th><th>Joined</th><th /></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong><br /><span className="muted">{u.email}</span></td>
                <td>{u.role === 'admin' ? <span className="badge">Admin</span> : 'Customer'}</td>
                <td>{u.plans}{u.confirmed_plans > 0 && <span className="badge ok">{u.confirmed_plans} confirmed</span>}</td>
                <td>{fmt(u.last_activity)}</td>
                <td>{day(u.created_at)}</td>
                <td className="nowrap">
                  <Link className="btn-sm primary-sm" to={`/admin/customers/${u.id}`}>Plans &amp; summary</Link>{' '}
                  <button className="secondary" onClick={() => { setEdit({ id: u.id, name: u.name, email: u.email, role: u.role, password: '' }); setMsg(''); window.scrollTo(0, 0); }}>Edit</button>{' '}
                  <button className="danger" onClick={() => remove(u)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="muted">No customers match.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
