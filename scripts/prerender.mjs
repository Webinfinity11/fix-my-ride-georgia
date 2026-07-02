#!/usr/bin/env node
// Post-build static prerendering for SEO.
//
// Phase A.1 scope: only TRULY STATIC routes (no DB-driven content).
// This is the cautious first pass — once verified in production, we expand
// to list/landing pages (Phase A.2) and detail pages (Phase B).
//
// What it does:
//   1. After `vite build`, spawn a tiny static server over dist/
//      with SPA fallback (so /about resolves to dist/index.html before
//      we've prerendered it).
//   2. Launch headless Chromium via puppeteer.
//   3. For each route, navigate, wait for content settle, capture HTML.
//   4. Write rendered HTML to dist/<route>/index.html.
//   5. Lovable's static hosting will then serve our snapshot for that
//      URL before falling back to the SPA shell.
//
// Safety:
//   - SKIP_PRERENDER=1 env → skip entirely (build keeps working).
//   - Missing puppeteer → skip, log, exit 0.
//   - Missing dist/ → skip, exit 0.
//   - Per-route failure → skip that route, continue others, exit 0.
//   - We NEVER fail the build. Existing SPA fallback still works.
//
// Rollback: remove `"postbuild"` line from package.json.

import { writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import http from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4178;

// Phase A.1 — truly static routes only. No DB-driven content.
// Adding more later (Phase A.2): /, /services, /mechanic, /category, /blog, /vacancies, etc.
const ROUTES = [
  '/about',
  '/contact',
  '/privacy-policy',
  // Phase A.2 — first dynamic listing page (safe: it's a route folder, not the
  // root SPA-fallback index.html). Bakes the H1 + services + canonical into
  // raw HTML for fast LCP + reliable SEO.
  '/services',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.xml':  'application/xml; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        let pathname = decodeURIComponent(url.pathname);
        if (pathname.endsWith('/')) pathname += 'index.html';
        let filePath = join(DIST, pathname);

        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const ext = extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          createReadStream(filePath).pipe(res);
          return;
        }

        // SPA fallback — serve index.html so React Router can render the route.
        const indexPath = join(DIST, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        createReadStream(indexPath).pipe(res);
      } catch (e) {
        res.writeHead(500); res.end('server error');
      }
    });
    server.on('error', reject);
    server.listen(PORT, () => resolve(server));
  });
}

async function main() {
  if (process.env.SKIP_PRERENDER === '1') {
    console.log('[prerender] SKIP_PRERENDER=1 — skipping.');
    return;
  }

  // Verify dist/ exists from the preceding `vite build`.
  try {
    const s = await stat(DIST);
    if (!s.isDirectory()) throw new Error('not a directory');
  } catch {
    console.warn('[prerender] dist/ not found — skipping (did vite build run?).');
    return;
  }

  // Lazy import: don't crash if puppeteer isn't installed (dev convenience).
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.warn('[prerender] puppeteer not installed — skipping. Run `npm install` to enable.');
    return;
  }

  const server = await startStaticServer();
  console.log(`[prerender] static server up on :${PORT}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (e) {
    console.warn(`[prerender] puppeteer failed to launch: ${e.message} — skipping.`);
    server.close();
    return;
  }

  let ok = 0, fail = 0;
  for (const route of ROUTES) {
    const page = await browser.newPage();
    try {
      // Block analytics / external trackers — they may hang networkidle.
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (
          url.includes('googletagmanager.com') ||
          url.includes('google-analytics.com') ||
          url.includes('doubleclick.net') ||
          url.includes('gpteng.co')
        ) {
          return req.abort();
        }
        req.continue();
      });

      const url = `http://localhost:${PORT}${route}`;
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Extra settle time so any final Helmet meta updates land.
      await new Promise((r) => setTimeout(r, 250));

      let html = await page.content();

      // Strip the gptengineer.js dev tagger — it's dev-only and adds noise.
      html = html.replace(/<script[^>]+src="https:\/\/cdn\.gpteng\.co\/[^"]*"[^>]*><\/script>/g, '');

      // Deduplicate <meta name="..."> tags — Helmet leaves both the index.html
      // default AND its own (data-rh="true") override in the DOM. Keep the
      // Helmet-managed one (it's the per-route value); drop the default.
      // Same for description, keywords, robots, og:*, twitter:* etc.
      const helmetManaged = new Set();
      html = html.replace(/<meta\s+([^>]*?)\s*\/?>/g, (full, attrs) => {
        if (/data-rh="true"/.test(attrs)) {
          const m = attrs.match(/(?:name|property)="([^"]+)"/);
          if (m) helmetManaged.add(m[1]);
        }
        return full;
      });
      html = html.replace(/<meta\s+([^>]*?)\s*\/?>/g, (full, attrs) => {
        if (/data-rh="true"/.test(attrs)) return full; // keep Helmet version
        const m = attrs.match(/(?:name|property)="([^"]+)"/);
        if (m && helmetManaged.has(m[1])) return ''; // drop default duplicate
        return full;
      });

      // Same for <title> — keep only one (Helmet's wins; it appears last in <head>).
      const titleMatches = [...html.matchAll(/<title[^>]*>[\s\S]*?<\/title>/g)];
      if (titleMatches.length > 1) {
        // Drop all but the last <title>.
        for (let i = 0; i < titleMatches.length - 1; i++) {
          html = html.replace(titleMatches[i][0], '');
        }
      }

      // Same for canonical link.
      const canonicals = [...html.matchAll(/<link\s+[^>]*rel="canonical"[^>]*>/g)];
      if (canonicals.length > 1) {
        for (let i = 0; i < canonicals.length - 1; i++) {
          html = html.replace(canonicals[i][0], '');
        }
      }

      // Minimal sanity check — abort if shell is empty (something broke).
      if (!html.includes('<div id="root">') || html.length < 5000) {
        throw new Error(`output looks broken (${html.length} bytes)`);
      }

      const outDir = join(DIST, route.replace(/^\//, ''));
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, 'index.html'), html, 'utf8');
      console.log(`[prerender] ✓ ${route} → dist${route}/index.html (${(html.length / 1024).toFixed(1)} KB)`);
      ok++;
    } catch (e) {
      console.error(`[prerender] ✗ ${route}: ${e.message}`);
      fail++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`[prerender] done — ${ok} succeeded, ${fail} failed.`);
  // Never fail the build.
  process.exit(0);
}

main().catch((err) => {
  console.error('[prerender] unexpected error:', err);
  process.exit(0);
});
