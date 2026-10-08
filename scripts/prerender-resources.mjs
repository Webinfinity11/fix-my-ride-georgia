// Keep runtime downloads out of static snapshots. Vite adds lazy route code
// and CSS again when that route loads in the visitor's browser.
export function cleanPrerenderResources(html, pristineShell) {
  const shellResources = new Set(
    [...pristineShell.matchAll(/<link\b[^>]*>/gi)]
      .filter(([tag]) => /\brel="(?:stylesheet|modulepreload)"/i.test(tag))
      .map(([tag]) => tag.match(/\bhref="([^"]+)"/i)?.[1])
  );

  return html
    // The deferred analytics loader stays in the HTML. Its runtime script
    // must not be captured: that would load GA immediately and then again.
    .replace(/<script\b[^>]*\bsrc="https:\/\/(?:www\.)?(?:googletagmanager\.com|google-analytics\.com)\/[^" ]*"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, (tag) => {
      if (!/\brel="(?:stylesheet|modulepreload)"/i.test(tag)) return tag;
      const href = tag.match(/\bhref="([^"]+)"/i)?.[1];
      return shellResources.has(href) ? tag : '';
    });
}
