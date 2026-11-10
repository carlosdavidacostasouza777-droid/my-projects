// Servidor estático simples (sem dependências). Uso: npm start  →  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};
const PUBLIC_FILES = new Set(['index.html', 'sla.css', 'script.js']);

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.normalize(path.join(ROOT, urlPath));

  // bloqueia saída da pasta e arquivos internos (server.js, package.json...)
  const rel = path.relative(ROOT, file);
  const isAsset = rel.startsWith('img' + path.sep) || rel.startsWith('assets' + path.sep);
  if (rel.startsWith('..') || !(PUBLIC_FILES.has(rel) || isAsset)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Página não encontrada');
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Página não encontrada');
    }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const headers = { 'Content-Type': type, 'Cache-Control': 'no-cache' };
    if (/text|javascript|json|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      return res.end(zlib.gzipSync(data));
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}).listen(PORT, () => console.log(`Outbêco Pacheco rodando em http://localhost:${PORT}`));
