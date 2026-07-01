import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Guest-friendly saved services: stored in localStorage (no account needed).
// All SaveServiceButton instances + the header counter stay in sync via a
// custom window event.
const STORAGE_KEY = 'fixup_saved_services';
const CHANGE_EVENT = 'saved-services-changed';

const readIds = (): number[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
};

const writeIds = (ids: number[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* storage may be unavailable (private mode) — fail silently */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const useSavedServices = () => {
  const [savedServiceIds, setSavedServiceIds] = useState<Set<number>>(() => new Set(readIds()));

  useEffect(() => {
    const sync = () => setSavedServiceIds(new Set(readIds()));
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync); // cross-tab
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isSaved = (serviceId: number) => savedServiceIds.has(serviceId);

  const toggleSave = async (serviceId: number) => {
    const ids = readIds();
    let next: number[];
    if (ids.includes(serviceId)) {
      next = ids.filter((x) => x !== serviceId);
      toast.success('სერვისი წაიშალა შენახულებიდან');
    } else {
      next = [...ids, serviceId];
      toast.success('სერვისი შენახულია');
    }
    writeIds(next);
    setSavedServiceIds(new Set(next));
    return true;
  };

  return {
    isSaved,
    toggleSave,
    loading: false,
    savedServiceIds,
    count: savedServiceIds.size,
    refetch: () => setSavedServiceIds(new Set(readIds())),
  };
};
