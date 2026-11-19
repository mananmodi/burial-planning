import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { validateProfile } from '../profile.js';
import SignupFields, { blankProfile } from './SignupFields.jsx';
import { Loader } from '../Skeleton.jsx';

const focusFirstError = () => setTimeout(() => document.querySelector('form [aria-invalid="true"]')?.focus(), 0);

export function EditProfile() {
  const { updateUser } = useAuth();
  const [acct, setAcct] = useState(null);
  const [form, setForm] = useState(blankProfile());
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Edit profile';
    api('/me/profile').then((a) => { setAcct(a); setName(a.name); if (a.profile) setForm({ ...blankProfile(), ...a.profile });
      else if (a.role !== 'admin') { // older account without a saved profile: pre-fill what we know (the name)
        const [last, rest] = a.name.includes(',') ? a.name.split(/,\s*(.*)/s) : ['', a.name];
        const [first = '', ...mid] = (rest || '').trim().split(/\s+/);
        setForm({ ...blankProfile(), last_name: last.trim(), first_name: first, middle_name: mid.join(' ') });
      } })
      .catch((e) => setMsg({ ok: '', err: e.message }));
  }, []);

  const full = !!acct && (!!acct.profile || acct.role !== 'admin'); // customers always get the full sign-up form

  if (!acct) return msg.err ? <p className="error narrow" role="alert">{msg.err}</p> : <Loader />;

  const submit = async (e) => {
    e.preventDefault();
    const v = full ? validateProfile(form).errors : (name.trim() ? {} : { name: 'Enter your name' });
    setErrors(v); setMsg({ ok: '', err: '' });
    if (Object.keys(v).length) { setMsg({ ok: '', err: 'Please correct the highlighted fields.' }); focusFirstError(); return; }
    setBusy(true);
    try {
      const r = await api('/me/profile', { method: 'PUT', body: full ? form : { name } });
      updateUser(r.user);
      setMsg({ ok: 'Your profile has been updated.', err: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (ex) { setErrors(ex.fields || {}); setMsg({ ok: '', err: ex.message }); focusFirstError(); }
    setBusy(false);
  };

  return (
    <form className="card reg-card account-card" onSubmit={submit} noValidate>
      <h1>Edit profile</h1>
      <p className="muted">Signed in as <strong>{acct.email}</strong>. Your saved details are shown below. Change only what you need to - every field that is required at sign-up must stay filled in and valid. Your email address cannot be changed here.{!acct.profile && full && ' Please complete your details below.'}</p>
      {msg.ok && <p className="account-ok" role="status">&#10003; {msg.ok}</p>}
      {full
        ? <SignupFields form={form} setForm={setForm} errors={errors} />
        : <label>Name<input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} {...(errors.name ? { 'aria-invalid': true } : {})} />{errors.name && <span className="field-err" role="alert">{errors.name}</span>}</label>}
      {msg.err && <p className="error" role="alert">{msg.err}</p>}
      <div className="actions">
        <Link className="btn-plain" to="/plans">Cancel</Link>
        <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  );
}

export function ChangePassword() {
  const [f, setF] = useState({ current_password: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = 'Change password'; }, []);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };
  const err = (k) => (errors[k] ? <span className="field-err" role="alert">{errors[k]}</span> : null);
  const bad = (k) => (errors[k] ? { 'aria-invalid': true } : {});

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!f.current_password) v.current_password = 'Enter your current password';
    if (!f.password) v.password = 'Enter a new password';
    else if (f.password.length < 8) v.password = 'Password must be at least 8 characters';
    else if (!/[a-z]/.test(f.password) || !/[A-Z]/.test(f.password) || !/\d/.test(f.password)) v.password = 'Password must include an uppercase letter, a lowercase letter and a number';
    if (!v.password && f.password !== f.confirm_password) v.confirm_password = f.confirm_password ? 'Passwords do not match' : 'Confirm your new password';
    setErrors(v); setMsg({ ok: '', err: '' });
    if (Object.keys(v).length) { focusFirstError(); return; }
    setBusy(true);
    try {
      await api('/me/password', { method: 'POST', body: f });
      setF({ current_password: '', password: '', confirm_password: '' });
      setMsg({ ok: 'Your password has been changed.', err: '' });
    } catch (ex) { setErrors(ex.fields || {}); setMsg({ ok: '', err: Object.keys(ex.fields || {}).length ? '' : ex.message }); focusFirstError(); }
    setBusy(false);
  };

  return (
    <form className="card narrow account-card" onSubmit={submit} noValidate>
      <h1>Change password</h1>
      {msg.ok && <p className="account-ok" role="status">&#10003; {msg.ok}</p>}
      <label>Current password<input type="password" value={f.current_password} onChange={set('current_password')} maxLength={72} autoComplete="current-password" {...bad('current_password')} />{err('current_password')}</label>
      <label>New password<input type="password" value={f.password} onChange={set('password')} maxLength={72} autoComplete="new-password" {...bad('password')} />
        {err('password') || <span className="field-hint">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</span>}</label>
      <label>Confirm new password<input type="password" value={f.confirm_password} onChange={set('confirm_password')} maxLength={72} autoComplete="new-password" {...bad('confirm_password')} />{err('confirm_password')}</label>
      {msg.err && <p className="error" role="alert">{msg.err}</p>}
      <div className="actions">
        <Link className="btn-plain" to="/plans">Cancel</Link>
        <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
      </div>
    </form>
  );
}
