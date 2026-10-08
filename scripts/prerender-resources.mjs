// Keep runtime downloads out of static snapshots. Vite adds lazy route CSS
// again when the corresponding module loads in the visitor's browser.
export function cleanPrerenderResources(html, pristineShell) {
  const shellStyles = new Set(
    [...pristineShell.matchAll(/<link\b[^>]*>/gi)]
      .filter(([tag]) => /\brel="stylesheet"/i.test(tag))
      .map(([tag]) => tag.match(/\bhref="([^"]+)"/i)?.[1])
  );

  return html
    // The deferred analytics loader stays in the HTML. Its runtime script
    // must not be captured: that would load GA immediately and then again.
    .replace(/<script\b[^>]*\bsrc="https:\/\/(?:www\.)?(?:googletagmanager\.com|google-analytics\.com)\/[^" ]*"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, (tag) => {
      if (!/\brel="stylesheet"/i.test(tag)) return tag;
      const href = tag.match(/\bhref="([^"]+)"/i)?.[1];
      return shellStyles.has(href) ? tag : '';
    });
}
