// Generated studio photography for the service category catalogue.
// Keep the mapping explicit so new categories receive a safe fallback.
const categoryImageIds = new Set([11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,49,50,51,52,53,54,55]);

export function getCategoryImage(id: number): string {
  return categoryImageIds.has(id) ? `/images/categories/category-${id}.webp` : '/placeholder.svg';
}
