import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { RichText, useSite, tel, useT } from '../site.jsx';
import { useAuth } from '../auth.jsx';
import Slider from '../Slider.jsx';
import SectionView from '../SectionView.jsx';
import { validateContact, formatPhone } from '../profile.js';
import { PageSkeleton } from '../Skeleton.jsx';

function ContactForm() {
  const T = useT();
  const [f, setF] = useState({ name: '', phone: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: 'idle', error: '' });
  const set = (k, fmt) => (e) => { setF({ ...f, [k]: fmt ? fmt(e.target.value) : e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };
  const err = (k) => (errors[k] ? <span className="field-err" role="alert">{errors[k]}</span> : null);
  const bad = (k) => (errors[k] ? { 'aria-invalid': true } : {});
  const submit = async (e) => {
    e.preventDefault();
    const v = validateContact(f).errors;
    setErrors(v);
    if (Object.keys(v).length) { setState({ status: 'idle', error: T('reg.fix') }); setTimeout(() => document.querySelector('form [aria-invalid]')?.focus(), 0); return; }
    setState({ status: 'busy', error: '' });
    try { await api('/contact', { method: 'POST', body: f }); setState({ status: 'sent', error: '' }); }
    catch (err2) { setErrors(err2.fields || {}); setState({ status: 'idle', error: err2.message }); }
  };
  if (state.status === 'sent') return <div className="card"><h3>{T('contact.thanks_title')}</h3><p>{T('contact.thanks_body')}</p></div>;
  return (
    <form className="card" onSubmit={submit} noValidate>
      <label>{T('contact.name')}<input value={f.name} onChange={set('name')} maxLength={100} autoComplete="name" {...bad('name')} />{err('name')}</label>
      <div className="row">
        <label>{T('contact.phone')}<input type="tel" value={f.phone} onChange={set('phone', formatPhone)} placeholder="(956) 555-0123" maxLength={14} autoComplete="tel" {...bad('phone')} />{err('phone')}</label>
        <label>{T('contact.email')}<input type="email" value={f.email} onChange={set('email')} maxLength={254} autoComplete="email" {...bad('email')} />{err('email')}</label>
      </div>
      <label>{T('contact.message')}<textarea rows={5} value={f.message} onChange={set('message')} maxLength={2000} {...bad('message')} />{err('message')}
        <span className="field-hint">{f.message.length}/2000</span></label>
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="primary" disabled={state.status === 'busy'}>{T('contact.send')}</button>
    </form>
  );
}

export default function Page({ slug: fixed }) {
  const T = useT();
  const params = useParams();
  const slug = fixed || params.slug;
  const { settings: s } = useSite();
  const { user } = useAuth();
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(null); setError('');
    api(`/pages/${slug}`).then((p) => { setPage(p); document.title = `${p.title} – ${s.site_name || 'Gámez & Sons'}`; })
      .catch((e) => setError(e.message));
    window.scrollTo(0, 0);
  }, [slug]);

  if (error) return <div className="narrow center"><h1>Page not found</h1><p className="muted">{error}</p><Link to="/">Back to home</Link></div>;
  if (!page) return <PageSkeleton />;
  const home = slug === 'home';

  return (
    <>
      {home && Slider ? <Slider /> : (
        <section className={'hero' + (page.hero_image ? ' hero-img' : '')} style={page.hero_image ? { '--hero-img': `url(${page.hero_image})` } : undefined}>
          <h1>{page.hero_title || page.title}</h1>
          {page.hero_subtitle && <p>{page.hero_subtitle}</p>}
          <div className="hero-actions">
            <a className="primary btn" href={tel(s.phone)}>Call {s.phone}</a>
          </div>
        </section>
      )}

      <div className="content">
        {page.sections.map((sec, i) => <SectionView key={i} sec={sec} />)}
        {slug === 'contact-us' && <section className="band"><div className="band-in"><ContactForm /></div></section>}
        {(home || slug !== 'contact-us') && (
          <aside className="cta">
            <h2>{T('cta.title')}</h2>
            <p>{s.hours}. {home ? T('cta.text_home') : T('cta.text_other')}</p>
            <a className="primary btn" href={tel(s.phone)}>{T('cta.call', { phone: s.phone })}</a>{' '}
            <Link className="secondary btn light" to={home ? '/plans' : '/contact-us'}>{home ? T('cta.plan') : T('cta.contact')}</Link>
            {home && !user && <p className="cta-note">{T('cta.login_note')}</p>}
          </aside>
        )}
      </div>
    </>
  );
}
