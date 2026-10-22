import cities from '@/data/cities.json';
import policy from '@/data/location-indexing.json';
export const CITIES = cities;
export const getCityBySlug = (slug?: string) => CITIES.find(city => city.slug === slug);
export const getCityByName = (name?: string | null) => CITIES.find(city => city.name === name);
export const locationPath = (citySlug: string, categorySlug?: string) => categorySlug ? `/category/${categorySlug}/city/${citySlug}` : `/city/${citySlug}`;
// Editorial quality gate, not a search engine's minimum listing requirement.
export const locationIndexable = (count: number, providers: number) => count >= policy.minimumServices && providers >= policy.minimumProviders;
