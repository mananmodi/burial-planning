import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const placeholders = (s) => [...new Set((String(s).match(/\{\w+\}/g) || []))];

// Every customer-facing label, heading, button, notice and email wording, editable in one place.
export default function AdminTexts() {
  const [rows, setRows] = useState(null);
  const [edits, setEdits] = useState({}); // key -> new value (only changed ones)
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const load = () => api('/admin/texts').then(setRows).catch((e) => setMsg({ type: 'err', text: e.message }));
  useEffect(() => { load(); }, []);

  const valueOf = (r) => (r.key in edits ? edits[r.key] : r.value);
  const groups = useMemo(() => {
    const t = search.trim().toLowerCase();
    const m = new Map();
    (rows || []).forEach((r) => {
      if (t && ![r.key, r.label, r.group, valueOf(r), r.default].some((x) => String(x).toLowerCase().includes(t))) return;
      if (!m.has(r.group)) m.set(r.group, []);
      m.get(r.group).push(r);
    });
    return [...m.entries()];
  }, [rows, search, edits]);

  const set = (r, v) => {
    const next = { ...edits };
    if (v === r.value) delete next[r.key]; else next[r.key] = v;
    setEdits(next); setMsg({ type: '', text: '' });
  };
  const missing = (r) => placeholders(r.default).filter((p) => !valueOf(r).includes(p));
  const pending = Object.keys(edits).length;

  const save = async () => {
    setBusy(true); setMsg({ type: '', text: '' });
    try {
      await api('/admin/texts', { method: 'PUT', body: { values: edits } });
      setEdits({}); await load();
      setMsg({ type: 'ok', text: 'Saved. Visitors see the new wording straight away (they may need to refresh the page).' });
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setBusy(false);
  };

  if (!rows) return <p className="muted">Loading…</p>;
  const changedTotal = rows.filter((r) => r.changed).length;

  return (
    <div className="wide texts-page">
      <div className="row between">
        <div>
          <h1 style={{ marginBottom: 2 }}>Site texts</h1>
          <p className="muted" style={{ margin: 0 }}>The wording of buttons, headings, notices and emails that customers see. {changedTotal > 0 ? `${changedTotal} changed from the default.` : 'All set to the defaults.'}</p>
        </div>
        <input type="search" className="texts-search" placeholder="Search texts…" aria-label="Search texts" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <p className="muted hint">Keep words in <code>{'{curly brackets}'}</code> (like <code>{'{name}'}</code>): the site fills them in. Questions, options, prices, pages and the home slider are edited on their own screens.</p>
      {msg.text && <p className={msg.type === 'ok' ? 'est-ok' : 'error'} role={msg.type === 'ok' ? 'status' : 'alert'}>{msg.text}</p>}

      {groups.map(([g, list]) => {
        const isOpen = search.trim() ? true : open[g] ?? false;
        const edited = list.filter((r) => r.key in edits || r.changed).length;
        return (
          <section className="card texts-group" key={g}>
            <button type="button" className="texts-head" aria-expanded={isOpen} onClick={() => setOpen({ ...open, [g]: !isOpen })}>
              <span>{g}</span>
              <span className="muted">{list.length} texts{edited > 0 && <span className="badge ok">{edited} changed</span>}</span>
              <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="texts-list">
                {list.map((r) => {
                  const v = valueOf(r);
                  const isChanged = v !== r.default;
                  const lost = missing(r);
                  return (
                    <div className="text-row" key={r.key}>
                      <label htmlFor={`t-${r.key}`}>{r.label}</label>
                      {r.long
                        ? <textarea id={`t-${r.key}`} rows={3} value={v} onChange={(e) => set(r, e.target.value)} />
                        : <input id={`t-${r.key}`} value={v} onChange={(e) => set(r, e.target.value)} />}
                      <div className="text-meta">
                        {placeholders(r.default).length > 0 && <span className="muted">Fills in: {placeholders(r.default).join(' ')}</span>}
                        {lost.length > 0 && <span className="warn">Missing {lost.join(' ')}: the site cannot show that value.</span>}
                        {isChanged && <button type="button" className="link" onClick={() => set(r, r.default)}>Reset to default</button>}
                      </div>
                      {isChanged && <p className="muted text-default">Default: {r.default}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
      {groups.length === 0 && <p className="muted">No texts match your search.</p>}

      {pending > 0 && (
        <div className="save-bar" role="region" aria-label="Unsaved changes">
          <span>{pending} unsaved change{pending === 1 ? '' : 's'}</span>
          <button className="secondary" disabled={busy} onClick={() => setEdits({})}>Discard</button>
          <button className="primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      )}
    </div>
  );
}
