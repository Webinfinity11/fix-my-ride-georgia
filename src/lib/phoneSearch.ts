/**
 * Nine digits of a Georgian number when the search term is a phone number,
 * however it is typed (+995, leading 0, spaces, dashes); otherwise null.
 * Shorter digit strings stay listing numbers.
 */
export const phoneDigits = (term: string) => {
  if (!/^\+?[\d\s()-]+$/.test(term)) return null;
  let digits = term.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("995")) digits = digits.slice(3);
  if (digits.length === 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 9 ? digits : null;
};

/** Database regex: the same digits with any separators between them. */
export const phonePattern = (digits: string) => digits.split("").join("[^0-9]*");
