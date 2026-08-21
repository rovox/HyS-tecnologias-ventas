/**
 * Fallback static server if Hostinger requires an entry file.
 * Serves apps/web/dist. No native binaries. SPA unknown paths → index.html.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.PORT) || 3000;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function send(res, file, status = 200) {
  const ext = path.extname(file);
  res.writeHead(status, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const file = path.join(dist, safe === '/' ? 'index.html' : safe);
  if (file.startsWith(dist) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    send(res, file);
    return;
  }
  send(res, path.join(dist, 'index.html'));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`POC static server on ${port} → ${dist}`);
});
