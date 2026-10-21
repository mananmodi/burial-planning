import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useT } from '../site.jsx';
import { validateProfile } from '../profile.js';
import SignupFields, { blankProfile } from './SignupFields.jsx';

export default function Login() {
  const T = useT();
  const { user, authenticate } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const needLogin = !!loc.state?.needLogin;
  const from = loc.state?.from && /^\/(plans?|funding)/.test(loc.state.from) ? loc.state.from : '/plans'; // where a customer goes after logging in
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ ...blankProfile(), email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin/customers' : from} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register') {
      const v = validateProfile(form).errors;
      setErrors(v);
      if (Object.keys(v).length) {
        setError(T('reg.fix'));
        setTimeout(() => document.querySelector('[aria-invalid]')?.focus(), 0);
        return;
      }
    }
    setBusy(true);
    try {
      const u = await authenticate(mode, form);
      nav(u.role === 'admin' ? '/admin/customers' : from);
    } catch (err) { setErrors(err.fields || {}); setError(err.message); }
    setBusy(false);
  };

  return (
    <form className={'card ' + (mode === 'register' ? 'reg-card' : 'narrow')} onSubmit={submit} noValidate={mode === 'register'}>
      {needLogin && (
        <div className="login-notice" role="status">
          <strong>{T('login.notice_title')}</strong>
          <span>{T('login.notice_body')}</span>
        </div>
      )}
      <h1>{mode === 'login' ? T('login.title_login') : T('login.title_register')}</h1>
      <p className="muted">{mode === 'login' ? T('login.sub_login') : T('login.sub_register')}</p>
      {mode === 'register' && <SignupFields form={form} setForm={setForm} errors={errors} />}
      {mode === 'register' && <h2 className="reg-legend">{T('reg.sec_account')}</h2>}
      <label>{T('login.email')}<input type="email" value={form.email} onChange={set('email')} required /></label>
      <label>{T('login.password')}<input type="password" value={form.password} onChange={set('password')} minLength={6} required /></label>
      {error && <p className="error">{error}</p>}
      <button className="primary" disabled={busy}>{mode === 'login' ? T('login.btn_login') : T('login.btn_register')}</button>
      <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setErrors({}); }}>
        {mode === 'login' ? T('login.to_register') : T('login.to_login')}
      </button>
    </form>
  );
}
