import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { money } from '../site.jsx';

const blankChoice = () => ({ name: '', fee: 0, ask_note: false, note_label: '', active: true });
const blankItem = () => ({
  name: '', description: '', examples: '', examples_label: 'Common Example', kind: 'plain', fee: 0,
  sub_title: '', text_label: '', text_placeholder: '', recommended: false, active: true, choices: [], max_select: 0, min_select: 1, bundle: false, info: '',
});
const blank = () => ({ name: '', title: '', intro: '', skippable: false, sort_order: 0, active: true, items: [blankItem()] });
const KINDS = {
  plain: 'Fee when ticked',
  choices: 'Customer picks ONE preference (each has a fee)',
  multi: 'Customer ticks ANY of several options (each has a fee)',
  text: 'Customer types a text answer (fee when ticked)',
};

function ItemEditor({ item, onChange, onMove, onRemove }) {
  const set = (k, v) => onChange({ ...item, [k]: v });
  const setChoice = (i, k, v) => set('choices', item.choices.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
  const moveChoice = (i, d) => {
    const a = [...item.choices]; const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    set('choices', a);
  };
  return (
    <div className="section-edit">
      <div className="opt-row">
        <input placeholder="Item name (e.g. Floral Tribute Selection)" value={item.name} onChange={(e) => set('name', e.target.value)} />
        <button className="secondary" onClick={() => onMove(-1)} aria-label="Move up">↑</button>
        <button className="secondary" onClick={() => onMove(1)} aria-label="Move down">↓</button>
        <button className="danger" onClick={onRemove}>Remove</button>
      </div>
      <textarea rows={2} placeholder="Description shown to the customer" value={item.description || ''} onChange={(e) => set('description', e.target.value)} />
      <div className="opt-row">
        <input style={{ maxWidth: 200 }} placeholder="Examples heading" value={item.examples_label || ''} onChange={(e) => set('examples_label', e.target.value)} />
        <textarea style={{ flex: 1, minWidth: 220, margin: 0 }} rows={2} placeholder="Examples, one per line (### Heading makes a lead-in line)" value={item.examples || ''} onChange={(e) => set('examples', e.target.value)} />
      </div>
      <textarea rows={3} placeholder={'Info blocks (optional). Write "### What Is This?" on its own line, then the text. Repeat for more blocks.'} value={item.info || ''} onChange={(e) => set('info', e.target.value)} />
      <div className="opt-row">
        <select style={{ flex: 1, minWidth: 240 }} value={item.kind} onChange={(e) => set('kind', e.target.value)} aria-label="What happens when ticked">
          {Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        {item.kind !== 'choices' && (
          <input className="fee-in" type="number" min="0" step="0.01" aria-label={item.kind === 'multi' ? 'Base price (USD)' : 'Fee (USD)'} placeholder={item.kind === 'multi' ? 'Base price' : ''}
            title={item.kind === 'multi' ? 'Base price charged when the item is ticked (e.g. the included hearse and flower vehicle). 0 for none.' : 'Fee (USD)'} value={item.fee} onChange={(e) => set('fee', e.target.value)} />
        )}
        {item.kind === 'multi' && (
          <>
            <input className="fee-in" type="number" min="0" step="1" aria-label="Fewest choices" title="Fewest options the customer must choose (0 = the options are optional)" placeholder="Min"
              value={item.min_select} onChange={(e) => set('min_select', e.target.value)} />
            <input className="fee-in" type="number" min="0" step="1" aria-label="Most choices" title="Most options the customer may choose (0 = no limit)" placeholder="Max"
              value={item.max_select} onChange={(e) => set('max_select', e.target.value)} />
            <label className="check"><input type="checkbox" checked={!!item.bundle} onChange={(e) => set('bundle', e.target.checked)} /> One cart line (base + options)</label>
          </>
        )}
        <label className="check"><input type="checkbox" checked={!!item.recommended} onChange={(e) => set('recommended', e.target.checked)} /> Recommended</label>
        <label className="check"><input type="checkbox" checked={item.active !== false} onChange={(e) => set('active', e.target.checked)} /> Active</label>
      </div>

      {item.kind === 'text' && (
        <div className="opt-row">
          <input placeholder="Field label (e.g. Color Preference)" value={item.text_label || ''} onChange={(e) => set('text_label', e.target.value)} />
          <input placeholder="Placeholder (e.g. white and blue)" value={item.text_placeholder || ''} onChange={(e) => set('text_placeholder', e.target.value)} />
        </div>
      )}

      {(item.kind === 'choices' || item.kind === 'multi') && (
        <div className="rule-group">
          <p className="muted hint">{item.kind === 'multi' ? 'Shown under the item once ticked. Set a base price above (charged when the item is ticked), then each option below adds its own fee. Min 0 makes the options optional; Max caps how many can be chosen. "One cart line" shows base + options as a single charge.' : 'Shown under the item once ticked, so the customer must pick one. Each preference has its own fee.'}</p>
          <input placeholder="Question heading (e.g. Flower Preference)" value={item.sub_title || ''} onChange={(e) => set('sub_title', e.target.value)} />
          {item.choices.map((c, i) => (
            <div className="opt-row" key={c.id || `n${i}`}>
              <input placeholder="Preference name" value={c.name} onChange={(e) => setChoice(i, 'name', e.target.value)} />
              <input className="fee-in" type="number" min="0" step="0.01" aria-label="Fee (USD)" title="Fee (USD)" value={c.fee} onChange={(e) => setChoice(i, 'fee', e.target.value)} />
              <label className="check"><input type="checkbox" checked={!!c.ask_note} onChange={(e) => setChoice(i, 'ask_note', e.target.checked)} /> Ask for a note</label>
              <label className="check"><input type="checkbox" checked={c.active !== false} onChange={(e) => setChoice(i, 'active', e.target.checked)} /> Active</label>
              <button className="secondary" onClick={() => moveChoice(i, -1)} aria-label="Move up">↑</button>
              <button className="secondary" onClick={() => moveChoice(i, 1)} aria-label="Move down">↓</button>
              <button className="danger" onClick={() => set('choices', item.choices.filter((_, j) => j !== i))}>Remove</button>
              {c.ask_note && (
                <input style={{ flexBasis: '100%' }} placeholder="Note box label (e.g. Describe your custom flowers)" value={c.note_label || ''} onChange={(e) => setChoice(i, 'note_label', e.target.value)} />
              )}
            </div>
          ))}
          <button className="secondary" onClick={() => set('choices', [...item.choices, blankChoice()])}>+ Add preference</button>
        </div>
      )}
    </div>
  );
}

function Editor({ screen, onSave, onCancel }) {
  const [f, setF] = useState(screen);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setItem = (i, item) => setF({ ...f, items: f.items.map((x, j) => (j === i ? item : x)) });
  const moveItem = (i, d) => {
    const a = [...f.items]; const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    setF({ ...f, items: a });
  };
  const save = async () => {
    try {
      await api(f.id ? `/admin/extras/${f.id}` : '/admin/extras', { method: f.id ? 'PUT' : 'POST', body: f });
      onSave();
    } catch (e) { setError(e.message); }
  };
  return (
    <div className="card editor">
      <h2>{f.id ? `Edit: ${screen.name}` : 'New extras screen'}</h2>
      <div className="row">
        <label>Admin name<input value={f.name} onChange={set('name')} placeholder="e.g. Floral Tributes" /></label>
        <label>Screen order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Shown to customers</label>
        <label className="check"><input type="checkbox" checked={!!f.skippable} onChange={set('skippable')} /> Customers can skip this screen</label>
      </div>
      <label>Question shown to customers<input value={f.title} onChange={set('title')} /></label>
      <label>Intro text (optional)<textarea rows={2} value={f.intro || ''} onChange={set('intro')} /></label>

      <h3>Tick-box items</h3>
      {f.items.map((item, i) => (
        <ItemEditor key={item.id || `n${i}`} item={item} onChange={(x) => setItem(i, x)} onMove={(d) => moveItem(i, d)}
          onRemove={() => setF({ ...f, items: f.items.filter((_, j) => j !== i) })} />
      ))}
      <button className="secondary" onClick={() => setF({ ...f, items: [...f.items, blankItem()] })}>+ Add item</button>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}

export default function AdminExtras() {
  const [list, setList] = useState([]);
  const [sp] = useSearchParams();
  const only = sp.get('screen'); // set when opened from a sidebar link: show just that screen
  const shown = only ? list.filter((s) => String(s.id) === only) : list;
  const [editing, setEditing] = useState(null);
  const load = () => api('/admin/extras').then(setList);
  useEffect(() => { load(); }, []);
  const remove = async (s) => {
    if (!confirm(`Delete "${s.name}"? Customers' saved carts keep their prices.`)) return;
    await api(`/admin/extras/${s.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="wide">
      <div className="row between">
        <h1>Extras (tick-boxes)</h1>
        <button className="primary" onClick={() => setEditing({ ...blank(), sort_order: list.length + 10 })}>+ New extras screen</button>
      </div>
      <p className="muted">Screens where customers tick the extras they want, such as floral tributes. An item can ask for a preference with its own price, or for a typed answer. Everything ticked is added to the cart.</p>

      {editing && <Editor key={editing.id || 'new'} screen={editing} onCancel={() => setEditing(null)} onSave={() => { setEditing(null); load(); }} />}

      {only && <p className="muted">Showing one screen. <Link to="/admin/extras">Show all</Link></p>}
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
              {s.items.map((i) => (
                <React.Fragment key={i.id}>
                  <tr>
                    <td>
                      <strong>{i.name}</strong>
                      {i.recommended && <span className="badge">Recommended</span>}
                      {!i.active && <span className="badge">inactive</span>}
                      <br /><span className="muted">{KINDS[i.kind]}{i.kind === 'text' && i.text_label ? `: “${i.text_label}”` : ''}</span>
                    </td>
                    <td className="amt">{i.kind === 'choices' ? '' : i.kind === 'multi' ? `Base ${money(i.fee)}` : money(i.fee)}</td>
                  </tr>
                  {(i.kind === 'choices' || i.kind === 'multi') && i.choices.map((c) => (
                    <tr key={c.id}>
                      <td style={{ paddingLeft: 28 }}>{i.sub_title || 'Preference'}: {c.name}{c.ask_note && <span className="badge">asks for a note</span>}{!c.active && <span className="badge">inactive</span>}</td>
                      <td className="amt">{money(c.fee)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
