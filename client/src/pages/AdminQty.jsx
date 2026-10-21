import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { money } from '../site.jsx';

const blank = () => ({
  name: '', title: '', intro: '', uses_title: 'Common Uses', uses: '', question: 'How many copies would you like?', note: '',
  first_price: 0, extra_price: 0, min_qty: 1, max_qty: 10, sort_order: 0, active: true,
});

function Editor({ screen, onSave, onCancel }) {
  const [f, setF] = useState(screen);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const minN = Math.trunc(+f.min_qty) || 0;
  const maxN = Math.trunc(+f.max_qty) || 0;
  const rangeBad = minN < 1 || maxN < minN || maxN > 100;
  const sample = Math.max(minN, Math.min(maxN, 5));
  const sampleTotal = (+f.first_price || 0) + Math.max(sample - 1, 0) * (+f.extra_price || 0);
  const save = async () => {
    if (rangeBad) return setError('Copies must start at 1 or more, the maximum cannot be below the minimum, and 100 is the highest allowed.');
    try {
      await api(f.id ? `/admin/qty/${f.id}` : '/admin/qty', { method: f.id ? 'PUT' : 'POST', body: f });
      onSave();
    } catch (e) { setError(e.message); }
  };
  return (
    <div className="card editor">
      <h2>{f.id ? `Edit: ${screen.name}` : 'New copies screen'}</h2>
      <div className="row">
        <label>Admin name<input value={f.name} onChange={set('name')} /></label>
        <label>Screen order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Shown to customers</label>
      </div>
      <label>Screen title<input value={f.title} onChange={set('title')} /></label>
      <label>Intro text<textarea rows={2} value={f.intro || ''} onChange={set('intro')} /></label>
      <div className="row">
        <label>Uses heading<input value={f.uses_title || ''} onChange={set('uses_title')} /></label>
      </div>
      <label>Common uses (one per line)<textarea rows={5} value={f.uses || ''} onChange={set('uses')} /></label>
      <label>Question above the number buttons<input value={f.question || ''} onChange={set('question')} /></label>

      <h3>Pricing</h3>
      <div className="row">
        <label>First copy price (USD)<input type="number" min="0" step="0.01" value={f.first_price} onChange={set('first_price')} /></label>
        <label>Additional copy price (USD each)<input type="number" min="0" step="0.01" value={f.extra_price} onChange={set('extra_price')} /></label>
        <label>Fewest copies<input type="number" min="1" max="100" value={f.min_qty} onChange={set('min_qty')} /></label>
        <label>Most copies<input type="number" min="1" max="100" value={f.max_qty} onChange={set('max_qty')} /></label>
      </div>
      <p className={'total-line' + (rangeBad ? ' error' : '')}>
        {rangeBad ? 'Fix the copy range: the minimum must be at least 1 and the maximum cannot be below it.'
          : <>Customers choose {minN}–{maxN} copies. Example: {sample} {sample === 1 ? 'copy' : 'copies'} = {money(+f.first_price || 0)} first copy
            {sample > 1 && <> + {sample - 1} × {money(+f.extra_price || 0)}</>} = <strong>{money(sampleTotal)}</strong></>}
      </p>
      <label>Note under the buttons (optional)<input value={f.note || ''} onChange={set('note')} placeholder="e.g. Most families obtain between 5 and 10 copies." /></label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}

export default function AdminQty() {
  const [list, setList] = useState([]);
  const [sp] = useSearchParams();
  const only = sp.get('screen'); // set when opened from a sidebar link: show just that screen
  const shown = only ? list.filter((s) => String(s.id) === only) : list;
  const [editing, setEditing] = useState(null);
  const load = () => api('/admin/qty').then(setList);
  useEffect(() => { load(); }, []);
  const remove = async (s) => {
    if (!confirm(`Delete "${s.name}"? Customers' saved carts keep their prices.`)) return;
    await api(`/admin/qty/${s.id}`, { method: 'DELETE' });
    load();
  };
  return (
    <div className="wide">
      <div className="row between">
        <h1>Copies &amp; certificates</h1>
        <button className="primary" onClick={() => setEditing({ ...blank(), sort_order: list.length + 11 })}>+ New copies screen</button>
      </div>
      <p className="muted">Screens where the customer chooses how many copies they want. The first copy and each additional copy have their own price.</p>

      {editing && <Editor key={editing.id || 'new'} screen={editing} onCancel={() => setEditing(null)} onSave={() => { setEditing(null); load(); }} />}

      {only && <p className="muted">Showing one screen. <Link to="/admin/qty">Show all</Link></p>}
      {shown.map((s) => (
        <div className="card" key={s.id}>
          <div className="row between">
            <h2>{s.sort_order}. {s.name} {!s.active && <span className="badge">Hidden</span>}</h2>
            <div className="nowrap">
              <button className="secondary" onClick={() => { setEditing(s); window.scrollTo(0, 0); }}>Edit</button>{' '}
              <button className="danger" onClick={() => remove(s)}>Delete</button>
            </div>
          </div>
          <p className="muted">{s.title}</p>
          <table>
            <tbody>
              <tr><td>First copy</td><td className="amt">{money(s.first_price)}</td></tr>
              <tr><td>Each additional copy</td><td className="amt">{money(s.extra_price)}</td></tr>
              <tr><td>Customers can choose</td><td className="amt">{s.min_qty} to {s.max_qty} copies</td></tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
