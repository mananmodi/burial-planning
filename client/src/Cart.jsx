import React from 'react';
import { money, useT } from './site.jsx';

// cart = { sections: [{ title, lines: [{ label, fee }], pending? }], total? }  (total falls back to the sum of all lines)
export default function Cart({ cart, heading, emptyText }) {
  const T = useT();
  const sections = cart?.sections || [];
  if (!sections.length && !emptyText) return null;
  const total = cart?.total ?? sections.reduce((t, s) => t + s.lines.reduce((a, l) => a + +l.fee, 0), 0);
  return (
    <div className="cart" aria-live="polite">
      <h3>{heading ?? T('planner.cart_title')}</h3>
      {!sections.length && <p className="muted cart-empty">{emptyText}</p>}
      <table>
        <tbody>
          {sections.map((s, i) => (
            <React.Fragment key={i}>
              <tr className={'sec' + (s.pending ? ' pending' : '')}>
                <td colSpan={2}>{s.title}{s.pending && <em className="pend-tag">{T('planner.cart_selecting')}</em>}</td>
              </tr>
              {s.lines.length === 0 && <tr className={s.pending ? 'pend' : ''}><td className="muted">{T('planner.cart_none')}</td><td className="amt">{money(0)}</td></tr>}
              {s.lines.map((l, j) => <tr key={j} className={s.pending ? 'pend' : ''}><td>{l.label}</td><td className="amt">{money(l.fee)}</td></tr>)}
            </React.Fragment>
          ))}
          <tr className="total"><td>{T('planner.cart_total_row')}</td><td className="amt">{money(total)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
