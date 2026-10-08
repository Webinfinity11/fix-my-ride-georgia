import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

// Keep every rule that can affect the captured DOM, including hover/focus and
// responsive variants. Full CSS still loads asynchronously for later UI states.
export function getSnapshotCSS(css, classNames) {
  const present = new Set(classNames);
  const root = postcss.parse(css);
  root.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    // Functional selector logic is deliberately conservative: absence inside
    // :not(), :is(), :where() or :has() does not imply a rule cannot match.
    if (/:(?:not|is|where|has)\(/.test(rule.selector)) return;
    try {
      const selectors = selectorParser().astSync(rule.selector);
      const needed = selectors.nodes.some(selector => {
        let matches = true;
        selector.walkClasses(node => { if (!present.has(node.value)) matches = false; });
        return matches;
      });
      if (!needed) rule.remove();
    } catch {
      // Unknown syntax stays intact rather than risking an unstyled snapshot.
    }
  });
  root.walkAtRules(rule => { if (rule.nodes?.length === 0) rule.remove(); });
  return root.toString();
}
