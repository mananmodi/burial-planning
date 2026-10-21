import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const blank = () => ({ title: '', subtitle: '', type: 'single', sort_order: 0, active: true, options: [{ label: '', description: '' }] });

function Editor({ q, onSave, onCancel }) {
  const [f, setF] = useState(q);
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
      await api(f.id ? `/admin/questions/${f.id}` : '/admin/questions', { method: f.id ? 'PUT' : 'POST', body: f });
      onSave();
    } catch (e) { setError(e.message); }
  };
  return (
    <div className="card editor">
      <label>Question text<input value={f.title} onChange={set('title')} /></label>
      <label>Helper text (optional)<input value={f.subtitle} onChange={set('subtitle')} /></label>
      <div className="row">
        <label>Answer type
          <select value={f.type} onChange={set('type')}>
            <option value="single">Single choice</option>
            <option value="multi">Multiple choice</option>
          </select>
        </label>
        <label>Screen order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Shown to visitors</label>
      </div>
      <h3>Options</h3>
      {f.options.map((o, i) => (
        <div className="section-edit" key={o.id || `n${i}`}>
          <div className="opt-row">
            <input placeholder="Option label" value={o.label} onChange={(e) => setOpt(i, 'label', e.target.value)} />
            <input placeholder="Description" value={o.description || ''} onChange={(e) => setOpt(i, 'description', e.target.value)} />
            <button className="secondary" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
            <button className="secondary" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
            <button className="danger" onClick={() => setF({ ...f, options: f.options.filter((_, j) => j !== i) })}>Remove</button>
          </div>
          <textarea rows={3} placeholder={'"Common Example" bullets, one per line (optional)'} value={o.examples || ''} onChange={(e) => setOpt(i, 'examples', e.target.value)} />
        </div>
      ))}
      <button className="secondary" onClick={() => setF({ ...f, options: [...f.options, { label: '', description: '' }] })}>+ Add option</button>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={save}>Save question</button>
      </div>
    </div>
  );
}

export default function AdminQuestions() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = () => api('/admin/questions').then(setList);
  useEffect(() => { load(); }, []);

  const remove = async (q) => {
    if (!confirm(`Delete "${q.title}"? Past submissions are kept.`)) return;
    await api(`/admin/questions/${q.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="wide">
      <div className="row between">
        <h1>Manage questions</h1>
        <button className="primary" onClick={() => setEditing({ ...blank(), sort_order: list.length + 1 })}>+ New question</button>
      </div>
      {editing && <Editor key={editing.id || 'new'} q={editing} onCancel={() => setEditing(null)} onSave={() => { setEditing(null); load(); }} />}
      {list.map((q) => (
        <div className="card" key={q.id}>
          <div className="row between">
            <h2>{q.sort_order}. {q.title} {!q.active && <span className="badge">Hidden</span>}</h2>
            <div>
              <button className="secondary" onClick={() => setEditing(q)}>Edit</button>{' '}
              <button className="danger" onClick={() => remove(q)}>Delete</button>
            </div>
          </div>
          <p className="muted">{q.type === 'multi' ? 'Multiple choice' : 'Single choice'}{q.subtitle && ` · ${q.subtitle}`}</p>
          <ul>{q.options.map((o) => <li key={o.id}><strong>{o.label}</strong>{o.description && ` — ${o.description}`}{o.examples && <em className="muted"> (Examples: {o.examples.split('\n').filter(Boolean).join(', ')})</em>}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
