// Canonical Georgian-to-Latin slug utility for edge functions.
// MUST stay in sync with src/utils/slugUtils.ts on the frontend.
// If you change a mapping here, mirror it there (and vice-versa) or
// sitemap URLs will diverge from rendered canonical URLs → 404 risk.

export const georgianToLatin: Record<string, string> = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't',
  'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh',
  'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'q',
  'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
};

export function createSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split('')
    .map(c => georgianToLatin[c] || c)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
