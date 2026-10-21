import React from 'react';
import { Link } from 'react-router-dom';
import Icon, { guessIcon } from './icons.jsx';
import { RichText } from './site.jsx';

// Card line formats (one bullet per card):
//   Title                       Title: description
//   [Title](/path): description {icon} Title: description
function parseCard(line, i) {
  let text = line.trim();
  let icon;
  const m = text.match(/^\{(\w+)\}\s*/);
  if (m) { icon = m[1]; text = text.slice(m[0].length); }
  let link = null;
  const lm = text.match(/^\[([^\]]+)\]\(([^)]+)\)\s*:?\s*/);
  if (lm) { link = lm[2]; text = lm[1] + (text.slice(lm[0].length) ? ': ' + text.slice(lm[0].length) : ''); }
  const c = text.indexOf(':');
  const title = c > 0 ? text.slice(0, c).trim() : text;
  const desc = c > 0 ? text.slice(c + 1).trim() : '';
  return { title, desc, link, icon: icon || guessIcon(text, i) };
}

const bullets = (body) => (body || '').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
const intro = (body) => (body || '').split('\n').filter((l) => !l.trim().startsWith('- ')).join('\n');

function Cards({ sec }) {
  const cards = bullets(sec.body).map(parseCard);
  return (
    <div className="band-in">
      <div className="cards-head">
        {sec.icon && <span className="badge-icon"><Icon name={sec.icon} /></span>}
        {sec.heading && <h2>{sec.heading}</h2>}
        <RichText text={intro(sec.body)} />
      </div>
      <div className="icon-cards">
        {cards.map((c, i) => {
          const inner = (
            <>
              <span className="badge-icon"><Icon name={c.icon} size={30} /></span>
              <h3>{c.title}</h3>
              {c.desc && <p>{c.desc}</p>}
              {c.link && <span className="more">Learn more →</span>}
            </>
          );
          return c.link
            ? <Link key={i} to={c.link} className="icon-card">{inner}</Link>
            : <div key={i} className="icon-card">{inner}</div>;
        })}
      </div>
    </div>
  );
}

// "### Question" followed by its answer: one collapsible item per block
function faqItems(body) {
  const out = []; let cur = null; const lead = [];
  (body || '').split('\n').forEach((l) => {
    if (l.startsWith('### ')) { cur = { q: l.slice(4).trim(), a: [] }; out.push(cur); }
    else if (cur) cur.a.push(l); else lead.push(l);
  });
  return { lead: lead.join('\n'), items: out.map((x) => ({ q: x.q, a: x.a.join('\n').trim() })) };
}

function Accordion({ sec }) {
  const { lead, items } = faqItems(sec.body);
  return (
    <div className="band-in">
      <div className="cards-head">
        {sec.icon && <span className="badge-icon"><Icon name={sec.icon} /></span>}
        {sec.heading && <h2>{sec.heading}</h2>}
        <RichText text={lead} />
      </div>
      <div className="faq-list">
        {items.map((it, i) => (
          <details key={i} className="faq-item" open={i === 0}>
            <summary><span className="badge-icon sm"><Icon name={guessIcon(it.q, i)} size={20} /></span>{it.q}</summary>
            <div className="faq-a"><RichText text={it.a} /></div>
          </details>
        ))}
      </div>
    </div>
  );
}

function Steps({ sec }) {
  const cards = bullets(sec.body).map(parseCard);
  return (
    <div className="band-in">
      <div className="cards-head">
        {sec.icon && <span className="badge-icon"><Icon name={sec.icon} /></span>}
        {sec.heading && <h2>{sec.heading}</h2>}
        <RichText text={intro(sec.body)} />
      </div>
      <ol className="steps">
        {cards.map((c, i) => (
          <li key={i}>
            <span className="step-num">{i + 1}</span>
            <span className="badge-icon sm"><Icon name={c.icon} size={22} /></span>
            <div><strong>{c.title}</strong>{c.desc && <p>{c.desc}</p>}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function SectionView({ sec }) {
  const layout = sec.layout || 'text';

  if (layout === 'accordion') return <section className="band band-cards"><Accordion sec={sec} /></section>;
  if (layout === 'steps') return <section className="band band-cards"><Steps sec={sec} /></section>;

  if (layout === 'cards') return <section className="band band-cards"><Cards sec={sec} /></section>;

  if (layout === 'banner' && sec.image)
    return (
      <section className="band-banner" style={{ backgroundImage: `url(${sec.image})` }}>
        <div className="banner-in">
          {sec.icon && <span className="badge-icon on-dark"><Icon name={sec.icon} size={34} /></span>}
          {sec.heading && <h2>{sec.heading}</h2>}
          <RichText text={sec.body} />
        </div>
      </section>
    );

  if ((layout === 'split' || layout === 'split-reverse') && sec.image)
    return (
      <section className={'band band-split' + (layout === 'split-reverse' ? ' reverse' : '')}>
        <div className="split-img" style={{ backgroundImage: `url(${sec.image})` }} role="img" aria-label={sec.heading} />
        <div className="split-text">
          {sec.icon && <span className="badge-icon"><Icon name={sec.icon} /></span>}
          {sec.heading && <h2>{sec.heading}</h2>}
          <RichText text={sec.body} />
        </div>
      </section>
    );

  return (
    <section className="band">
      <div className="band-in">
        {sec.icon && <span className="badge-icon"><Icon name={sec.icon} /></span>}
        {sec.heading && <h2>{sec.heading}</h2>}
        <RichText text={sec.body} />
      </div>
    </section>
  );
}
