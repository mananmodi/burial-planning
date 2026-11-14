import React, { useRef, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { useT } from '../site.jsx';
import { validateProfile } from '../profile.js';
import SignupFields, { blankProfile } from './SignupFields.jsx';
import Captcha from '../Captcha.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const focusFirstError = () => setTimeout(() => document.querySelector('form [aria-invalid="true"]')?.focus(), 0);

// Shown after sign-up (or after a log in attempt with an unverified email): asks the customer to check their inbox.
function VerifyNotice({ email, info, onBack }) {
  const [captcha, setCaptcha] = useState({ token: '', answer: '' });
  const [capErr, setCapErr] = useState('');
  const [msg, setMsg] = useState(info || null);
  const [busy, setBusy] = useState(false);
  const cap = useRef();
  const resend = async (e) => {
    e.preventDefault();
    if (!captcha.answer.trim()) { setCapErr('Please solve the math question'); return; }
    setBusy(true); setCapErr(''); setMsg(null);
    try {
      const r = await api('/auth/resend-verification', { method: 'POST', body: { email, captcha_token: captcha.token, captcha_answer: captcha.answer } });
      setMsg(r.sent === false ? { type: 'warn', ...r } : { type: 'ok', text: 'A new verification link has been sent.', ...r });
    } catch (err) {
      if (err.fields?.captcha) setCapErr(err.fields.captcha); else setMsg({ type: 'err', text: err.message });
    }
    cap.current?.reset();
    setBusy(false);
  };
  return (
    <div className="card narrow" role="status">
      <h1>Check your email</h1>
      <p>We sent a verification link to <strong>{email}</strong>. Open it to confirm your email address, then come back and log in. The link works for 24 hours.</p>
      {msg?.dev_link && (
        <p className="login-notice" role="note">
          <strong>Email is not set up on this computer yet.</strong>
          <span>For testing, <a href={msg.dev_link}>open the verification link here</a>. (This is shown only on a development machine.)</span>
        </p>
      )}
      {msg?.sent === false && !msg.dev_link && <p className="error" role="alert">We could not send the email right now. Please try again in a few minutes or contact us.</p>}
      {msg?.text && <p className={msg.type === 'ok' ? 'est-ok' : 'error'} role={msg.type === 'ok' ? 'status' : 'alert'}>{msg.text}</p>}
      <form onSubmit={resend} noValidate>
        <p className="muted">Did not get it? Check your spam folder, or request a new link.</p>
        <Captcha ref={cap} value={captcha} onChange={setCaptcha} error={capErr} idPrefix="resend" />
        <button className="secondary" disabled={busy}>Send a new link</button>
      </form>
      <button type="button" className="link" onClick={onBack}>Back to log in</button>
    </div>
  );
}

export default function Login() {
  const T = useT();
  const { user, authenticate } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const needLogin = !!loc.state?.needLogin;
  const from = loc.state?.from && /^\/(plans?|funding)/.test(loc.state.from) ? loc.state.from : '/plans'; // where a customer goes after logging in
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ ...blankProfile(), email: '', password: '' });
  const [captcha, setCaptcha] = useState({ token: '', answer: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null); // { email, info } while waiting for email verification
  const cap = useRef();

  if (user) return <Navigate to={user.role === 'admin' ? '/admin/customers' : from} replace />;
  if (pending) return <VerifyNotice {...pending} onBack={() => { setPending(null); setMode('login'); }} />;

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };
  const err = (k) => (errors[k] ? <span id={`err-${k}`} className="field-err" role="alert">{errors[k]}</span> : null);
  const bad = (k) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `err-${k}` } : {});

  const validate = () => {
    const v = mode === 'register' ? { ...validateProfile(form).errors } : {};
    if (!form.email.trim()) v.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) v.email = 'Enter a valid email address';
    if (!form.password) v.password = 'Password is required';
    else if (mode === 'register') {
      const p = form.password;
      if (p.length < 8) v.password = 'Password must be at least 8 characters';
      else if (!/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/\d/.test(p)) v.password = 'Password must include an uppercase letter, a lowercase letter and a number';
      if (!v.password && p !== form.confirm_password) v.confirm_password = form.confirm_password ? 'Passwords do not match' : 'Confirm your password';
    }
    if (!captcha.answer.trim()) v.captcha = 'Please solve the math question';
    return v;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) { setError(T('reg.fix')); focusFirstError(); return; }
    setBusy(true);
    try {
      const r = await authenticate(mode, { ...form, captcha_token: captcha.token, captcha_answer: captcha.answer });
      if (r.needs_verification) { setPending({ email: r.email, info: r }); setForm({ ...blankProfile(), email: '', password: '' }); }
      else nav(r.role === 'admin' ? '/admin/customers' : from);
    } catch (ex) {
      if (ex.code === 'EMAIL_NOT_VERIFIED') { setPending({ email: ex.data?.email || form.email.trim().toLowerCase() }); setBusy(false); return; }
      setErrors(ex.fields || {});
      setError(ex.message);
      if (ex.fields && Object.keys(ex.fields).length) focusFirstError();
      cap.current?.reset(); // every attempt needs a new question
    }
    setBusy(false);
  };

  return (
    <form className={'card ' + (mode === 'register' ? 'reg-card' : 'narrow')} onSubmit={submit} noValidate>
      {needLogin && (
        <div className="login-notice" role="status">
          <strong>{T('login.notice_title')}</strong>
          <span>{T('login.notice_body')}</span>
        </div>
      )}
      <h1>{mode === 'login' ? T('login.title_login') : T('login.title_register')}</h1>
      <p className="muted">{mode === 'login' ? T('login.sub_login') : T('login.sub_register')}</p>
      {mode === 'register' && <SignupFields form={form} setForm={setForm} errors={errors} />}
            {(() => {
        const fields = (
          <>
            <label>{T('login.email')} <span className="req" aria-hidden="true">*</span><input type="email" value={form.email} onChange={set('email')} maxLength={254} required aria-required="true" autoComplete={mode === 'login' ? 'username' : 'email'} {...bad('email')} />{err('email')}</label>
            <label>{T('login.password')} <span className="req" aria-hidden="true">*</span><input type="password" value={form.password} onChange={set('password')} maxLength={72} required aria-required="true" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} {...bad('password')} />
              {err('password') || (mode === 'register' && <span className="field-hint">8+ characters with an uppercase letter, a lowercase letter and a number.</span>)}
            </label>
            {mode === 'register' && (
              <label>Confirm password <span className="req" aria-hidden="true">*</span><input type="password" value={form.confirm_password || ''} onChange={set('confirm_password')} maxLength={72} required aria-required="true" autoComplete="new-password" {...bad('confirm_password')} />{err('confirm_password')}</label>
            )}
          </>
        );
        return mode === 'register' ? <fieldset className="reg-block"><div className="reg-grid">{fields}</div></fieldset> : fields;
      })()}
      <Captcha ref={cap} value={captcha} onChange={(c) => { setCaptcha(c); if (errors.captcha) setErrors({ ...errors, captcha: undefined }); }} error={errors.captcha} idPrefix={mode} />
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{mode === 'login' ? T('login.btn_login') : T('login.btn_register')}</button>
      <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setErrors({}); setCaptcha({ token: '', answer: '' }); cap.current?.reset(); }}>
        {mode === 'login' ? T('login.to_register') : T('login.to_login')}
      </button>
    </form>
  );
}
