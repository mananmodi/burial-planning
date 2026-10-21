import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useSite } from '../site.jsx';
import Icon, { ICON_NAMES } from '../icons.jsx';

const blank = () => ({ title: '', slug: '', nav_group: '', nav_order: 0, show_in_nav: true, published: true, hero_title: '', hero_subtitle: '', hero_image: '', sections: [{ heading: '', body: '' }] });

function Editor({ page, groups, onSave, onCancel }) {
  const [f, setF] = useState(page);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setSec = (i, k, v) => setF({ ...f, sections: f.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const move = (i, d) => {
    const s = [...f.sections]; const j = i + d;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    setF({ ...f, sections: s });
  };
  const save = async () => {
    try {
      await api(f.id ? `/admin/pages/${f.id}` : '/admin/pages', { method: f.id ? 'PUT' : 'POST', body: f });
      onSave();
    } catch (e) { setError(e.message); }
  };
  const isHome = f.slug === 'home';
  return (
    <div className="card editor">
      <h2>{f.id ? `Edit: ${page.title}` : 'New page'}</h2>
      <div className="row">
        <label>Page title<input value={f.title} onChange={set('title')} /></label>
        <label>URL (e.g. our-staff){isHome && ' — fixed'}
          <input value={f.slug} onChange={set('slug')} disabled={isHome} placeholder="auto from title" />
        </label>
      </div>
      <label>Banner heading<input value={f.hero_title} onChange={set('hero_title')} /></label>
      <label>Banner subtitle<textarea rows={2} value={f.hero_subtitle} onChange={set('hero_subtitle')} /></label>
      <label>Banner picture (/images/... or https://..., blank = purple banner)<input value={f.hero_image || ''} onChange={set('hero_image')} placeholder="/images/about.jpg" /></label>
      {f.hero_image && <img className="thumb-wide" src={f.hero_image} alt="Banner preview" />}
      <div className="row">
        <label>Menu group (blank = top level)
          <input list="groups" value={f.nav_group} onChange={set('nav_group')} disabled={isHome} />
          <datalist id="groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
        </label>
        <label>Menu order<input type="number" value={f.nav_order} onChange={set('nav_order')} /></label>
        <label className="check"><input type="checkbox" checked={f.show_in_nav} onChange={set('show_in_nav')} /> Show in menu</label>
        <label className="check"><input type="checkbox" checked={f.published} onChange={set('published')} /> Published</label>
      </div>

      <h3>Content sections</h3>
      <p className="muted hint">Layouts: <b>Icon cards</b> and <b>Steps</b> use one bullet each; <b>Questions &amp; answers</b> uses <code>### Question</code> then the answer. Icon cards: one card per bullet, written <code>- Title: description</code>; use <code>- [Title](/page): description</code> to make it a link, or <code>- {"{clock}"} Title</code> to pick an icon. Blank line = new paragraph. Start a line with <code>- </code> for a bullet, <code>### </code> for a sub-heading. Use <code>**bold**</code>.</p>
      {f.sections.map((s, i) => (
        <div className="section-edit" key={i}>
          <div className="row between">
            <input placeholder="Section heading" value={s.heading} onChange={(e) => setSec(i, 'heading', e.target.value)} />
            <span className="nowrap">
              <button className="secondary" onClick={() => move(i, -1)} aria-label="Move up">↑</button>{' '}
              <button className="secondary" onClick={() => move(i, 1)} aria-label="Move down">↓</button>{' '}
              <button className="danger" onClick={() => setF({ ...f, sections: f.sections.filter((_, j) => j !== i) })}>Remove</button>
            </span>
          </div>
          <div className="row">
            <label>Layout
              <select value={s.layout || 'text'} onChange={(e) => setSec(i, 'layout', e.target.value)}>
                <option value="text">Text</option>
                <option value="split">Image left + text</option>
                <option value="split-reverse">Text + image right</option>
                <option value="banner">Banner (image background)</option>
                <option value="cards">Icon cards (one per bullet)</option>
                <option value="steps">Numbered steps with icons (one per bullet)</option>
                <option value="accordion">Questions &amp; answers (### Question)</option>
              </select>
            </label>
            <label>Icon
              <select value={s.icon || ''} onChange={(e) => setSec(i, 'icon', e.target.value)}>
                <option value="">None</option>
                {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label>Image (/images/... or https://...)<input value={s.image || ''} onChange={(e) => setSec(i, 'image', e.target.value)} /></label>
          </div>
          <div className="icon-pick" role="group" aria-label="Pick an icon">
            {ICON_NAMES.map((n) => (
              <button type="button" key={n} title={n} className={'icon-opt' + (s.icon === n ? ' on' : '')} onClick={() => setSec(i, 'icon', s.icon === n ? '' : n)}><Icon name={n} size={20} /></button>
            ))}
            {s.image && <img className="thumb" src={s.image} alt="Section preview" />}
          </div>
          <textarea rows={7} value={s.body} onChange={(e) => setSec(i, 'body', e.target.value)} />
        </div>
      ))}
      <button className="secondary" onClick={() => setF({ ...f, sections: [...f.sections, { heading: '', body: '' }] })}>+ Add section</button>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={save}>Save page</button>
      </div>
    </div>
  );
}

export default function AdminPages() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const { reload } = useSite();
  const load = () => api('/admin/pages').then(setList);
  useEffect(() => { load(); }, []);
  const groups = [...new Set(list.map((p) => p.nav_group).filter(Boolean))];

  const remove = async (p) => {
    if (!confirm(`Delete page "${p.title}"?`)) return;
    try { await api(`/admin/pages/${p.id}`, { method: 'DELETE' }); load(); reload(); } catch (e) { alert(e.message); }
  };

  return (
    <div className="wide">
      <div className="row between">
        <h1>Website pages</h1>
        <button className="primary" onClick={() => setEditing(blank())}>+ New page</button>
      </div>
      {editing && <Editor key={editing.id || 'new'} page={editing} groups={groups} onCancel={() => setEditing(null)}
        onSave={() => { setEditing(null); load(); reload(); window.scrollTo(0, 0); }} />}
      <table>
        <thead><tr><th>Page</th><th>URL</th><th>Menu</th><th>Status</th><th /></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td><a href={p.slug === 'home' ? '/' : `/${p.slug}`} target="_blank" rel="noreferrer">{p.slug === 'home' ? '/' : `/${p.slug}`}</a></td>
              <td>{p.show_in_nav ? (p.nav_group || 'Top level') : '—'}</td>
              <td>{p.published ? 'Published' : <span className="badge">Draft</span>}</td>
              <td className="nowrap">
                <button className="secondary" onClick={() => { setEditing(p); window.scrollTo(0, 0); }}>Edit</button>{' '}
                {p.slug !== 'home' && <button className="danger" onClick={() => remove(p)}>Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
