import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

// Stripe: one switch for payments, a Test/LIVE mode switch, and the keys for each mode.
export default function AdminStripe() {
  const [f, setF] = useState(null);
  const [keys, setKeys] = useState({ stripe_test_sk: '', stripe_live_sk: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/admin/integrations').then(setF); }, []);
  if (!f) return <p className="muted">Loading…</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? '1' : '0') : e.target.value });
  const live = f.stripe_mode === 'live';

  const body = () => ({
    stripe_enabled: f.stripe_enabled === '1' ? '1' : '0', stripe_mode: f.stripe_mode, stripe_deposit_percent: f.stripe_deposit_percent,
    stripe_test_pk: f.stripe_test_pk, stripe_live_pk: f.stripe_live_pk,
    ...(keys.stripe_test_sk ? { stripe_test_sk: keys.stripe_test_sk } : {}), ...(keys.stripe_live_sk ? { stripe_live_sk: keys.stripe_live_sk } : {}),
  });
  const save = async (e) => {
    e?.preventDefault();
    if (live && f.stripe_enabled === '1' && !confirm('LIVE mode charges real cards with real money. Switch on live payments?')) return false;
    setBusy(true); setMsg({ type: '', text: '' });
    try {
      await api('/admin/integrations', { method: 'PUT', body: body() });
      setKeys({ stripe_test_sk: '', stripe_live_sk: '' });
      setF(await api('/admin/integrations'));
      setMsg({ type: 'ok', text: 'Stripe settings saved.' });
      return true;
    } catch (err) { setMsg({ type: 'err', text: err.message }); return false; } finally { setBusy(false); }
  };
  const testConn = async (mode) => {
    if (!(await save())) return;
    setBusy(true);
    try {
      const r = await api('/admin/integrations/test-stripe', { method: 'POST', body: { mode } });
      setMsg({ type: 'ok', text: `Connected to Stripe in ${r.livemode ? 'LIVE' : 'TEST'} mode.` });
    } catch (err) { setMsg({ type: 'err', text: `${mode === 'live' ? 'Live' : 'Test'} keys: ${err.message}` }); }
    setBusy(false);
  };

  const KeyBlock = ({ mode }) => (
    <fieldset className={'rule-group stripe-block' + (f.stripe_mode === mode ? ' current' : '')}>
      <legend>{mode === 'live' ? 'LIVE keys' : 'Test keys'} {f.stripe_mode === mode && <span className="badge ok">In use</span>}</legend>
      <label>Publishable key<input value={f[`stripe_${mode}_pk`]} onChange={set(`stripe_${mode}_pk`)} placeholder={`pk_${mode}_…`} autoComplete="off" /></label>
      <label>Secret key {f[`stripe_${mode}_sk_set`] && <span className="muted">(saved {f[`stripe_${mode}_sk_hint`]}; leave blank to keep)</span>}
        <input type="password" value={keys[`stripe_${mode}_sk`]} onChange={(e) => setKeys({ ...keys, [`stripe_${mode}_sk`]: e.target.value })} placeholder={f[`stripe_${mode}_sk_set`] ? 'Unchanged' : `sk_${mode}_…`} autoComplete="new-password" />
      </label>
      <button type="button" className="secondary" disabled={busy || !f[`stripe_${mode}_sk_set`] && !keys[`stripe_${mode}_sk`]} onClick={() => testConn(mode)}>Save and test connection</button>
    </fieldset>
  );

  return (
    <form className="card" style={{ maxWidth: 860 }} onSubmit={save}>
      <h1>Stripe payments</h1>
      <p className="muted">Lets a customer press <strong>Continue To Funding</strong> after confirming their arrangement and pay on Stripe&rsquo;s secure page. Card details never touch this site. Find your keys in the Stripe dashboard under Developers &rarr; API keys.</p>

      <label className="check"><input type="checkbox" checked={f.stripe_enabled === '1'} onChange={set('stripe_enabled')} /> Turn online payments on for customers</label>

      <h2>Mode</h2>
      <div className="mode-switch" role="radiogroup" aria-label="Stripe mode">
        <label className={'mode-opt' + (!live ? ' on' : '')}><input type="radio" name="mode" checked={!live} onChange={() => setF({ ...f, stripe_mode: 'test' })} /> <strong>Test</strong><span>No real money. Use Stripe&rsquo;s test cards, e.g. 4242 4242 4242 4242.</span></label>
        <label className={'mode-opt live' + (live ? ' on' : '')}><input type="radio" name="mode" checked={live} onChange={() => setF({ ...f, stripe_mode: 'live' })} /> <strong>LIVE</strong><span>Real cards are charged.</span></label>
      </div>
      {live && <p className="error" role="alert">LIVE mode is selected: customers will be charged real money.</p>}

      <KeyBlock mode="test" />
      <KeyBlock mode="live" />

      <h2>Amount to collect</h2>
      <label>Percent of the confirmed estimate to collect online
        <input type="number" min="1" max="100" step="1" value={f.stripe_deposit_percent} onChange={set('stripe_deposit_percent')} style={{ maxWidth: 140 }} />
      </label>
      <p className="muted hint">100 = the full estimate. Use a smaller number to collect a deposit (for example 25).</p>

      {msg.text && <p className={msg.type === 'ok' ? 'est-ok' : 'error'} role={msg.type === 'ok' ? 'status' : 'alert'}>{msg.text}</p>}
      <button className="primary" disabled={busy}>Save Stripe settings</button>
    </form>
  );
}
