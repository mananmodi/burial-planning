import React from 'react';
import { useT } from '../site.jsx';
import { SEXES, US_STATES, formatPhone, formatSsn, formatZip } from '../profile.js';

export const blankProfile = () => ({
  last_name: '', first_name: '', middle_name: '', sex: '', dob: '', height_ft: '', height_in: '', weight: '', ssn: '',
  address: '', city: '', state: '', zip: '', home_phone: '', cell_phone: '',
  primary_name: '', primary_relationship: '', contingent_name: '', contingent_relationship: '',
});

const today = () => new Date().toISOString().slice(0, 10);

// The extra sign-up fields. `form`/`set` come from the parent; `errors` is { field: message }.
export default function SignupFields({ form, setForm, errors }) {
  const T = useT();
  const val = (k) => form[k];
  const on = (k, fmt) => (e) => setForm({ ...form, [k]: fmt ? fmt(e.target.value) : e.target.value });
  const err = (...ks) => { const k = ks.find((x) => errors[x]); return k ? <span className="field-err" role="alert">{errors[k]}</span> : null; };
  const bad = (...ks) => (ks.some((k) => errors[k]) ? { 'aria-invalid': true } : {});

  return (
    <>
      <fieldset className="reg-block">
        <legend>{T('reg.sec_name')}</legend>
        <div className="reg-grid">
          <label>{T('reg.last_name')}<input value={val('last_name')} onChange={on('last_name')} autoComplete="family-name" maxLength={50} {...bad('last_name')} />{err('last_name')}</label>
          <label>{T('reg.first_name')}<input value={val('first_name')} onChange={on('first_name')} autoComplete="given-name" maxLength={50} {...bad('first_name')} />{err('first_name')}</label>
          <label>{T('reg.middle_name')}<input value={val('middle_name')} onChange={on('middle_name')} autoComplete="additional-name" maxLength={50} {...bad('middle_name')} />{err('middle_name')}</label>
          <label>{T('reg.sex')}
            <select value={val('sex')} onChange={on('sex')} autoComplete="sex" {...bad('sex')}>
              <option value="">{T('reg.choose')}</option>
              {SEXES.map((x) => <option key={x}>{x}</option>)}
            </select>{err('sex')}
          </label>
          <label>{T('reg.dob')}<input type="date" value={val('dob')} max={today()} min="1900-01-01" onChange={on('dob')} autoComplete="bday" {...bad('dob')} />{err('dob')}</label>
          <div className="reg-field">
            <span className="lbl">{T('reg.height')}</span>
            <span className="reg-height">
              <input type="number" inputMode="numeric" min="3" max="8" value={val('height_ft')} onChange={on('height_ft')} aria-label={`${T('reg.height')} ${T('reg.feet')}`} {...bad('height')} /> {T('reg.feet')}
              <input type="number" inputMode="numeric" min="0" max="11" value={val('height_in')} onChange={on('height_in')} aria-label={`${T('reg.height')} ${T('reg.inches')}`} {...bad('height')} /> {T('reg.inches')}
            </span>
            {err('height')}
          </div>
          <label>{T('reg.weight')}<input type="number" inputMode="numeric" min="50" max="700" value={val('weight')} onChange={on('weight')} {...bad('weight')} />{err('weight')}</label>
          <label>{T('reg.ssn')}<input value={val('ssn')} onChange={on('ssn', formatSsn)} inputMode="numeric" placeholder="123-45-6789" maxLength={11} autoComplete="off" {...bad('ssn')} />
            {err('ssn') || <span className="field-hint">{T('reg.ssn_hint')}</span>}
          </label>
        </div>
      </fieldset>

      <fieldset className="reg-block">
        <legend>{T('reg.sec_contact')}</legend>
        <div className="reg-grid">
          <label className="wide2">{T('reg.address')}<input value={val('address')} onChange={on('address')} autoComplete="street-address" maxLength={100} {...bad('address')} />{err('address')}</label>
          <label>{T('reg.city')}<input value={val('city')} onChange={on('city')} autoComplete="address-level2" maxLength={50} {...bad('city')} />{err('city')}</label>
          <label>{T('reg.state')}
            <select value={val('state')} onChange={on('state')} autoComplete="address-level1" {...bad('state')}>
              <option value="">{T('reg.choose')}</option>
              {Object.entries(US_STATES).map(([c, n]) => <option key={c} value={c}>{c} – {n}</option>)}
            </select>{err('state')}
          </label>
          <label>{T('reg.zip')}<input value={val('zip')} onChange={on('zip', formatZip)} inputMode="numeric" placeholder="78043" maxLength={10} autoComplete="postal-code" {...bad('zip')} />{err('zip')}</label>
          <label>{T('reg.home_phone')}<input type="tel" value={val('home_phone')} onChange={on('home_phone', formatPhone)} placeholder="(956) 555-0123" maxLength={14} autoComplete="tel-national" {...bad('home_phone')} />{err('home_phone')}</label>
          <label>{T('reg.cell_phone')}<input type="tel" value={val('cell_phone')} onChange={on('cell_phone', formatPhone)} placeholder="(956) 555-0123" maxLength={14} autoComplete="tel" {...bad('cell_phone')} />
            {err('cell_phone') || <span className="field-hint">{T('reg.phone_hint')}</span>}
          </label>
        </div>
      </fieldset>

      <fieldset className="reg-block">
        <legend>{T('reg.sec_beneficiary')}</legend>
        <div className="reg-grid">
          <label>{T('reg.primary')}<input value={val('primary_name')} onChange={on('primary_name')} maxLength={100} {...bad('primary_name')} />{err('primary_name')}</label>
          <label>{T('reg.primary_rel')}<input value={val('primary_relationship')} onChange={on('primary_relationship')} maxLength={50} {...bad('primary_relationship')} />{err('primary_relationship')}</label>
          <label>{T('reg.contingent')}<input value={val('contingent_name')} onChange={on('contingent_name')} maxLength={100} {...bad('contingent_name')} />{err('contingent_name')}</label>
          <label>{T('reg.contingent_rel')}<input value={val('contingent_relationship')} onChange={on('contingent_relationship')} maxLength={50} {...bad('contingent_relationship')} />{err('contingent_relationship')}</label>
        </div>
      </fieldset>
    </>
  );
}
