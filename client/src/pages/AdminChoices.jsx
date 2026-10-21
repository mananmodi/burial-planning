import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { money } from '../site.jsx';

const blankOpt = () => ({ name: '', description: '', examples: '', examples_label: '', note_title: '', note: '', fee: 0, active: true, ask_detail: false, detail_label: '' });
const blank = () => ({ name: '', title: '', intro: '', skippable: false, sort_order: 0, active: true, options: [blankOpt()] });

function Editor({ item, onSave, onCancel }) {
  const [f, setF] = useState(item);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setOpt = (i, k, v) => setF({ ...f, options: f.options.map((o, j) => (j === i ? { ...o, [k]: v } : o)) });
  const move = (i, d) => {
    const o = [...f.options]; const j = i + d;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    setF({ ...f, options: o });
  };
  const save = async () => {
    try {
      await api(f.id ? `/admin/choices/${f.id}` : '/admin/choices', { method: f.id ? 'PUT' : 'POST', body: f });
      onSave();
    } catch (e) { setError(e.message); }
  };
  return (
    <div className="card editor">
      <h2>{f.id ? `Edit: ${item.name}` : 'New choice screen'}</h2>
      <div className="row">
        <label>Admin name<input value={f.name} onChange={set('name')} placeholder="e.g. Rosary or Prayer Service" /></label>
        <label>Screen order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Shown to customers</label>
        <label className="check"><input type="checkbox" checked={!!f.skippable} onChange={set('skippable')} /> Customers can skip this screen</label>
      </div>
      <label>Question shown to customers<input value={f.title} onChange={set('title')} /></label>
      <label>Intro text under the question (optional)<textarea rows={3} value={f.intro || ''} onChange={set('intro')} placeholder="e.g. Every burial arrangement includes:" /></label>

      <h3>Options and fees</h3>
      {f.options.map((o, i) => (
        <div className="section-edit" key={o.id || `n${i}`}>
          <div className="opt-row">
            <input placeholder="Option name" value={o.name} onChange={(e) => setOpt(i, 'name', e.target.value)} />
            <input className="fee-in" type="number" min="0" step="0.01" aria-label="Fee (USD)" title="Fee (USD)" value={o.fee} onChange={(e) => setOpt(i, 'fee', e.target.value)} />
            <label className="check"><input type="checkbox" checked={o.active !== false} onChange={(e) => setOpt(i, 'active', e.target.checked)} /> Active</label>
            <button className="secondary" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
            <button className="secondary" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
            <button className="danger" onClick={() => setF({ ...f, options: f.options.filter((_, j) => j !== i) })}>Remove</button>
          </div>
          <input placeholder="Description" value={o.description || ''} onChange={(e) => setOpt(i, 'description', e.target.value)} />
          <div className="opt-row">
            <label className="check"><input type="checkbox" checked={!!o.ask_detail} onChange={(e) => setOpt(i, 'ask_detail', e.target.checked)} /> Ask the customer to type details</label>
            {o.ask_detail && <input style={{ flex: 1, minWidth: 220 }} placeholder="Question for the text box (e.g. Please tell us the location)" value={o.detail_label || ''} onChange={(e) => setOpt(i, 'detail_label', e.target.value)} />}
          </div>
          <div className="opt-row">
            <input style={{ maxWidth: 220 }} placeholder="Info heading (e.g. Why Are These Included?)" value={o.note_title || ''} onChange={(e) => setOpt(i, 'note_title', e.target.value)} />
            <textarea style={{ flex: 1, minWidth: 220, margin: 0 }} rows={2} placeholder="Info text shown under the option (optional)" value={o.note || ''} onChange={(e) => setOpt(i, 'note', e.target.value)} />
          </div>
          <div className="opt-row">
            <input style={{ maxWidth: 200 }} placeholder="Examples heading" title="Heading shown above the examples" value={o.examples_label || ''} onChange={(e) => setOpt(i, 'examples_label', e.target.value)} />
            <textarea style={{ flex: 1, minWidth: 220, margin: 0 }} rows={2} placeholder="Example lines, one per line (optional; heading defaults to Common Example)" value={o.examples || ''} onChange={(e) => setOpt(i, 'examples', e.target.value)} />
          </div>
        </div>
      ))}
      <button className="secondary" onClick={() => setF({ ...f, options: [...f.options, blankOpt()] })}>+ Add option</button>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}

export default function AdminChoices() {
  const [list, setList] = useState([]);
  const [sp] = useSearchParams();
  const only = sp.get('screen'); // set when opened from a sidebar link: show just that screen
  const shown = only ? list.filter((s) => String(s.id) === only) : list;
  const [editing, setEditing] = useState(null);
  const load = () => api('/admin/choices').then(setList);
  useEffect(() => { load(); }, []);
  const remove = async (s) => {
    if (!confirm(`Delete "${s.name}"? Customers' saved carts keep their prices.`)) return;
    await api(`/admin/choices/${s.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="wide">
      <div className="row between">
        <h1>Service choices</h1>
        <button className="primary" onClick={() => setEditing({ ...blank(), sort_order: list.length + 5 })}>+ New choice screen</button>
      </div>
      <p className="muted">Single-choice screens where each option has a fee, such as Rosary or Prayer Service. The selected option is added to the customer's cart.</p>

      {editing && <Editor key={editing.id || 'new'} item={editing} onCancel={() => setEditing(null)} onSave={() => { setEditing(null); load(); }} />}

      {only && <p className="muted">Showing one screen. <Link to="/admin/choices">Show all</Link></p>}
      {shown.map((s) => (
        <div className="card" key={s.id}>
          <div className="row between">
            <h2>{s.sort_order}. {s.name} {!s.active && <span className="badge">Hidden</span>}{s.skippable && <span className="badge">Skippable</span>}</h2>
            <div className="nowrap">
              <button className="secondary" onClick={() => { setEditing(s); window.scrollTo(0, 0); }}>Edit</button>{' '}
              <button className="danger" onClick={() => remove(s)}>Delete</button>
            </div>
          </div>
          <p className="muted">{s.title}</p>
          <table>
            <tbody>
              {s.options.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}{!o.active && <span className="badge">inactive</span>}<br /><span className="muted">{o.description}</span></td>
                  <td className="amt">{money(o.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
