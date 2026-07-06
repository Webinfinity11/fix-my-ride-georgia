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
import { createReadStream, existsSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import http from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = 4178;

// Phase A.1 — truly static routes only. No DB-driven content.
// Adding more later (Phase A.2): /, /services, /mechanic, /category, /blog, /vacancies, etc.
const ROUTES = [
  // Homepage — prerendered into the root dist/index.html so the hero H1 +
  // search UI paint instantly (fixes mobile LCP: was blank until the JS bundle
  // rendered). Because this file is ALSO the SPA fallback, every prerendered
  // file is stamped with <html data-ssg="..."> and index.html carries a guard
  // script that hides mismatched content on non-prerendered routes (no flash).
  '/',
  '/about',
  '/contact',
  '/privacy-policy',
  // Phase A.2 — first dynamic listing page (safe: it's a route folder, not the
  // root SPA-fallback index.html). Bakes the H1 + services + canonical into
  // raw HTML for fast LCP + reliable SEO.
  '/services',
];

// Read PARENT category routes (/category/<slug>, no district segment) from the
// already-generated category-sitemap.xml. Keeps the exact slugs the sitemap
// computed — no DB/slug duplication here. District variants are intentionally
// excluded (too many to prerender every build).
function getCategoryRoutes() {
  try {
    const xmlPath = join(DIST, 'category-sitemap.xml');
    if (!existsSync(xmlPath)) return [];
    const xml = readFileSync(xmlPath, 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const routes = locs
      .map((u) => { try { return new URL(u).pathname; } catch { return null; } })
      .filter((p) => p && /^\/category\/[^/]+$/.test(p)); // parent only
    return [...new Set(routes)];
  } catch {
    return [];
  }
}

// Georgian→Latin slug — kept in sync with src/utils/slugUtils.ts.
const georgianToLatin = {
  'ა':'a','ბ':'b','გ':'g','დ':'d','ე':'e','ვ':'v','ზ':'z','თ':'t','ი':'i','კ':'k','ლ':'l','მ':'m','ნ':'n','ო':'o','პ':'p','ჟ':'zh','რ':'r','ს':'s','ტ':'t','უ':'u','ფ':'p','ქ':'q','ღ':'gh','ყ':'q','შ':'sh','ჩ':'ch','ც':'ts','ძ':'dz','წ':'ts','ჭ':'ch','ხ':'kh','ჯ':'j','ჰ':'h'
};
function createSlug(text) {
  if (!text) return '';
  return text.toLowerCase().split('').map(c => georgianToLatin[c] || c).join('')
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

// Top-N service detail routes: VIP first, then most recent. Uses the public
// (anon) Supabase key from env. Build-time only — new services added later get
// full JS-rendered SEO immediately and are prerendered on the next deploy.
async function getTopServiceRoutes(limit = 100) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn('[prerender] Supabase env missing — skipping service prerender.');
    return [];
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from('mechanic_services')
      .select('id, name, slug, is_vip_active, created_at')
      .eq('is_active', true)
      .order('is_vip_active', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.warn('[prerender] service query failed:', error.message); return []; }
    return (data || []).map((s) => `/service/${s.id}-${s.slug || createSlug(s.name)}`);
  } catch (e) {
    console.warn('[prerender] service prerender skipped:', e.message);
    return [];
  }
}

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
  // Snapshot the pristine shell ONCE, before any prerender overwrites
  // dist/index.html. Prerendering '/' writes the homepage into dist/index.html;
  // if we re-read that file for the SPA fallback afterwards, other routes would
  // be served the homepage snapshot (and rendered on top of it). Serving the
  // cached empty shell keeps every route's prerender clean regardless of order.
  const shell = readFileSync(join(DIST, 'index.html'));
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        let pathname = decodeURIComponent(url.pathname);
        if (pathname.endsWith('/')) pathname += 'index.html';
        let filePath = join(DIST, pathname);

        // Root index.html always serves the pristine shell (never a prerendered
        // overwrite) so the homepage render itself starts from the clean shell.
        const isRootIndex = pathname === '/index.html' || pathname === 'index.html';
        if (!isRootIndex && existsSync(filePath) && statSync(filePath).isFile()) {
          const ext = extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          createReadStream(filePath).pipe(res);
          return;
        }

        // SPA fallback (and root) — serve the cached pristine shell so React
        // Router can render the route from a clean slate.
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(shell);
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
  const categoryRoutes = getCategoryRoutes();
  const serviceRoutes = await getTopServiceRoutes(100);
  const allRoutes = [...ROUTES, ...categoryRoutes, ...serviceRoutes];
  console.log(`[prerender] routes: ${ROUTES.length} static + ${categoryRoutes.length} categories + ${serviceRoutes.length} services = ${allRoutes.length}`);

  // Render a single route (own page). Extracted so we can run a concurrency
  // pool — sequential prerender of 140+ routes would take ~15 min.
  const renderRoute = async (route) => {
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

      // Wait until react-helmet has flushed the REAL <head> — i.e. the title is
      // no longer the loading placeholder AND a canonical link exists. Data-heavy
      // pages (service detail) render the body (H1) before the head settles, so
      // networkidle alone can capture a stale "იტვირთება…" title.
      await page
        .waitForFunction(
          () => !/იტვირთება/.test(document.title) && !!document.querySelector('link[rel="canonical"]'),
          { timeout: 8000 }
        )
        .catch(() => {});

      // Extra settle time so any final Helmet meta updates land.
      await new Promise((r) => setTimeout(r, 300));

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

      // Stamp the served route onto <html data-ssg="..."> so the index.html
      // guard can hide this snapshot when it's served as the SPA fallback for a
      // different URL. Strip any stray guard <style> the DOM captured, and any
      // pre-existing data-ssg (e.g. captured from the homepage fallback shell).
      html = html.replace(/<style id="__ssg_guard__">[\s\S]*?<\/style>/g, '');
      html = html.replace(/\sdata-ssg="[^"]*"/gi, '');
      html = html.replace(/<html(\s|>)/i, `<html data-ssg="${route}"$1`);

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
  };

  // Concurrency pool — process routes in parallel (bounded).
  const CONCURRENCY = 5;
  const queue = [...allRoutes];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const route = queue.shift();
        if (route === undefined) break;
        await renderRoute(route);
      }
    })
  );

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
