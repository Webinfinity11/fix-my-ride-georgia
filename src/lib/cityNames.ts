// Mechanics type their city and district freely, so one place has many spellings.
const CITY_ALIASES: Record<string, string[]> = {
  "თბილისი": ["tbilisi", "თბილის"],
  "ბათუმი": ["batumi"],
  "ქუთაისი": ["kutaisi"],
  "რუსთავი": ["rustavi"],
};
const DISTRICT_ALIASES: Record<string, string[]> = {
  "ვარკეთილი": ["ვარკ", "varketili"],
  "საბურთალო": ["saburtalo", "saburtall", "sabuetall"],
  "დიდი დიღომი": ["didi digomi", "დიდღომი"],
  "ვაზისუბანი": ["vazisubani"],
  "გლდანი": ["gldani"],
  "ვერა": ["vera"],
};

// toLowerCase also turns capital Georgian letters (Მ) into ordinary ones.
const clean = (raw?: string | null) => (raw ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const GEORGIAN = /^[ა-ჰ][ა-ჰ0-9 ./-]*$/;
const find = (aliases: Record<string, string[]>, value: string, matches: (value: string, alias: string) => boolean) =>
  Object.keys(aliases).find((name) => [name, ...aliases[name]].some((alias) => matches(value, alias)));

// "თბილისის" and "Tbilisi, Georgia" are still Tbilisi.
const startsWith = (value: string, alias: string) => value.startsWith(alias);
const equals = (value: string, alias: string) => value === alias;

/** The one name to show for a typed city; "" when it is not a recognisable place. */
export const cityName = (raw?: string | null) => {
  const value = clean(raw);
  return find(CITY_ALIASES, value, startsWith) ?? (GEORGIAN.test(value) ? value : "");
};
export const districtName = (raw?: string | null) => {
  const value = clean(raw);
  const known = find(DISTRICT_ALIASES, value, equals);
  // A city typed into the district field is not a district.
  return known ?? (GEORGIAN.test(value) && !find(CITY_ALIASES, value, startsWith) ? value : "");
};

// Database patterns match every stored spelling, including capital first letters and stray spaces.
const anyCase = (word: string) => word.replace(/[ა-ჺ]/g, (c) => `[${c}${String.fromCharCode(c.charCodeAt(0) + 0x0bc0)}]`);
const spellings = (aliases: Record<string, string[]>, name: string) => [name, ...(aliases[name] ?? [])].map(anyCase).join("|");
export const cityPattern = (name: string) => `^\\s*(${spellings(CITY_ALIASES, name)})`;
export const districtPattern = (name: string) => `^\\s*(${spellings(DISTRICT_ALIASES, name)})\\s*$`;

/** Unique shown names, the most common first. */
export const mergedNames = (raw: (string | null | undefined)[], name: (value?: string | null) => string) => {
  const counts = new Map<string, number>();
  for (const value of raw) {
    const merged = name(value);
    if (merged) counts.set(merged, (counts.get(merged) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ka")).map(([merged]) => merged);
};
