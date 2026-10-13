import suggestedModels from '@/data/car-models.json';
export type ServiceModel = { brand: string; model: string; slug: string };
export const modelSlug = (model: string) => model.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
export function normalizeModels(value: unknown): ServiceModel[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, ServiceModel>();
  for (const row of value) {
    if (!row || typeof row.brand !== 'string' || typeof row.model !== 'string') continue;
    const brand = row.brand.trim();
    const model = row.model.trim().replace(/\s+/g, ' ');
    const slug = modelSlug(model);
    if (brand && model && model.length <= 80 && slug && slug.length <= 64) unique.set(`${brand}:${slug}`, { brand, model, slug });
  }
  return [...unique.values()];
}
export const modelsForBrand = (brand: string) => suggestedModels.filter(m => m.brand === brand);
export function candidateModels(name: string, description: string, brands: string[]): ServiceModel[] {
  const text = `${name} ${description}`.toLowerCase();
  return suggestedModels.filter(m => brands.includes(m.brand) && m.aliases.some(alias => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'u').test(text);
  })).map(m => ({ brand: m.brand, model: m.model, slug: modelSlug(m.model) }));
}
export const modelPath = (brandSlug: string, slug: string, categorySlug?: string, districtSlug?: string) =>
  `/brand/${brandSlug}/model/${slug}${categorySlug ? `/service/${categorySlug}` : ''}${districtSlug ? `/district/${districtSlug}` : ''}`;
