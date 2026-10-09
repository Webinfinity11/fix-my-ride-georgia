/**
 * Hosting renderers may serialize the live DOM after React has run. That is a
 * client snapshot, not renderToString output: effects have already changed its
 * image placeholders, widgets and state. Only untouched server markup can be
 * hydrated. The marker survives HTML serialization; JS properties do not.
 * This applies to every visitor, without user-agent or audit detection.
 */
export function claimRenderOrigin(root: HTMLElement): 'server' | 'client' {
  const origin = root.dataset.renderOrigin === 'client' ? 'client' : 'server';
  root.dataset.renderOrigin = 'client';
  return origin;
}
