import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { money } from '../site.jsx';

const blankAddon = () => ({ name: '', kind: 'fixed', fee: 0, min_amount: 0, note: '', requires_option_id: '', recommended: false, active: true });
const blank = () => ({ name: '', description: '', examples: '', examples_label: 'Common Example', fee: 0, has_addons: false, active: true, sort_order: 0, addons: [] });

function Editor({ item, choiceOptions, onSave, onCancel }) {
  const [f, setF] = useState(item);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setAdd = (i, k, v) => setF({ ...f, addons: f.addons.map((a, j) => (j === i ? { ...a, [k]: v } : a)) });
  const move = (i, d) => {
    const a = [...f.addons]; const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    setF({ ...f, addons: a });
  };
  const save = async () => {
    try {
      await api(f.id ? `/admin/ceremony/${f.id}` : '/admin/ceremony', { method: f.id ? 'PUT' : 'POST', body: f });
      onSave();
    } catch (e) { setError(e.message); }
  };
  return (
    <div className="card editor">
      <h2>{f.id ? `Edit: ${item.name}` : 'New ceremony type'}</h2>
      <div className="row">
        <label>Name<input value={f.name} onChange={set('name')} /></label>
        <label>Order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Shown to customers</label>
      </div>
      <label>Description<textarea rows={2} value={f.description} onChange={set('description')} /></label>
      <div className="row">
        <label>Examples heading<input value={f.examples_label} onChange={set('examples_label')} /></label>
      </div>
      <label>Examples (one per line; <code>### Day 1</code> starts a group)
        <textarea rows={5} value={f.examples} onChange={set('examples')} />
      </label>

      <label className="check">
        <input type="checkbox" checked={f.has_addons} onChange={set('has_addons')} />
        Cost comes from the options below (customer ticks the ones they want)
      </label>
      {!f.has_addons && (
        <label>Fee (USD)<input type="number" min="0" step="0.01" value={f.fee} onChange={set('fee')} /></label>
      )}

      {f.has_addons && (
        <>
          <h3>Options and fees</h3>
          <p className="muted hint">
            A <strong>fixed</strong> option has the fee you enter. A <strong>customer amount</strong> option makes the customer type a required amount that is added to the cart;
            set the minimum they must enter. The <strong>note</strong> is shown to the customer under the option. Tie an option to a choice
            (e.g. Escort service → Church) and it only appears when the customer picked that choice.
          </p>
          {f.addons.map((a, i) => (
            <div className="section-edit" key={a.id || `n${i}`}>
              <div className="opt-row">
                <input placeholder="Option name" value={a.name} onChange={(e) => setAdd(i, 'name', e.target.value)} />
                <select style={{ maxWidth: 170 }} value={a.kind} onChange={(e) => setAdd(i, 'kind', e.target.value)} aria-label="Type">
                  <option value="fixed">Fixed fee</option>
                  <option value="custom">Customer enters amount</option>
                </select>
                {a.kind === 'fixed' ? (
                  <input className="fee-in" type="number" min="0" step="0.01" aria-label="Fee (USD)" title="Fee (USD)" value={a.fee} onChange={(e) => setAdd(i, 'fee', e.target.value)} />
                ) : (
                  <input className="fee-in" type="number" min="0" step="0.01" aria-label="Minimum amount (USD)" title="Minimum amount the customer must enter (USD)" placeholder="Min amount"
                    value={a.min_amount} onChange={(e) => setAdd(i, 'min_amount', e.target.value)} />
                )}
              </div>
              <textarea rows={2} placeholder="Note shown to the customer under this option (optional)" value={a.note || ''} onChange={(e) => setAdd(i, 'note', e.target.value)} />
              <div className="opt-row">
                <select style={{ flex: 1, minWidth: 200 }} value={a.requires_option_id || ''} onChange={(e) => setAdd(i, 'requires_option_id', e.target.value)} aria-label="Only show when">
                  <option value="">Always available</option>
                  {choiceOptions.map((o) => <option key={o.id} value={o.id}>Only if customer chose: {o.screen} → {o.name}</option>)}
                </select>
                <label className="check"><input type="checkbox" checked={!!a.recommended} onChange={(e) => setAdd(i, 'recommended', e.target.checked)} /> Recommended</label>
                <label className="check"><input type="checkbox" checked={a.active !== false} onChange={(e) => setAdd(i, 'active', e.target.checked)} /> Active</label>
                <button className="secondary" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button className="secondary" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <button className="danger" onClick={() => setF({ ...f, addons: f.addons.filter((_, j) => j !== i) })}>Remove</button>
              </div>
            </div>
          ))}
          <button className="secondary" onClick={() => setF({ ...f, addons: [...f.addons, blankAddon()] })}>+ Add option</button>
        </>
      )}

      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}

export default function AdminCeremony() {
  const [cfg, setCfg] = useState({ title: '', order: 7, types: [] });
  const [choiceOptions, setChoiceOptions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => Promise.all([api('/admin/ceremony'), api('/admin/choices')]).then(([c, ch]) => {
    setCfg(c); setTitle(c.title);
    setChoiceOptions(ch.flatMap((s) => s.options.map((o) => ({ id: o.id, name: o.name, screen: s.name }))));
  });
  useEffect(() => { load(); }, []);

  const saveTitle = async () => { await api('/admin/settings', { method: 'PUT', body: { screen7_title: title } }); setMsg('Saved.'); };
  const remove = async (t) => {
    if (!confirm(`Delete "${t.name}"? Customers' saved carts keep their prices.`)) return;
    await api(`/admin/ceremony/${t.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="wide">
      <div className="row between">
        <h1>Funeral ceremony types</h1>
        <button className="primary" onClick={() => setEditing({ ...blank(), sort_order: cfg.types.length + 1 })}>+ New ceremony type</button>
      </div>

      <div className="card">
        <label>Screen 7 question shown to customers
          <input value={title} onChange={(e) => { setTitle(e.target.value); setMsg(''); }} />
        </label>
        <button className="secondary" onClick={saveTitle}>Save question text</button> <span className="muted">{msg}</span>
      </div>

      {editing && <Editor key={editing.id || 'new'} item={editing} choiceOptions={choiceOptions}
        onCancel={() => setEditing(null)} onSave={() => { setEditing(null); load(); }} />}

      {cfg.types.map((t) => (
        <div className="card" key={t.id}>
          <div className="row between">
            <h2>{t.name} {!t.active && <span className="badge">Hidden</span>}</h2>
            <div className="nowrap">
              <button className="secondary" onClick={() => { setEditing(t); window.scrollTo(0, 0); }}>Edit</button>{' '}
              <button className="danger" onClick={() => remove(t)}>Delete</button>
            </div>
          </div>
          {t.description && <p className="muted">{t.description}</p>}
          <table>
            <tbody>
              {!t.has_addons && <tr><td>Ceremony fee</td><td className="amt">{money(t.fee)}</td></tr>}
              {t.has_addons && t.addons.map((a) => {
                const gate = choiceOptions.find((o) => o.id === a.requires_option_id);
                return (
                  <tr key={a.id}>
                    <td>
                      {a.name}
                      {a.recommended && <span className="badge">Recommended</span>}
                      {!a.active && <span className="badge">inactive</span>}
                      {a.note && <><br /><span className="muted">Note: {a.note}</span></>}
                      {gate && <><br /><span className="muted">Only if customer chose “{gate.name}”</span></>}
                    </td>
                    <td className="amt">{a.kind === 'custom' ? `Customer amount (min ${money(a.min_amount)})` : money(a.fee)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {t.has_addons && <p className="muted hint">Cost = the options the customer ticks.</p>}
        </div>
      ))}
    </div>
  );
}
