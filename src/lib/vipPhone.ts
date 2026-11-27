/** Georgian mobile number without the country code, from whatever was typed or pasted. */
export function nationalDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 9 && digits.startsWith("995")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

/** 555123456 → "555 12 34 56" (also while the number is still being typed). */
export const formatNational = (digits: string) =>
  [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(" ");

export const isMobile = (digits: string) => /^5\d{8}$/.test(digits);
