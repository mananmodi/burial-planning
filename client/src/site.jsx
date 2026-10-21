import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const Ctx = createContext({ settings: {}, nav: [], texts: {}, reload: () => {} });
export const useSite = () => useContext(Ctx);

export function SiteProvider({ children }) {
  const [data, setData] = useState({ settings: {}, nav: [], texts: {} });
  const [loaded, setLoaded] = useState(false);
  const reload = useCallback(() => api('/site').then(setData).catch(() => {}).finally(() => setLoaded(true)), []);
  useEffect(() => { reload(); }, [reload]);
  // wait for the wording to arrive so visitors never see placeholder text flash
  if (!loaded) return <div className="boot" aria-busy="true" />;
  return <Ctx.Provider value={{ ...data, reload }}>{children}</Ctx.Provider>;
}

// Site texts are managed in the admin (Site texts). T('key', { name: 'x' }) returns the wording with {placeholders} filled in.
export const fillText = (str, vars) => String(str).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? vars[k] : m));
export function useT() {
  const { texts } = useContext(Ctx);
  return useCallback((key, vars) => fillText(texts?.[key] ?? key, vars), [texts]);
}

// Renders admin-entered text safely (no raw HTML):
// blank line = paragraph, "- " = bullet, "### " = sub-heading, **bold**.
const inline = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((t, i) =>
    t.startsWith('**') && t.endsWith('**') && t.length > 4 ? <strong key={i}>{t.slice(2, -2)}</strong> : t);

export function RichText({ text }) {
  const out = [];
  let list = [];
  const flush = () => { if (list.length) { out.push(<ul key={out.length}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; } };
  (text || '').split('\n').forEach((raw) => {
    const line = raw.trim();
    if (line.startsWith('- ')) return list.push(line.slice(2));
    flush();
    if (!line) return;
    if (line.startsWith('### ')) out.push(<h3 key={out.length}>{line.slice(4)}</h3>);
    else out.push(<p key={out.length}>{inline(line)}</p>);
  });
  flush();
  return <>{out}</>;
}

export const tel = (p) => 'tel:' + (p || '').replace(/[^\d+]/g, '');

export const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(+n || 0);
