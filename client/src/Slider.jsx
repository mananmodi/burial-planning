import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tel, useSite, useT } from './site.jsx';
import { useAuth } from './auth.jsx';

export function parseSlides(raw) {
  try { const a = JSON.parse(raw || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}

export default function Slider() {
  const T = useT();
  const { settings } = useSite();
  const { user } = useAuth();
  const slides = parseSlides(settings.home_slides).filter((s) => s.image);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (paused || reduced || slides.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, reduced, slides.length]);

  if (!slides.length) return null;
  const go = (n) => setI((n + slides.length) % slides.length);

  return (
    <section className="slider" aria-roledescription="carousel" aria-label="Featured"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {slides.map((s, n) => (
        <div key={n} className={'slide' + (n === i ? ' active' : '')} style={{ backgroundImage: `url(${s.image})` }}
          aria-hidden={n !== i} role="group" aria-label={`Slide ${n + 1} of ${slides.length}`}>
          <div className="slide-text">
            <h1>{s.title}</h1>
            {s.subtitle && <p>{s.subtitle}</p>}
            <div className="hero-actions">
              {s.link && <Link className="primary btn" to={s.link} tabIndex={n === i ? 0 : -1}>{s.cta || 'Learn More'}</Link>}
              <a className="secondary btn light" href={tel(settings.phone)} tabIndex={n === i ? 0 : -1}>{T('slider.call', { phone: settings.phone })}</a>
            </div>
            {!user && /^\/plans?$/.test(s.link || '') && <p className="slide-note">{T('slider.login_note')}</p>}
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <>
          <button className="arrow prev" aria-label="Previous slide" onClick={() => go(i - 1)}>‹</button>
          <button className="arrow next" aria-label="Next slide" onClick={() => go(i + 1)}>›</button>
          <div className="dots">
            {slides.map((_, n) => (
              <button key={n} className={n === i ? 'on' : ''} aria-label={`Go to slide ${n + 1}`} aria-current={n === i} onClick={() => setI(n)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
