// Loads settings from .env files in the project root and accepts the common alternative names for the database
// settings. Real environment variables always win over the files.
// .env.local (your own computer only - never upload it) is read first, so it wins over .env (the live server's settings).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const name of ['.env.local', '.env']) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    const v = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
const alias = (to, ...from) => { if (process.env[to] === undefined) { const f = from.find((k) => process.env[k] !== undefined); if (f) process.env[to] = process.env[f]; } };
alias('DB_NAME', 'DB_DATABASE');
alias('DB_USER', 'DB_USERNAME');
