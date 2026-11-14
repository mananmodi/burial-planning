import React, { useCallback, useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import { api } from './api.js';

// Standard math captcha: the server gives a question such as "7 × 3" and a signed token; the answer is checked on the server.
// Use a ref to call reset() (a new question is needed after every failed or finished attempt).
const Captcha = forwardRef(function Captcha({ value, onChange, error, idPrefix = 'captcha' }, ref) {
  const [c, setC] = useState(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setFailed(false);
    api('/auth/captcha').then((r) => { setC(r); onChange({ token: r.token, answer: '' }); }).catch(() => setFailed(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  useImperativeHandle(ref, () => ({ reset: load }), [load]);

  const id = `${idPrefix}-answer`;
  return (
    <div className="captcha">
      <label htmlFor={id}>Security check</label>
      {failed ? (
        <span className="field-err" role="alert">Could not load the question. <button type="button" className="link" onClick={load}>Try again</button></span>
      ) : (
        <span className="captcha-row">
          <span className="captcha-q" aria-live="polite">{c ? <>What is <strong>{c.question}</strong> ?</> : 'Loading…'}</span>
          <input id={id} type="text" inputMode="numeric" autoComplete="off" maxLength={4} className="captcha-in" disabled={!c}
            value={value.answer} onChange={(e) => onChange({ ...value, answer: e.target.value.replace(/[^\d-]/g, '') })}
            aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} />
          <button type="button" className="link" onClick={load} aria-label="Get a new question">↻ New question</button>
        </span>
      )}
      {error && <span id={`${id}-err`} className="field-err" role="alert">{error}</span>}
    </div>
  );
});
export default Captcha;
