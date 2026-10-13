export type FuelTier = 'super' | 'premium' | 'regular' | 'diesel' | 'gas' | 'cng' | 'lpg';
// Product names can contain "premium diesel"; classify by fuel before octane.
export function fuelTier(name: string): FuelTier | null {
  if (/თხევად|lpg/i.test(name)) return 'lpg';
  if (/ბუნებრივ|cng/i.test(name)) return 'cng';
  if (/აირ|გაზ|\bgas\b/i.test(name)) return 'gas';
  if (/დიზელ|diesel/i.test(name)) return 'diesel';
  if (/სუპერ|super/i.test(name)) return 'super';
  if (/პრემიუმ|premium/i.test(name)) return 'premium';
  if (/რეგულარ|regular/i.test(name)) return 'regular';
  return null;
}
