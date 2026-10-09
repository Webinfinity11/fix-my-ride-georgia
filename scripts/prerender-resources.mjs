// Keep runtime downloads out of static snapshots. Vite adds lazy route code
// and CSS again when that route loads in the visitor's browser.
export function cleanPrerenderResources(html, pristineShell) {
  const shellResources = new Set(
    [...pristineShell.matchAll(/<link\b[^>]*>/gi)]
      .filter(([tag]) => /\brel="(?:stylesheet|modulepreload)"/i.test(tag))
      .map(([tag]) => tag.match(/\bhref="([^"]+)"/i)?.[1])
  );

  return html
    // Sonner reinjects its toast CSS when its runtime module executes. There
    // are no initial toasts to style; carrying 14KB ahead of the body delays it.
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, tag => tag.includes('[data-sonner-toaster]') ? '' : tag)
    // The deferred analytics loader stays in the HTML. Its runtime script
    // must not be captured: that would load GA immediately and then again.
    .replace(/<script\b[^>]*\bsrc="https:\/\/(?:www\.)?(?:googletagmanager\.com|google-analytics\.com)\/[^" ]*"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, (tag) => {
      if (!/\brel="(?:stylesheet|modulepreload)"/i.test(tag)) return tag;
      const href = tag.match(/\bhref="([^"]+)"/i)?.[1];
      return shellResources.has(href) ? tag : '';
    });
}

export function injectLcpImagePreload(html, url) {
  html = html.replace(/<link\b[^>]*data-category-lcp[^>]*>/gi, '');
  if (!url) return html;
  const escaped = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const hint = `<link data-category-lcp rel="preload" as="image" href="${escaped}" fetchpriority="high">`;
  // Helmet may move viewport to the end of <head>. Discover the image before
  // large inline styles and module preloads, immediately after the encoding.
  const anchor = /(<meta\b[^>]*charset[^>]*>)/i.test(html)
    ? /(<meta\b[^>]*charset[^>]*>)/i : /(<meta\b[^>]*name="viewport"[^>]*>)/i;
  return html.replace(anchor, '$1' + hint);
}

// The bootstrap records render origin on the root. Attributes do not make a
// captured page invalid; require the root element rather than an exact tag.
export function assertPageDocument(html) {
  if (!/<div\b[^>]*\sid=["']root["'][^>]*>/i.test(html) || html.length < 5000) {
    throw new Error(`output looks broken (${html.length} bytes)`);
  }
}
