// Writes a page's meta title / description / keywords (and the matching social-preview tags) into the document head.
const NAMES = [['name', 'description'], ['name', 'keywords'], ['property', 'og:title'], ['property', 'og:description']];

function put(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!value) { el?.remove(); return; }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

export function applyMeta({ title, description, keywords }) {
  if (title) document.title = title;
  put('name', 'description', description);
  put('name', 'keywords', keywords);
  put('property', 'og:title', title);
  put('property', 'og:description', description);
}

export function clearMeta() { NAMES.forEach(([a, k]) => document.head.querySelector(`meta[${a}="${k}"]`)?.remove()); }
