import { useEffect, useState, useRef, type Dispatch, type SetStateAction } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Scoped to a history entry: separate filters/pagination for separate visits.
const entries = new Map<string, Map<string, unknown>>();
export function useCatalogueState<T>(initial: T | (() => T), name: string): [T, Dispatch<SetStateAction<T>>] {
  const location = useLocation();
  const navigation = useNavigationType();
  const [value, setValue] = useState<T>(() => {
    const saved = entries.get(location.key);
    return navigation === 'POP' && saved?.has(name) ? saved.get(name) as T : typeof initial === 'function' ? (initial as () => T)() : initial;
  });
  useEffect(() => {
    const entry = entries.get(location.key) ?? new Map<string, unknown>();
    entry.set(name, value);
    entries.set(location.key, entry);
    if (entries.size > 30) entries.delete(entries.keys().next().value!);
  }, [location.key, name, value]);
  return [value, setValue];
}
export function useCatalogueResume(name = "services") {
  const location = useLocation();
  const navigation = useNavigationType();
  return useRef(navigation === 'POP' && entries.get(location.key)?.has(name) === true);
}
