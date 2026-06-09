import DOMPurify from "dompurify";

/**
 * Sanitize untrusted HTML before rendering via dangerouslySetInnerHTML.
 * Allows common formatting + links/images, blocks <script>, on* handlers,
 * javascript: URLs.
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote", "code", "pre",
      "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
      "a", "img", "figure", "figcaption", "hr", "span", "div", "table", "thead",
      "tbody", "tr", "td", "th",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class", "width", "height"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    ADD_ATTR: ["target"],
  });
};

/** Escape user-supplied text for safe interpolation into HTML template strings. */
export const escapeHtml = (input: unknown): string => {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/** Safe URL for src/href: blocks javascript:, data:, vbscript:; allows http(s), mailto, tel, relative. */
export const safeUrl = (url: unknown): string => {
  if (!url) return "";
  const str = String(url).trim();
  // Block dangerous schemes
  if (/^(javascript|data|vbscript|file):/i.test(str)) return "";
  // Encode quotes that could break out of attribute
  return str.replace(/"/g, "%22").replace(/'/g, "%27");
};
