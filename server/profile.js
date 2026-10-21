// Customer profile (sign-up) fields with US-standard validation.
// This file is copied unchanged to client/src/profile.js so the browser and the server apply the same rules.
export const US_STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};
export const SEXES = ['Male', 'Female', 'Other'];

const NAME = /^[A-Za-z][A-Za-z' .-]*$/;
const s = (v) => String(v ?? '').trim();
const digits = (v) => String(v ?? '').replace(/\D/g, '');

export const formatPhone = (v) => {
  let d = digits(v);
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};
export const formatSsn = (v) => {
  const d = digits(v).slice(0, 9);
  return d.length < 4 ? d : d.length < 6 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
};
export const formatZip = (v) => {
  const d = digits(v).slice(0, 9);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export function ageFromDob(dob, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob || '');
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null; // e.g. 2001-02-30
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age -= 1;
  return age;
}

const phoneOk = (d) => /^[2-9]\d{2}[2-9]\d{6}$/.test(d); // NANP: area code and exchange cannot start with 0 or 1

// Returns { errors: { field: message }, profile } - profile holds the cleaned values when there are no errors.
export function validateProfile(input = {}, today = new Date()) {
  const e = {};
  const p = {};

  const name = (k, label, required) => {
    const v = s(input[k]).replace(/\s+/g, ' ');
    if (!v) { if (required) e[k] = `${label} is required`; p[k] = ''; return; }
    if (v.length > 50 || !NAME.test(v)) e[k] = `${label}: use letters, spaces, hyphens, apostrophes or periods only`;
    p[k] = v;
  };
  name('last_name', 'Last name', true);
  name('first_name', 'First name', true);
  name('middle_name', 'Middle name', false);

  p.sex = s(input.sex);
  if (!SEXES.includes(p.sex)) e.sex = 'Please choose a sex';

  p.dob = s(input.dob);
  const age = ageFromDob(p.dob, today);
  if (age === null) e.dob = 'Enter a valid date of birth';
  else if (new Date(p.dob) > today) e.dob = 'Date of birth cannot be in the future';
  else if (age < 18) e.dob = 'You must be 18 or older to create an account';
  else if (age > 120) e.dob = 'Enter a valid date of birth';
  p.age = age !== null && age >= 0 ? age : null;

  const ft = Number(input.height_ft); const inch = Number(input.height_in === '' || input.height_in == null ? NaN : input.height_in);
  if (!Number.isInteger(ft) || ft < 3 || ft > 8) e.height = 'Height: feet must be between 3 and 8';
  else if (!Number.isInteger(inch) || inch < 0 || inch > 11) e.height = 'Height: inches must be between 0 and 11';
  p.height_ft = ft; p.height_in = inch;

  const wt = Number(input.weight);
  if (!Number.isInteger(wt) || wt < 50 || wt > 700) e.weight = 'Weight must be a whole number of pounds between 50 and 700';
  p.weight = wt;

  const sd = digits(input.ssn);
  if (sd.length !== 9) e.ssn = 'Social Security # must have 9 digits (###-##-####)';
  else if (sd.startsWith('000') || sd.startsWith('666') || sd[0] === '9' || sd.slice(3, 5) === '00' || sd.slice(5) === '0000') e.ssn = 'That Social Security # is not valid';
  p.ssn = formatSsn(sd);

  p.address = s(input.address);
  if (p.address.length < 5 || p.address.length > 100) e.address = 'Enter your street address (5 to 100 characters)';
  p.city = s(input.city);
  if (!/^[A-Za-z][A-Za-z' .-]{1,49}$/.test(p.city)) e.city = 'Enter a valid city';
  p.state = s(input.state).toUpperCase();
  if (!US_STATES[p.state]) e.state = 'Choose a state';
  p.zip = formatZip(input.zip);
  if (!/^\d{5}(-\d{4})?$/.test(p.zip)) e.zip = 'ZIP must be 5 digits (or ZIP+4, 12345-6789)';

  const phone = (k, label) => {
    let d = digits(input[k]);
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    if (!d) { p[k] = ''; return; }
    if (!phoneOk(d)) e[k] = `${label} must be a valid 10-digit US number`;
    p[k] = formatPhone(d);
  };
  phone('home_phone', 'Home phone');
  phone('cell_phone', 'Cell phone');
  if (!p.home_phone && !p.cell_phone) e.cell_phone = 'Enter a cell phone or a home phone';

  const person = (prefix, label, required) => {
    const n = s(input[`${prefix}_name`]).replace(/\s+/g, ' ');
    const r = s(input[`${prefix}_relationship`]).replace(/\s+/g, ' ');
    p[`${prefix}_name`] = n; p[`${prefix}_relationship`] = r;
    if (!n && !r) { if (required) e[`${prefix}_name`] = `${label} is required`; return; }
    if (!n || n.length > 100 || !NAME.test(n)) e[`${prefix}_name`] = `${label}: enter the person's full name (letters only)`;
    if (!r || r.length < 2 || r.length > 50 || !/^[A-Za-z][A-Za-z' /.-]*$/.test(r)) e[`${prefix}_relationship`] = `${label}: enter the relationship (for example Spouse, Son, Daughter)`;
  };
  person('primary', 'Primary beneficiary', true);
  person('contingent', 'Contingent beneficiary', false);

  return { errors: e, profile: p };
}

// "Last, First Middle" - how the customer's name is shown across the site and admin.
export const displayName = (p) => `${p.last_name}, ${p.first_name}${p.middle_name ? ' ' + p.middle_name : ''}`;

// Contact-us form: name, message and at least one of phone / email.
export function validateContact(input = {}) {
  const e = {};
  const name = s(input.name).replace(/\s+/g, ' ');
  if (!name) e.name = 'Name is required';
  else if (name.length < 2 || name.length > 100 || !NAME.test(name)) e.name = 'Enter your name (letters, spaces, hyphens, apostrophes or periods)';
  let d = digits(input.phone);
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  if (d && !phoneOk(d)) e.phone = 'Enter a valid 10-digit US phone number';
  const email = s(input.email);
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) e.email = 'Enter a valid email address';
  if (!d && !email) e.email = e.email || 'Enter an email address or a phone number so we can reply';
  const message = s(input.message);
  if (!message) e.message = 'Message is required';
  else if (message.length < 10) e.message = 'Please write at least 10 characters';
  else if (message.length > 2000) e.message = 'Message is too long (2000 characters maximum)';
  return { errors: e, data: { name, phone: d && !e.phone ? formatPhone(d) : '', email, message } };
}
