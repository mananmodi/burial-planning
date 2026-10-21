import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { useT } from './site.jsx';

// After the arrangement is confirmed: pay online (Stripe) or ask for a consultation call.
export default function NextSteps({ planName }) {
  const T = useT();
  const [funding, setFunding] = useState(null);
  const [payments, setPayments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ phone: '', contact_method: 'phone', preferred_time: '', notes: '' });

  useEffect(() => {
    api('/funding/config').then(setFunding).catch(() => setFunding({ enabled: false }));
    api('/payments').then(setPayments).catch(() => {});
  }, []);

  const paid = payments.filter((p) => p.status === 'paid');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const checkout = async () => {
    setBusy(true); setError('');
    try { const r = await api('/payments/checkout', { method: 'POST' }); window.location.href = r.url; }
    catch (e) { setError(e.message); setBusy(false); }
  };
  const schedule = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await api('/consultations', { method: 'POST', body: form }); setSent(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (err) { setError(err.message); }
    setBusy(false);
  };

  if (sent) {
    return (
      <section className="next-steps thanks" role="status">
        <span className="ns-check" aria-hidden="true">&#10003;</span>
        <h2>{T('next.thanks_title')}</h2>
        <p>{T('next.thanks_body')}</p>
        <p className="muted">{T('next.thanks_detail', { plan: planName || T('next.thanks_plan_default') })}</p>
      </section>
    );
  }

  return (
    <section className="next-steps" aria-labelledby="ns-title">
      <h2 id="ns-title">{T('next.title')}</h2>
      {paid.length > 0 && (
        <p className="ns-paid" role="status">&#10003; {T('next.paid', { amount: paid[0].amount, mode: paid[0].mode === 'test' ? T('next.test_mode') : '' })}</p>
      )}
      <div className="ns-grid">
        <article className="ns-card">
          <h3>{T('next.fund_title')}</h3>
          <p>{funding?.deposit_percent && funding.deposit_percent < 100 ? T('next.fund_body_deposit', { percent: funding.deposit_percent }) : T('next.fund_body')}</p>
          {funding?.enabled && funding.mode === 'test' && <p className="ns-test">{T('next.fund_test')}</p>}
          <button className="primary" disabled={busy || !funding?.enabled} onClick={checkout}>{T('next.fund_btn')}</button>
          {funding && !funding.enabled && <p className="muted ns-small">{T('next.fund_off')}</p>}
        </article>
        <article className="ns-card">
          <h3>{T('next.consult_title')}</h3>
          <p>{T('next.consult_body')}</p>
          <button className="secondary" disabled={busy} onClick={() => setOpen(!open)} aria-expanded={open}>{open ? T('next.consult_close') : T('next.consult_btn')}</button>
        </article>
      </div>
      {error && !open && <p className="error" role="alert">{error}</p>}

      {open && (
        <form className="card consult-form" onSubmit={schedule}>
          <h3>{T('next.form_title')}</h3>
          <div className="row">
            <label>{T('next.form_phone')}<input type="tel" required value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder={T('next.form_phone_ph')} /></label>
            <label>{T('next.form_method')}
              <select value={form.contact_method} onChange={set('contact_method')}>
                <option value="phone">{T('next.form_m_phone')}</option>
                <option value="text">{T('next.form_m_text')}</option>
                <option value="email">{T('next.form_m_email')}</option>
              </select>
            </label>
          </div>
          <label>{T('next.form_time')}<input value={form.preferred_time} onChange={set('preferred_time')} maxLength={250} placeholder={T('next.form_time_ph')} /></label>
          <label>{T('next.form_notes')}<textarea rows={4} maxLength={2000} value={form.notes} onChange={set('notes')} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="actions">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>{T('next.form_cancel')}</button>
            <button className="primary" disabled={busy}>{busy ? T('next.form_sending') : T('next.form_send')}</button>
          </div>
        </form>
      )}
    </section>
  );
}

