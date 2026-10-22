type BrandInventoryRow = {
  category_id: number | null;
  city: string | null;
  car_brands: string[] | null;
};

/** Candidate brands depend on location/category, not on the current OR brand selection. */
export function availableServiceBrands(
  inventory: readonly BrandInventoryRow[],
  category: number | 'all',
  city: string | null,
): Set<string> {
  const brands = new Set<string>();
  for (const service of inventory) {
    if (category !== 'all' && service.category_id !== category) continue;
    if (city && service.city?.trim() !== city.trim()) continue;
    for (const brand of service.car_brands ?? []) brands.add(brand);
  }
  return brands;
}
