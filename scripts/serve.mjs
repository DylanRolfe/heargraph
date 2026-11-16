// Tiny static file server for the exported site in ./out (used by `npm start` and the e2e tests).
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const OUT = join(process.cwd(), 'out');
const PORT = Number(process.env.PORT || process.argv[2] || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = normalize(join(OUT, path));
  if (!file.startsWith(OUT)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    const notFound = join(OUT, '404.html');
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`HearGraph static build at http://localhost:${PORT}`));
