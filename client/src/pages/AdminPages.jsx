import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useSite } from '../site.jsx';
import Icon, { ICON_NAMES } from '../icons.jsx';
import { ImageField } from '../MediaPicker.jsx';
import { parseServices, serializeServices } from '../cards.js';

const blank = () => ({ title: '', slug: '', nav_group: '', nav_order: 0, show_in_nav: true, published: true, hero_title: '', hero_subtitle: '', hero_image: '', meta_title: '', meta_keywords: '', meta_description: '', sections: [{ heading: '', body: '' }] });

function ServicesEditor({ sec, onChange }) {
  const { intro, cards } = parseServices(sec.body);
  const write = (i2, c2) => onChange('body', serializeServices(i2, c2));
  const setCard = (i, k, v) => write(intro, cards.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
  const moveCard = (i, d) => { const c = [...cards]; const j = i + d; if (j < 0 || j >= c.length) return; [c[i], c[j]] = [c[j], c[i]]; write(intro, c); };
  return (
    <div className="svc-edit">
      <div className="row">
        <label>Small label above the heading<input value={sec.eyebrow || ''} onChange={(e) => onChange('eyebrow', e.target.value)} placeholder="What we offer" /></label>
        <label>Link text on each card<input value={sec.link_label || ''} onChange={(e) => onChange('link_label', e.target.value)} placeholder="Learn more" /></label>
      </div>
      <label>Intro text under the heading<textarea rows={2} value={intro} onChange={(e) => write(e.target.value, cards)} /></label>
      {cards.map((c, i) => (
        <fieldset className="svc-card-edit" key={i}>
          <legend>Card {i + 1}</legend>
          <div className="row">
            <label>Title<input value={c.title} onChange={(e) => setCard(i, 'title', e.target.value)} /></label>
            <label>Links to page (e.g. /cremation-services)<input value={c.link} onChange={(e) => setCard(i, 'link', e.target.value)} /></label>
          </div>
          <label>Description<input value={c.desc} onChange={(e) => setCard(i, 'desc', e.target.value)} /></label>
          <div className="row">
            <ImageField label="Card photo" value={c.img} onChange={(v) => setCard(i, 'img', v)} />
            <label>Icon
              <select value={c.icon} onChange={(e) => setCard(i, 'icon', e.target.value)}>
                <option value="">None</option>
                {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <div className="row between">
            <span />
            <span className="nowrap">
              <button type="button" className="secondary" onClick={() => moveCard(i, -1)} aria-label="Move card up">↑</button>{' '}
              <button type="button" className="secondary" onClick={() => moveCard(i, 1)} aria-label="Move card down">↓</button>{' '}
              <button type="button" className="danger" onClick={() => write(intro, cards.filter((_, j) => j !== i))}>Remove card</button>
            </span>
          </div>
        </fieldset>
      ))}
      <button type="button" className="secondary" onClick={() => write(intro, [...cards, { icon: 'star', img: '', title: 'New service', link: '', desc: '' }])}>+ Add card</button>
    </div>
  );
}

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
  const suggest = async () => {
    try {
      const d = await api('/admin/pages/suggest-seo', { method: 'POST', body: f });
      setF({ ...f, meta_title: f.meta_title || d.title, meta_keywords: f.meta_keywords || d.keywords, meta_description: f.meta_description || d.description });
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
      <ImageField label="Banner picture (blank = purple banner)" value={f.hero_image || ''} onChange={(v) => setF({ ...f, hero_image: v })} />
      <fieldset className="seo-box">
        <legend>Search engine details (SEO)</legend>
        <p className="muted hint">Shown in Google results and when the page is shared. Every page should have its own.</p>
        <label>Meta title <small className={'cnt' + ((f.meta_title || '').length > 60 ? ' over' : '')}>{(f.meta_title || '').length}/60</small>
          <input value={f.meta_title || ''} onChange={set('meta_title')} maxLength={255} />
        </label>
        <label>Meta description <small className={'cnt' + ((f.meta_description || '').length > 160 ? ' over' : '')}>{(f.meta_description || '').length}/160</small>
          <textarea rows={3} value={f.meta_description || ''} onChange={set('meta_description')} maxLength={500} />
        </label>
        <label>Meta keywords (separate with commas)
          <input value={f.meta_keywords || ''} onChange={set('meta_keywords')} maxLength={500} />
        </label>
        <button type="button" className="secondary" onClick={suggest}>Suggest from this page</button>
        <span className="muted hint"> Fills only the empty boxes above.</span>
      </fieldset>
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
                <option value="services">Photo service cards (one per bullet)</option>
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
          </div>
          <div className="icon-pick" role="group" aria-label="Pick an icon">
            {ICON_NAMES.map((n) => (
              <button type="button" key={n} title={n} className={'icon-opt' + (s.icon === n ? ' on' : '')} onClick={() => setSec(i, 'icon', s.icon === n ? '' : n)}><Icon name={n} size={20} /></button>
            ))}
          </div>
          {(['split', 'split-reverse', 'banner'].includes(s.layout)) && <ImageField label="Section image" value={s.image || ''} onChange={(v) => setSec(i, 'image', v)} />}
          {s.layout === 'services'
            ? <ServicesEditor sec={s} onChange={(k, v) => setSec(i, k, v)} />
            : <textarea rows={7} value={s.body} onChange={(e) => setSec(i, 'body', e.target.value)} />}
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
