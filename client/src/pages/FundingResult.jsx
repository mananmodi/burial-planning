import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, setPlan } from '../api.js';
import { useT } from '../site.jsx';

// Where Stripe sends the customer back to. We ask the server to check the payment with Stripe.
export default function FundingResult({ cancelled }) {
  const T = useT();
  const [sp] = useSearchParams();
  const planId = sp.get('plan');
  const sessionId = sp.get('session_id');
  const [state, setState] = useState(cancelled ? 'cancelled' : 'checking');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cancelled || !planId || !sessionId) { if (!cancelled) setState('missing'); return; }
    setPlan(planId);
    api('/payments/verify', { method: 'POST', body: { session_id: sessionId } })
      .then((r) => { setResult(r); setState(r.paid ? 'paid' : 'unpaid'); })
      .catch((e) => { setError(e.message); setState('error'); });
  }, [cancelled, planId, sessionId]);

  const back = planId ? `/plan/${planId}` : '/plans';
  return (
    <div className="narrow card center funding-result" role="status">
      {state === 'checking' && <><h1>{T('fund.checking_title')}</h1><p className="muted">{T('fund.checking_text')}</p></>}
      {state === 'paid' && (
        <>
          <span className="ns-check" aria-hidden="true">&#10003;</span>
          <h1>{T('fund.paid_title')}</h1>
          <p>{T('fund.paid_body', { amount: result.amount, test: result.mode === 'test' ? T('fund.test_note') : '' })}</p>
        </>
      )}
      {state === 'unpaid' && <><h1>{T('fund.unpaid_title')}</h1><p className="muted">{T('fund.unpaid_body')}</p></>}
      {state === 'cancelled' && <><h1>{T('fund.cancel_title')}</h1><p className="muted">{T('fund.cancel_body')}</p></>}
      {state === 'missing' && <><h1>{T('fund.missing_title')}</h1><p className="muted">{T('fund.missing_body')}</p></>}
      {state === 'error' && <><h1>{T('fund.error_title')}</h1><p className="error">{error}</p><p className="muted">{T('fund.error_body')}</p></>}
      <p><Link className="btn primary-link" to={back}>{T('fund.back_plan')}</Link> <Link to="/plans">{T('fund.back_plans')}</Link></p>
    </div>
  );
}
