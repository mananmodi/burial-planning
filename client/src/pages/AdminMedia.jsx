import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { DropZone, useLibrary, kb } from '../MediaPicker.jsx';

export default function AdminMedia() {
  const { lib, error, load } = useLibrary();
  const [msg, setMsg] = useState('');
  useEffect(() => { document.title = 'Images'; }, []);

  const [busy, setBusy] = useState(false);
  const importExisting = async () => {
    if (!confirm('Copy all built-in website pictures into your image library and switch every page, section, service card and slide to use the library copies?')) return;
    setBusy(true); setMsg('');
    try {
      const r = await api('/admin/media/import-existing', { method: 'POST' });
      setMsg(r.imported ? `Imported ${r.imported} picture(s); ${r.updated} page/setting record(s) now use the library copies.` : 'Everything was already imported.');
      load();
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };
  const copy = async (url) => {
    try { await navigator.clipboard.writeText(url); setMsg(`Copied ${url}`); } catch { setMsg(url); }
    setTimeout(() => setMsg(''), 2500);
  };
  const remove = async (m) => {
    if (!confirm(`Delete "${m.original_name}"? Any page still using it will show a missing picture.`)) return;
    try { await api(`/admin/media/${m.id}`, { method: 'DELETE' }); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div className="wide">
      <h1>Images</h1>
      <p className="muted">Upload pictures once, then pick them anywhere you edit content (page banners, sections, service cards, home slider). Drag several files in at the same time if you like.</p>
      <DropZone multiple onUploaded={load} />
      {lib && lib.builtin.length > 0 && (
        <div className="import-box">
          <div><strong>Built-in website pictures ({lib.builtin.length})</strong><span className="muted"> The pictures that came with the website are not in your library yet. Import them to manage, replace or delete them like any other upload; pages and slides that use them are updated automatically.</span></div>
          <button type="button" className="primary" disabled={busy} onClick={importExisting}>{busy ? 'Importing…' : 'Import existing images'}</button>
        </div>
      )}
      {msg && <p className="muted" role="status">{msg}</p>}
      {error && <p className="error">{error}</p>}
      {!lib && !error && <p className="muted">Loading…</p>}

      {lib && (
        <>
          <h2>Uploaded images <small className="muted">({lib.uploaded.length})</small></h2>
          {!lib.uploaded.length && <p className="muted">Nothing uploaded yet.</p>}
          <div className="media-grid">
            {lib.uploaded.map((m) => (
              <figure className="media-tile" key={m.id}>
                <img src={m.url} alt="" loading="lazy" />
                <figcaption>
                  <strong title={m.original_name}>{m.original_name}</strong>
                  <span className="muted">{kb(m.size)}</span>
                  <code>{m.url}</code>
                  <span className="media-actions">
                    <button type="button" className="secondary" onClick={() => copy(m.url)}>Copy link</button>
                    <button type="button" className="danger" onClick={() => remove(m)}>Delete</button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <h2>Built-in website images <small className="muted">({lib.builtin.length})</small></h2>
          <div className="media-grid">
            {lib.builtin.map((m) => (
              <figure className="media-tile" key={m.url}>
                <img src={m.url} alt="" loading="lazy" />
                <figcaption>
                  <strong title={m.name}>{m.name}</strong>
                  <code>{m.url}</code>
                  <span className="media-actions"><button type="button" className="secondary" onClick={() => copy(m.url)}>Copy link</button></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
