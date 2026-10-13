export type FuelTier = 'super' | 'premium' | 'regular' | 'diesel' | 'gas';
// Product names can contain "premium diesel"; classify by fuel before octane.
export function fuelTier(name: string): FuelTier | null {
  if (/აირ|გაზ|\bgas\b|lpg|cng/i.test(name)) return 'gas';
  if (/დიზელ|diesel/i.test(name)) return 'diesel';
  if (/სუპერ|super/i.test(name)) return 'super';
  if (/პრემიუმ|premium/i.test(name)) return 'premium';
  if (/რეგულარ|regular/i.test(name)) return 'regular';
  return null;
}
