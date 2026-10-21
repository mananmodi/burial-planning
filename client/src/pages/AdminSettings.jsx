import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { FullSkeleton } from '../Skeleton.jsx';
import { useSite } from '../site.jsx';
import { parseSlides } from '../Slider.jsx';

const FIELDS = [
  ['site_name', 'Business name'], ['tagline', 'Tagline'], ['phone', 'Phone'], ['email', 'Email'],
  ['address', 'Address'], ['hours', 'Availability / hours'], ['facebook', 'Facebook URL'],
  ['footer_note', 'Footer notice', true],
];

export default function AdminSettings() {
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  const { reload } = useSite();
  useEffect(() => { api('/admin/settings').then(setF); }, []);
  if (!f) return <FullSkeleton />;

  const slides = parseSlides(f.home_slides);
  const setSlides = (a) => setF({ ...f, home_slides: JSON.stringify(a) });
  const setSlide = (i, k, v) => setSlides(slides.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const moveSlide = (i, d) => {
    const a = [...slides]; const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setSlides(a);
  };

  const save = async (e) => {
    e.preventDefault();
    await api('/admin/settings', { method: 'PUT', body: f });
    reload(); setMsg('Saved.');
  };
  return (
    <form className="card" style={{ maxWidth: 820 }} onSubmit={save}>
      <h1>Site settings</h1>
      <p className="muted">Shown in the header, footer and call-to-action buttons on every page.</p>
      {FIELDS.map(([k, label, area]) => (
        <label key={k}>{label}
          {area ? <textarea rows={3} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            : <input value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}
        </label>
      ))}
      <h2>Home page slider</h2>
      <p className="muted hint">Image: a path under <code>client/public/images</code> (e.g. <code>/images/slide-1.jpg</code>) or a full https:// URL.</p>
      {slides.map((s, i) => (
        <div className="section-edit" key={i}>
          <div className="row between">
            <strong>Slide {i + 1}</strong>
            <span className="nowrap">
              <button type="button" className="secondary" onClick={() => moveSlide(i, -1)} aria-label="Move up">↑</button>{' '}
              <button type="button" className="secondary" onClick={() => moveSlide(i, 1)} aria-label="Move down">↓</button>{' '}
              <button type="button" className="danger" onClick={() => setSlides(slides.filter((_, j) => j !== i))}>Remove</button>
            </span>
          </div>
          <label>Image<input value={s.image || ''} onChange={(e) => setSlide(i, 'image', e.target.value)} /></label>
          <label>Heading<input value={s.title || ''} onChange={(e) => setSlide(i, 'title', e.target.value)} /></label>
          <label>Subtitle<input value={s.subtitle || ''} onChange={(e) => setSlide(i, 'subtitle', e.target.value)} /></label>
          <div className="row">
            <label>Button text<input value={s.cta || ''} onChange={(e) => setSlide(i, 'cta', e.target.value)} /></label>
            <label>Button link (e.g. /services-overview)<input value={s.link || ''} onChange={(e) => setSlide(i, 'link', e.target.value)} /></label>
          </div>
        </div>
      ))}
      <button type="button" className="secondary" onClick={() => setSlides([...slides, { image: '', title: '', subtitle: '', cta: 'Learn More', link: '/' }])}>+ Add slide</button>
      <button className="primary">Save settings</button>
      {msg && <p className="muted">{msg}</p>}
    </form>
  );
}
