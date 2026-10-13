// Retain hashed JS/CSS in memory when dist is rebuilt under an open local tab.
// HTML is always fresh; SPA routes work even with a targeted prerender build.
import http from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function createPreviewServer(directory) {
  const root = resolve(directory), retained = new Map();
  let retainedBytes = 0;
  function remember(name) {
    if (retained.has(name)) return retained.get(name);
    const file = join(root, name);
    if (!existsSync(file)) return;
    const body = readFileSync(file);
    retained.set(name, body); retainedBytes += body.length;
    while (retainedBytes > 20 * 1024 * 1024 && retained.size > 1) {
      const oldest = retained.keys().next().value;
      retainedBytes -= retained.get(oldest).length; retained.delete(oldest);
    }
    return body;
  }
  function captureAssets() {
    const assets = join(root, 'assets');
    if (!existsSync(assets)) return;
    for (const name of readdirSync(assets)) if (/\.(js|css)$/.test(name)) remember(`assets/${name}`);
  }
  captureAssets();
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer((request, response) => {
    try {
      captureAssets();
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let name = pathname.replace(/^\/+/, '');
      const full = resolve(root, name);
      if (!full.startsWith(root + '/') && full !== root) { response.writeHead(403); return response.end(); }
      if (/^assets\/.*\.(js|css)$/.test(name)) {
        const body = remember(name);
        if (!body) { response.writeHead(404, { 'Cache-Control': 'no-store' }); return response.end('Not found'); }
        response.writeHead(200, { 'Content-Type': types[extname(name)], 'Cache-Control': 'public, max-age=31536000, immutable' });
        return response.end(body);
      }
      if (existsSync(full) && statSync(full).isDirectory()) name = join(name, 'index.html');
      if (!existsSync(join(root, name))) {
        if (extname(name) || name.startsWith('assets/')) { response.writeHead(404, { 'Cache-Control': 'no-store' }); return response.end('Not found'); }
        name = 'index.html';
      }
      const body = readFileSync(join(root, name));
      response.writeHead(200, { 'Content-Type': types[extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(body);
    } catch {
      if (response.headersSent) return response.destroy();
      response.writeHead(503, { 'Cache-Control': 'no-store' }); response.end('Preview is rebuilding; try again.');
    }
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 4180);
  createPreviewServer(resolve('dist')).listen(port, '127.0.0.1', () => console.log(`Preview: http://localhost:${port}`));
}
