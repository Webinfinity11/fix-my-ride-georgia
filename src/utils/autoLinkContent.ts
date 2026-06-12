/**
 * Auto-link occurrences of known terms (service categories, etc.) inside blog
 * HTML so editorial content cross-links to commercial pages without manual work.
 *
 * Strategy:
 *   - Parse the HTML in a sandbox DOMParser context (no execution).
 *   - Walk text nodes, skipping anchors / code / headings / pre.
 *   - For each term, link the FIRST occurrence per post (avoid spam).
 *   - Word-boundary check on either side so "მანქანის" doesn't match "მანქანა".
 *   - Sort terms by length desc so longer phrases win over their substrings.
 *
 * Sanitization happens AFTER this step — `sanitizeHtml` keeps `<a href class>`.
 */
export type LinkableTerm = { term: string; href: string };

const SKIP_TAGS = new Set([
  'A', 'CODE', 'PRE', 'SCRIPT', 'STYLE',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
]);

const LINK_CLASS = 'text-primary hover:underline font-medium';

// Unicode-aware "word character" check — covers Georgian, Latin, digits.
const isWordChar = (ch: string): boolean => /[\p{L}\p{N}_]/u.test(ch);

export function autoLinkContent(html: string, terms: LinkableTerm[]): string {
  if (!html || !terms || terms.length === 0) return html;
  if (typeof DOMParser === 'undefined') return html; // SSR safety net

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLDivElement | null;
  if (!root) return html;

  // Longest term first — "ძრავის რემონტი" beats "ძრავი".
  // Deduplicate by href so we don't link two synonyms to the same page.
  const seenHrefs = new Set<string>();
  const sorted = [...terms]
    .filter((t) => t.term.trim().length > 2)
    .sort((a, b) => b.term.length - a.term.length)
    .filter((t) => {
      if (seenHrefs.has(t.href)) return false;
      seenHrefs.add(t.href);
      return true;
    });

  // One link per href per post — keep crawl signal clean.
  const linkedHrefs = new Set<string>();

  function walk(node: Node) {
    if (node.nodeType === 3 /* TEXT_NODE */) {
      const text = (node.textContent || '');
      if (!text.trim()) return;
      for (const { term, href } of sorted) {
        if (linkedHrefs.has(href)) continue;
        const lower = text.toLowerCase();
        const idx = lower.indexOf(term.toLowerCase());
        if (idx === -1) continue;
        const before = idx > 0 ? text[idx - 1] : ' ';
        const after = text[idx + term.length] || ' ';
        if (isWordChar(before) || isWordChar(after)) continue;
        // Split and inject
        const matched = text.substring(idx, idx + term.length);
        const beforePart = text.substring(0, idx);
        const afterPart = text.substring(idx + term.length);
        const parent = node.parentNode;
        if (!parent) continue;
        if (beforePart) parent.insertBefore(doc.createTextNode(beforePart), node);
        const a = doc.createElement('a');
        a.setAttribute('href', href);
        a.setAttribute('class', LINK_CLASS);
        a.textContent = matched;
        parent.insertBefore(a, node);
        if (afterPart) parent.insertBefore(doc.createTextNode(afterPart), node);
        parent.removeChild(node);
        linkedHrefs.add(href);
        return;
      }
    } else if (node.nodeType === 1 /* ELEMENT_NODE */) {
      const tag = (node as Element).tagName;
      if (SKIP_TAGS.has(tag)) return;
      const children = Array.from(node.childNodes);
      for (const child of children) walk(child);
    }
  }

  walk(root);
  return root.innerHTML;
}
