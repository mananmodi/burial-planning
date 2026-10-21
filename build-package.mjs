// Builds the upload package: node build-package.mjs   (or: npm run package)
// Result: deploy/burial-planning/  (+ deploy/burial-planning.zip when PowerShell/zip is available)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const out = path.join(root, 'deploy', 'burial-planning');
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' });

fs.rmSync(path.join(root, 'deploy'), { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'server'), { recursive: true });

console.log('1/4 building the client...');
run('npm run build', path.join(root, 'client'));

console.log('2/4 copying files...');
fs.cpSync(path.join(root, 'client', 'dist'), path.join(out, 'client', 'dist'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'server'))) {
  if (f.endsWith('.js') || f === 'package.json' || f === 'package-lock.json') fs.copyFileSync(path.join(root, 'server', f), path.join(out, 'server', f));
}
if (fs.existsSync(path.join(root, '.env'))) fs.copyFileSync(path.join(root, '.env'), path.join(out, '.env')); // the live server's settings; .env.local is never copied

fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify({
  name: 'burial-planning', private: true, type: 'module',
  scripts: { start: 'node server/index.js' },
}, null, 2));

console.log('3/4 installing server packages (production only)...');
run('npm install --omit=dev --no-audit --no-fund', path.join(out, 'server'));

fs.writeFileSync(path.join(out, 'README.txt'), `Gamez & Sons Burial Planning - upload package
=================================================
Needs a host that runs Node.js 20+ and MySQL (WP Engine / WordPress hosting cannot run it).

1. Upload this whole folder to the server (keep the folders as they are).
2. Edit .env: database settings, PORT, JWT_SECRET (keep it long and secret).
3. Start:  node server/index.js     (or "npm start"; on cPanel set the app startup file to server/index.js)
4. Open:   http://your-domain/            website
           http://your-domain/login       log in / sign up
           http://your-domain/admin/customers   admin (default admin@example.com / admin123 - change it)

The database tables and starter content are created automatically on first start.
To keep existing content, import your database dump (mysqldump) into the database first.
`);

console.log('4/4 zipping...');
try {
  const zip = path.join(root, 'deploy', 'burial-planning.zip');
  run(`powershell -NoProfile -Command "Compress-Archive -Path '${out}\\*' -DestinationPath '${zip}' -Force"`);
  console.log('\nZip:', zip);
} catch { console.log('\n(zip skipped - upload the folder instead)'); }
console.log('Folder:', out);
