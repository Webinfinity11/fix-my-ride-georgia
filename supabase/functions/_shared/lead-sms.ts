// Texts of the lead-sms function (no Deno APIs, so Node tests can load it).

/** Two SMS parts of Georgian text. */
export const MAX_LENGTH = 134;

/** A driver's request as the mechanic receives it; the problem is shortened to fit. */
export function requestMessage(problem: string, car: string | null, phone: string): string {
  const head = 'Fixup.ge - ახალი შეკვეთა:\n';
  const tail = `\nდარეკეთ: ${phone}`;
  const text = [car, problem].filter(Boolean).join(', ').replace(/\s+/g, ' ').trim();
  const room = MAX_LENGTH - head.length - tail.length;
  return head + (text.length > room ? `${text.slice(0, room - 1).trimEnd()}…` : text) + tail;
}

/** endsOn is YYYY-MM-DD. */
export function expiryMessage(endsOn: string, views: number, calls: number): string {
  const [, month, day] = endsOn.split('-');
  return `VIP იწურება ${day}.${month}: ნახვა ${views}, დარეკა ${calls}.\nhttps://fixup.ge/vip`;
}
