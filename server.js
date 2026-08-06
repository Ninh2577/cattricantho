import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
};

const server = http.createServer((req, res) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  
  // Xử lý query params
  let urlPath = req.url.split('?')[0];
  
  // Mapping URL
  let filePath = '';
  
  if (urlPath === '/' || urlPath === '/index.html') {
    // Trang chủ
    filePath = path.join(DIST_DIR, 'pages', 'index.html');
  } else if (urlPath.startsWith('/image/')) {
    // Local image proxy redirect
    const parts = urlPath.split('/');
    if (parts.length >= 4) {
      const assetId = parts[2];
      res.writeHead(302, { Location: `https://us-west-2.graphassets.com/cmrwmii4g05ix07mv71dx83ti/${assetId}` });
      return res.end();
    }
  } else if (urlPath.startsWith('/assets/')) {
    // Static assets
    filePath = path.join(DIST_DIR, urlPath);
  } else {
    // Clean URLs (ví dụ: /tri -> /pages/tri.html)
    const ext = path.extname(urlPath);
    if (ext) {
      filePath = path.join(DIST_DIR, urlPath);
    } else {
      filePath = path.join(DIST_DIR, 'pages', `${urlPath.substring(1)}.html`);
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  let contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback 404
        const page404 = path.join(DIST_DIR, 'pages', '404.html');
        fs.readFile(page404, (err404, content404) => {
          if (err404) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content404, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n======================================`);
  console.log(`🚀 Local Server đang chạy tại:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`======================================\n`);
});
