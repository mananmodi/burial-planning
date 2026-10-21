import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

// Outgoing email: used for consultation requests (to the admin) and for estimates customers email to themselves.
export default function AdminEmail() {
  const [f, setF] = useState(null);
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/admin/integrations').then(setF); }, []);
  if (!f) return <p className="muted">Loading…</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? '1' : '0') : e.target.value });

  const body = () => ({
    smtp_host: f.smtp_host, smtp_port: f.smtp_port, smtp_secure: f.smtp_secure === '1' ? '1' : '0', smtp_user: f.smtp_user,
    mail_from_name: f.mail_from_name, mail_from_email: f.mail_from_email, consult_to: f.consult_to, ...(pass ? { smtp_pass: pass } : {}),
  });
  const save = async (e) => {
    e?.preventDefault();
    setBusy(true); setMsg({ type: '', text: '' });
    try {
      await api('/admin/integrations', { method: 'PUT', body: body() });
      setPass(''); setF(await api('/admin/integrations'));
      setMsg({ type: 'ok', text: 'Email settings saved.' });
      return true;
    } catch (err) { setMsg({ type: 'err', text: err.message }); return false; } finally { setBusy(false); }
  };
  const test = async () => {
    if (!(await save())) return;
    setBusy(true);
    try { await api('/admin/integrations/test-email', { method: 'POST', body: { to } }); setMsg({ type: 'ok', text: `Test email sent to ${to}. Check that inbox (and spam).` }); }
    catch (err) { setMsg({ type: 'err', text: err.message }); }
    setBusy(false);
  };

  return (
    <form className="card" style={{ maxWidth: 860 }} onSubmit={save}>
      <h1>Email settings</h1>
      <p className="muted">Used to send each <strong>consultation request</strong> (with everything the customer selected) to your team, and to send estimates customers ask to be emailed. Ask your email provider or hosting company for the SMTP details.</p>

      <h2>Where consultation requests go</h2>
      <label>Send consultation requests to (one or more emails, separated by commas)
        <input value={f.consult_to} onChange={set('consult_to')} placeholder="appointments@yourfuneralhome.com, owner@yourfuneralhome.com" />
      </label>

      <h2>Outgoing mail server (SMTP)</h2>
      <div className="row">
        <label>SMTP host<input value={f.smtp_host} onChange={set('smtp_host')} placeholder="smtp.example.com" autoComplete="off" /></label>
        <label>Port<input type="number" value={f.smtp_port} onChange={set('smtp_port')} placeholder="587" /></label>
      </div>
      <label className="check"><input type="checkbox" checked={f.smtp_secure === '1'} onChange={set('smtp_secure')} /> Use SSL/TLS from the start (normally port 465). Leave off for port 587 (STARTTLS).</label>
      <div className="row">
        <label>Username<input value={f.smtp_user} onChange={set('smtp_user')} autoComplete="off" /></label>
        <label>Password {f.smtp_pass_set && <span className="muted">(saved {f.smtp_pass_hint}; leave blank to keep)</span>}
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" placeholder={f.smtp_pass_set ? 'Unchanged' : ''} />
        </label>
      </div>
      <div className="row">
        <label>"From" name<input value={f.mail_from_name} onChange={set('mail_from_name')} placeholder="Gámez & Sons" /></label>
        <label>"From" email<input type="email" value={f.mail_from_email} onChange={set('mail_from_email')} placeholder="no-reply@yourfuneralhome.com" /></label>
      </div>

      {msg.text && <p className={msg.type === 'ok' ? 'est-ok' : 'error'} role={msg.type === 'ok' ? 'status' : 'alert'}>{msg.text}</p>}
      <button className="primary" disabled={busy}>Save email settings</button>

      <h2>Send a test email</h2>
      <div className="opt-row">
        <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="your.email@example.com" aria-label="Send the test to" />
        <button type="button" className="secondary" disabled={busy || !to} onClick={test}>Save and send test</button>
      </div>
    </form>
  );
}
