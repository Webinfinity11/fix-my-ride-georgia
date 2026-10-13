import pages from '@/data/fuel-landings.json';
import { fuelTier, type FuelTier } from './fuelTypes';
import type { FuelPrice } from '@/services/fuelPricesApi';

export const fuelLandingPages = pages;
export function fuelLandingPath(tier?: string, selfService = false): string {
  const slug = [selfService ? 'self-service' : '', tier ?? ''].filter(Boolean).join('/');
  return pages.some(page => page.slug === slug) ? `/fuel-prices/${slug}` : selfService ? '/fuel-prices/self-service' : '/fuel-importers';
}
export function matchesFuelLanding(fuel: FuelPrice, page: typeof pages[number]): boolean {
  const tier = fuelTier(`${fuel.fuelType} ${fuel.fuelTypeEnglish ?? ''}`);
  return (!page.tiers.length || page.tiers.includes(tier ?? ''))
    && (!page.selfService || (Number.isFinite(fuel.selfServicePrice) && fuel.selfServicePrice! > 0));
}
export function initialFuelTier(page?: typeof pages[number]): FuelTier | undefined {
  return page?.initialTier as FuelTier | undefined;
}
