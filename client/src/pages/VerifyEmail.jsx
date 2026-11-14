import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

// Opened from the link in the verification email.
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState({ status: token ? 'working' : 'error', message: token ? '' : 'This verification link is not valid.' });
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return; // the link can only be used once, so do not run twice (React strict mode)
    ran.current = true;
    api('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setState({ status: 'ok', message: '' }))
      .catch((e) => setState({ status: 'error', message: e.message }));
  }, [token]);

  return (
    <div className="card narrow center" role="status" aria-live="polite">
      {state.status === 'working' && <><h1>Verifying your email…</h1><p className="muted">One moment please.</p></>}
      {state.status === 'ok' && (
        <>
          <h1>Email verified</h1>
          <p>Thank you. Your email address is confirmed and your account is ready.</p>
          <Link className="btn primary" to="/login">Log in</Link>
        </>
      )}
      {state.status === 'error' && (
        <>
          <h1>We could not verify your email</h1>
          <p className="error" role="alert">{state.message}</p>
          <p className="muted">Log in with your email and password to get a new verification link.</p>
          <Link className="btn primary" to="/login">Go to log in</Link>
        </>
      )}
    </div>
  );
}
