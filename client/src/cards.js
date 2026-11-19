// "Photo service cards" are stored as text so they fit the normal section body:
//   intro paragraph(s)
//   - {icon} {img:/images/x.jpg} [Title](/link): description
// parseServices / serializeServices convert between that text and a list the admin can edit.

export function parseServices(body) {
  const intro = []; const cards = [];
  (body || '').split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line.startsWith('- ')) { if (!cards.length) intro.push(raw); return; }
    let t = line.slice(2).trim();
    const c = { icon: '', img: '', title: '', link: '', desc: '' };
    let m = t.match(/^\{(\w+)\}\s*/);
    if (m && m[1] !== 'img') { c.icon = m[1]; t = t.slice(m[0].length); }
    m = t.match(/^\{img:([^}]*)\}\s*/);
    if (m) { c.img = m[1].trim(); t = t.slice(m[0].length); }
    m = t.match(/^\[([^\]]*)\]\(([^)]*)\)\s*:?\s*/);
    if (m) { c.title = m[1]; c.link = m[2]; c.desc = t.slice(m[0].length).trim(); }
    else { const i = t.indexOf(':'); if (i > 0) { c.title = t.slice(0, i).trim(); c.desc = t.slice(i + 1).trim(); } else c.title = t; }
    cards.push(c);
  });
  return { intro: intro.join('\n').trim(), cards };
}

export function serializeServices(intro, cards) {
  const lines = cards.map((c) => {
    const head = (c.icon ? `{${c.icon}} ` : '') + (c.img ? `{img:${c.img.trim()}} ` : '');
    const title = c.link ? `[${c.title}](${c.link.trim()})` : c.title;
    return `- ${head}${title}${c.desc ? `: ${c.desc}` : ''}`;
  });
  return [intro.trim(), lines.join('\n')].filter(Boolean).join('\n\n');
}
