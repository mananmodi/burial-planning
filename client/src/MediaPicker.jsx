import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api, uploadImage } from './api.js';

const OK = /^image\/(jpeg|png|gif|webp)$/;
const MAX = 8 * 1024 * 1024;
const kb = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

// Validates and uploads files one by one. onDone(savedRow) per file; returns a list of problems.
export async function uploadFiles(files, onDone) {
  const problems = [];
  for (const f of files) {
    if (!OK.test(f.type)) { problems.push(`${f.name}: only JPG, PNG, GIF or WEBP images`); continue; }
    if (f.size > MAX) { problems.push(`${f.name}: larger than 8 MB`); continue; }
    try { onDone(await uploadImage(f)); } catch (e) { problems.push(`${f.name}: ${e.message}`); }
  }
  return problems;
}

// A big drag-and-drop target (click to browse works too).
export function DropZone({ multiple, onUploaded, compact, label }) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState([]);
  const input = useRef(null);
  const run = async (list) => {
    const files = [...list];
    if (!files.length) return;
    setBusy(true); setProblems([]);
    setProblems(await uploadFiles(multiple ? files : files.slice(0, 1), onUploaded));
    setBusy(false);
  };
  return (
    <div>
      <div className={'dropzone' + (over ? ' over' : '') + (compact ? ' compact' : '')} role="button" tabIndex={0}
        onClick={() => input.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); run(e.dataTransfer.files); }}>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple={multiple} hidden onChange={(e) => { run(e.target.files); e.target.value = ''; }} />
        {busy
          ? <strong>Uploading…</strong>
          : <><strong>{label || (multiple ? 'Drag & drop images here' : 'Drag & drop an image here')}</strong><span>or click to browse &middot; JPG, PNG, GIF, WEBP up to 8 MB</span></>}
      </div>
      {problems.map((p, i) => <p key={i} className="error" role="alert">{p}</p>)}
    </div>
  );
}

function useLibrary() {
  const [lib, setLib] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api('/admin/media').then(setLib).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  return { lib, error, load };
}

// Pop-up grid of every image (uploaded + built in); click one to use it.
function LibraryModal({ onPick, onClose }) {
  const { lib, error, load } = useLibrary();
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  const all = lib ? [...lib.uploaded.map((m) => ({ url: m.url, name: m.original_name, tag: 'Uploaded' })), ...lib.builtin.map((m) => ({ url: m.url, name: m.name, tag: 'Built-in' }))] : [];
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Choose an image">
        <div className="row between"><h2 style={{ margin: 0 }}>Choose an image</h2><button type="button" className="secondary" onClick={onClose}>Close</button></div>
        <DropZone multiple compact onUploaded={(m) => { onPick(m.url); }} label="Drop a new image here to upload and use it" />
        {error && <p className="error">{error}</p>}
        {!lib && !error && <p className="muted">Loading…</p>}
        <div className="media-grid">
          {all.map((m) => (
            <button type="button" key={m.url} className="media-tile pick" onClick={() => onPick(m.url)} title={m.name}>
              <img src={m.url} alt="" loading="lazy" />
              <span>{m.name}</span><em>{m.tag}</em>
            </button>
          ))}
        </div>
        {lib && !all.length && <p className="muted">No images yet. Upload one above.</p>}
        <button type="button" className="secondary" onClick={load}>Refresh</button>
      </div>
    </div>
  );
}

// Drop-in replacement for an image path text box: thumbnail, drag & drop upload, library, and the plain path for pictures hosted elsewhere.
export function ImageField({ label, value, onChange, hint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="imgfield">
      {label && <span className="lbl">{label}</span>}
      <div className="imgfield-row">
        {value ? <img className="imgfield-thumb" src={value} alt="" /> : <span className="imgfield-thumb empty">No image</span>}
        <div className="imgfield-main">
          <DropZone compact onUploaded={(m) => onChange(m.url)} label="Drop an image here" />
          <div className="imgfield-tools">
            <button type="button" className="secondary" onClick={() => setOpen(true)}>Choose from library</button>
            {value && <button type="button" className="secondary" onClick={() => onChange('')}>Remove image</button>}
          </div>
          <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="…or type a path / https:// address" aria-label={label ? `${label} (path or address)` : 'Image path or address'} />
          {hint && <span className="muted hint">{hint}</span>}
        </div>
      </div>
      {open && <LibraryModal onPick={(u) => { onChange(u); setOpen(false); }} onClose={() => setOpen(false)} />}
    </div>
  );
}

export { useLibrary, kb };
