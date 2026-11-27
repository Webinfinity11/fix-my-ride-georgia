// After a call we ask for a review on a later visit, once per listing.
const KEY = "fixup-review-prompt";
const WAIT = 3 * 3600e3;
const EXPIRES = 14 * 864e5;
type Pending = { id: number; at: number };
type Store = { pending: Pending[]; asked: number[] };

const read = (): Store => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return { pending: stored?.pending ?? [], asked: stored?.asked ?? [] };
  } catch {
    return { pending: [], asked: [] };
  }
};
const write = (store: Store) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ pending: store.pending.slice(-10), asked: store.asked.slice(-100) }));
  } catch {
    /* private browsing: simply no prompt */
  }
};

export const rememberCall = (serviceId: number, now = Date.now()) => {
  const store = read();
  if (store.asked.includes(serviceId) || store.pending.some((item) => item.id === serviceId)) return;
  write({ ...store, pending: [...store.pending, { id: serviceId, at: now }] });
};

/** The listing to ask about now, if any. */
export const dueReview = (now = Date.now()) =>
  read().pending.find((item) => now - item.at >= WAIT && now - item.at <= EXPIRES)?.id ?? null;

export const markAsked = (serviceId: number) => {
  const store = read();
  write({ pending: store.pending.filter((item) => item.id !== serviceId), asked: [...store.asked, serviceId] });
};
