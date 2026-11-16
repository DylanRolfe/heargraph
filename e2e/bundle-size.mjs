// Measures what each route downloads on first load, from the static export in ./out.
// Usage: node e2e/bundle-size.mjs [--json]
// For every out/**/index.html it finds the <script src> files and stylesheets the HTML
// references (including <link rel="preload" as="script">), gzips each one (zlib level 9)
// and prints per-route totals. Files loaded later by JavaScript are not counted.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const OUT = join(process.cwd(), 'out');
const TARGET_KB = 200;

if (!existsSync(OUT)) {
  console.error('out/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(1);

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return out;
}

function localFile(url) {
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:')) return null;
  const path = decodeURIComponent(url.split('?')[0].split('#')[0]);
  const file = join(OUT, path);
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

const all = walk(OUT);
const pages = all.filter((f) => f.endsWith('index.html')).sort();
const rows = [];
const missing = [];

for (const page of pages) {
  const rel = relative(OUT, page).split(sep).join('/');
  const route = rel === 'index.html' ? '/' : '/' + rel.slice(0, -'index.html'.length);
  const html = readFileSync(page);
  const text = html.toString('utf8');
  const js = new Set();
  const css = new Set();
  for (const m of text.matchAll(/<script\b[^>]*>/gi)) {
    const a = attrs(m[0].slice(7));
    if (a.src) js.add(a.src);
  }
  for (const m of text.matchAll(/<link\b[^>]*>/gi)) {
    const a = attrs(m[0].slice(5));
    if (!a.href) continue;
    const rel = (a.rel || '').toLowerCase();
    if (rel.includes('stylesheet') || (rel.includes('preload') && a.as === 'style')) css.add(a.href);
    else if ((rel.includes('preload') || rel.includes('modulepreload')) && (a.as === 'script' || rel.includes('modulepreload'))) js.add(a.href);
  }
  let jsRaw = 0;
  let jsGz = 0;
  let cssRaw = 0;
  let cssGz = 0;
  for (const url of js) {
    const file = localFile(url);
    if (!file) {
      missing.push(`${route}: ${url}`);
      continue;
    }
    const data = readFileSync(file);
    jsRaw += data.length;
    jsGz += gz(data);
  }
  for (const url of css) {
    const file = localFile(url);
    if (!file) {
      missing.push(`${route}: ${url}`);
      continue;
    }
    const data = readFileSync(file);
    cssRaw += data.length;
    cssGz += gz(data);
  }
  rows.push({
    route,
    jsFiles: js.size,
    jsRaw,
    jsGz,
    cssFiles: css.size,
    cssRaw,
    cssGz,
    htmlRaw: html.length,
    htmlGz: gz(html),
  });
}

const totalBytes = all.reduce((sum, f) => sum + statSync(f).size, 0);
const jsAll = all.filter((f) => f.endsWith('.js') && !f.endsWith(`${sep}sw.js`));
const jsAllGz = jsAll.reduce((sum, f) => sum + gz(readFileSync(f)), 0);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, totalBytes, fileCount: all.length, jsAllGz, missing }, null, 2));
} else {
  const header = ['Route', 'JS files', 'JS gzip KB', 'JS raw KB', 'CSS gzip KB', 'HTML gzip KB', 'Total gzip KB', `JS < ${TARGET_KB} KB`];
  const table = rows.map((r) => [
    r.route,
    String(r.jsFiles),
    kb(r.jsGz),
    kb(r.jsRaw),
    kb(r.cssGz),
    kb(r.htmlGz),
    kb(r.jsGz + r.cssGz + r.htmlGz),
    r.jsGz / 1024 < TARGET_KB ? 'yes' : 'NO',
  ]);
  const widths = header.map((h, i) => Math.max(h.length, ...table.map((row) => row[i].length)));
  const line = (cells) => '| ' + cells.map((c, i) => c.padEnd(widths[i])).join(' | ') + ' |';
  console.log(line(header));
  console.log('|' + widths.map((w) => '-'.repeat(w + 2)).join('|') + '|');
  for (const row of table) console.log(line(row));
  console.log('');
  console.log(`Total size of out/: ${kb(totalBytes)} KB uncompressed in ${all.length} files.`);
  console.log(`All JavaScript chunks in out/ (every route, excluding sw.js): ${kb(jsAllGz)} KB gzipped in ${jsAll.length} files.`);
  const worst = rows.reduce((a, b) => (b.jsGz > a.jsGz ? b : a));
  console.log(`Largest first-load JS: ${kb(worst.jsGz)} KB gzipped on ${worst.route} (target: under ${TARGET_KB} KB).`);
  if (missing.length > 0) {
    console.log('Referenced files not found in out/ (not counted):');
    for (const m of missing) console.log('  ' + m);
  }
}
