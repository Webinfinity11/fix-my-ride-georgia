/** Accepts a listing number or its link (https://fixup.ge/service/123-name). */
export const listingId = (value: string) => {
  const id = Number(value.trim().match(/(?:^[#№]?\s*|\/service\/)(\d+)(?:[-/?#][^\s]*)?$/)?.[1]);
  return id > 0 && id <= 2147483647 ? id : null;
};

/** What the admin typed when looking for a mechanic. */
export function mechanicQuery(value: string): { by: "number"; number: number } | { by: "phone"; digits: string } | { by: "name"; pattern: string } | null {
  const term = value.trim().replace(/\s+/g, " ");
  if (!term) return null;
  if (/^[+\d\s()-]+$/.test(term)) {
    const digits = term.replace(/\D/g, "").replace(/^995(?=\d{9}$)/, "");
    if (digits.length >= 7) return { by: "phone", digits };
    return digits ? { by: "number", number: Number(digits) } : null;
  }
  // Quoted for PostgREST's or() filter, with LIKE wildcards taken literally.
  return { by: "name", pattern: JSON.stringify(`%${term.replace(/[\\%_*]/g, "\\$&")}%`) };
}
