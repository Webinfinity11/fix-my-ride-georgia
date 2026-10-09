#!/usr/bin/env node
// Post-build static prerendering for SEO.
//
// Public route HTML, including every active service from the prebuild inventory.
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
//   - Incomplete output fails the build, rather than silently publishing SPA
//     fallback pages in place of the promised service HTML.
//
// Rollback: remove `"postbuild"` line from package.json.

import { writeFile, mkdir, stat } from 'node:fs/promises';
import { createReadStream, existsSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import http from 'node:http';
import { injectCategoryBootShells, injectCategoryInitialData } from './category-boot-shell.mjs';
import { cleanPrerenderResources, injectLcpImagePreload } from './prerender-resources.mjs';
import { getSnapshotCSS } from './snapshot-css.mjs';
import { getServiceRoutes, prepareServiceSnapshot, assertServiceDocument } from './service-prerender.mjs';

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

// Brand landing pages — read the qualifying /brand and /brand/:slug URLs from
// the already-generated brand-sitemap.xml (same gate the sitemap applied).
function getBrandRoutes() {
  try {
    const xmlPath = join(DIST, 'brand-sitemap.xml');
    if (!existsSync(xmlPath)) return [];
    const xml = readFileSync(xmlPath, 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const routes = locs
      .map((u) => { try { return new URL(u).pathname; } catch { return null; } })
      .filter((p) => p && /^\/brand(\/[^/]+){0,2}$/.test(p));
    return [...new Set(routes)];
  } catch {
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
    throw new Error('dist/ not found (did vite build run?)');
  }

  // Lazy import: don't crash if puppeteer isn't installed (dev convenience).
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    throw new Error('puppeteer not installed; public HTML cannot be generated');
  }

  const pristineShell = readFileSync(join(DIST, 'index.html'), 'utf8');
  const server = await startStaticServer();
  console.log(`[prerender] static server up on :${PORT}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (e) {
    server.close();
    throw e;
  }

  let ok = 0, fail = 0;
  const failedRoutes = [];
  const categoryRoutes = getCategoryRoutes();
  const brandRoutes = getBrandRoutes();
  const serviceRoutes = getServiceRoutes(join(__dirname, '..'));
  if (!serviceRoutes.length) throw new Error('No public service routes generated');
  const requestedRoutes = process.env.PRERENDER_ROUTES?.split(',');
  const allRoutes = [...ROUTES, ...categoryRoutes, ...brandRoutes, ...serviceRoutes]
    .filter(route => !requestedRoutes || requestedRoutes.includes(route));
  console.log(`[prerender] routes: ${ROUTES.length} static + ${categoryRoutes.length} categories + ${brandRoutes.length} brands + ${serviceRoutes.length} services = ${allRoutes.length}`);

  // Render a single route (own page). Extracted so we can run a concurrency
  // pool — sequential prerender of 140+ routes would take ~15 min.
  const categoryBootShells = {};
  let categoryHeader = "";
  const renderRoute = async (route) => {
    let page;
    const runtimeErrors = [];
    try {
      try {
        page = await browser.newPage();
      } catch (error) {
        // Chromium can lose its default-context session between captures. In
        // sequential mode it is safe to restart and retry this route once.
        if (CONCURRENCY !== 1) throw error;
        console.warn(`[prerender] restarting Chromium before ${route}: ${error.message}`);
        await browser.close().catch(() => {});
        browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        page = await browser.newPage();
      }
      page.on('pageerror', error => runtimeErrors.push(error.message));
      // Block analytics / external trackers — they may hang networkidle.
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        // Capturing markup does not require downloading every gallery photo.
        if (req.resourceType() === 'image') return req.respond({
          status: 200, contentType: 'image/png',
          body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGz0AAAAASUVORK5CYII=', 'base64'),
        });
        if (['media', 'font'].includes(req.resourceType())) return req.abort();
        // A build must never inflate visits or send other application writes.
        if (url.includes('.supabase.co/') && req.method() !== 'GET' && req.method() !== 'OPTIONS') return req.abort();
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
      await page.evaluateOnNewDocument(() => { window.__fixupPrerenderCapture = true; });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (route.startsWith('/service/')) {
        const expectedId = route.match(/^\/service\/(\d+)/)[1];
        await page.waitForSelector(`[data-service-page-id="${expectedId}"]`, { timeout: 20000 });
      } else {
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 30000 });
      }

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

      // Only public, successfully rendered parent category headings are cached.
      // No service cards, counts, prices, or account state enter the boot shell.
      if (/^\/category\/[^/]+$/.test(route)) {
        const shell = await page.evaluate(() => {
          const hero = document.querySelector('[data-category-shell="hero"]');
          const breadcrumb = document.querySelector('[data-category-shell="breadcrumb"]');
          if (!hero || !breadcrumb) return null;
          const copy = hero.cloneNode(true);
          copy.querySelectorAll('[data-service-count]').forEach(node => { node.textContent = '\u00a0'; });
          return {
            header: document.querySelector('header')?.outerHTML ?? '',
            body: breadcrumb.outerHTML + copy.outerHTML,
          };
        });
        if (shell) {
          categoryHeader ||= shell.header;
          categoryBootShells[route] = shell.body;
        }
      }

      const snapshotClasses = await page.evaluate(() =>
        [...new Set([...document.querySelectorAll('[class]')].flatMap(node => [...node.classList]))]
      );
      let html = cleanPrerenderResources(await page.content(), pristineShell);
      let serviceSnapshot;
      if (route.startsWith('/service/')) {
        const rendered = await page.evaluate(async () => {
          const output = await window.__fixupRenderServiceSnapshot();
          // Read the document and its root in the same synchronous turn.
          // Optional widget queries may finish while the renderer is imported.
          return { ...output, document: document.documentElement.outerHTML, oldRoot: document.getElementById('root').outerHTML };
        });
        if (!rendered.document.includes(rendered.oldRoot) || !rendered.html.includes('<!--$-->')) {
          throw new Error('Service snapshot is not safe to hydrate');
        }
        html = cleanPrerenderResources('<!DOCTYPE html>' + rendered.document.replace(rendered.oldRoot, `<div id="root">${rendered.html}</div>`), pristineShell);
        serviceSnapshot = rendered.snapshot;
      }

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

      // Restore the non-blocking font-loading trick. index.html ships the
      // Google Fonts stylesheet as `media="print" onload="this.media='all'"`
      // (loads without blocking render). Puppeteer FIRES that onload before we
      // snapshot, so the captured HTML has `media="all"` — i.e. render-blocking
      // again. Reset it so prerendered pages keep the fast path.
      html = html.replace(/media="all"(\s+onload="this\.media='all'")/g, 'media="print"$1');

      // Inline only styles needed by the captured DOM. The full stylesheet
      // loads without blocking first paint and covers later menus/filter states.
      html = html.replace(
        /<link\s+rel="stylesheet"\s+[^>]*href="(\/assets\/index-[^"]+\.css)"[^>]*>/g,
        (tag, href) => {
          try {
            const css = readFileSync(join(DIST, href.replace(/^\//, '')), 'utf8');
            const critical = getSnapshotCSS(css, snapshotClasses);
            return `<style data-snapshot-css>${critical}</style>`
              + `<link rel="stylesheet" crossorigin href="${href}" media="print" onload="this.media='all'">`
              + `<noscript>${tag}</noscript>`;
          } catch {
            return tag; // keep the link if the file can't be read
          }
        }
      );

      // Minimal sanity check — abort if shell is empty (something broke).
      // The root may carry attributes (e.g. data-render-origin="client").
      if (!/<div\b[^>]*\bid="root"[^>]*>/.test(html) || html.length < 5000) {
        throw new Error(`output looks broken (${html.length} bytes)`);
      }

      // Stamp the served route onto <html data-ssg="..."> so the index.html
      // guard can hide this snapshot when it's served as the SPA fallback for a
      // different URL. Strip any stray guard <style> the DOM captured, and any
      // pre-existing data-ssg (e.g. captured from the homepage fallback shell).
      html = html.replace(/<style id="__ssg_guard__">[\s\S]*?<\/style>/g, '');
      html = html.replace(/\sdata-ssg="[^"]*"/gi, '');
      html = html.replace(/<html(\s|>)/i, `<html data-ssg="${route}"$1`);

      if (categoryBootShells[route]) {
        const firstImage = await page.evaluate(() =>
          document.querySelector('.image-container img[loading="eager"]')?.getAttribute('src') ?? null
        );
        if (firstImage?.startsWith('/assets/service-thumbnail-') || firstImage?.includes('/storage/v1/render/image/public/')) {
          html = injectLcpImagePreload(html, firstImage);
        }
        const initialData = await page.evaluate(() => window.__fixupCategorySnapshotCapture ?? null);
        if (initialData?.path === route) {
          html = injectCategoryInitialData(html, initialData);
        }
        html = injectCategoryBootShells(html, categoryHeader, { [route]: categoryBootShells[route] });
      } else if (route !== '/') {
        html = html.replace(/<script id="category-boot-shell">[\s\S]*?<\/script>/g, '');
      }

      if (route.startsWith('/service/')) {
        const firstImage = await page.evaluate(() => document.querySelector('[data-service-page-id] img[loading="eager"]')?.getAttribute('src') ?? null);
        html = prepareServiceSnapshot(html, firstImage, serviceSnapshot);
        assertServiceDocument(html, route);
      }

      const outDir = join(DIST, route.replace(/^\//, ''));
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, 'index.html'), html, 'utf8');
      console.log(`[prerender] ✓ ${route} → dist${route}/index.html (${(html.length / 1024).toFixed(1)} KB)`);
      ok++;
    } catch (e) {
      console.error(`[prerender] ✗ ${route}: ${e.message}`);
      if (runtimeErrors.length) console.error(`[prerender] runtime: ${runtimeErrors.slice(-3).join('; ')}`);
      failedRoutes.push(route);
      fail++;
    } finally {
      await page?.close().catch(() => {});
    }
  };

  // Concurrency pool — process routes in parallel (bounded).
  const requestedConcurrency = Number(process.env.PRERENDER_CONCURRENCY ?? 3);
  const CONCURRENCY = Number.isInteger(requestedConcurrency) && requestedConcurrency > 0
    ? Math.min(requestedConcurrency, 5)
    : 1;
  // Large listing pages are expensive; keep them sequential. Service detail
  // pages use a bounded pool after those captures have finished.
  for (const route of allRoutes.filter(route => !route.startsWith('/service/'))) await renderRoute(route);
  const queue = allRoutes.filter(route => route.startsWith('/service/'));
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const route = queue.shift();
        if (route === undefined) break;
        await renderRoute(route);
      }
    })
  );

  if (failedRoutes.length) {
    const retry = [...failedRoutes];
    await browser.close().catch(() => {});
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
    console.log(`[prerender] retrying ${retry.length} failed routes sequentially`);
    for (const route of retry) { fail--; await renderRoute(route); }
  }

  // Lovable may serve index.html as the fallback for category URLs. Include
  // their small top sections so those URLs paint before the React downloads.
  if (!requestedRoutes || requestedRoutes.includes('/')) {
    const rootHTML = readFileSync(join(DIST, 'index.html'), 'utf8');
    await writeFile(join(DIST, 'index.html'), injectCategoryBootShells(rootHTML, categoryHeader, categoryBootShells));
  }
  console.log(`[prerender] category boot shells: ${Object.keys(categoryBootShells).length}`);

  await browser.close();
  server.close();

  console.log(`[prerender] done — ${ok} succeeded, ${fail} failed.`);
  // A successful bundle with missing route HTML is not a successful publish.
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error('[prerender] unexpected error:', err);
  process.exit(1);
});
