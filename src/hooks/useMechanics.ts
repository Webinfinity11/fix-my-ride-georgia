import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MechanicType = {
  id: string;
  display_id?: number;
  profiles: {
    first_name: string;
    last_name: string;
    city?: string;
    district?: string;
    avatar_url?: string;
    phone?: string;
    is_verified?: boolean;
  };
  specialization?: string;
  hourly_rate?: number;
  rating?: number;
  review_count?: number;
  is_mobile?: boolean;
  working_hours?: unknown;
  experience_years?: number;
  description?: string;
  verified_at?: string;
};

type RawProfile = {
  first_name: string;
  last_name: string;
  phone?: string;
  city?: string;
  district?: string;
  avatar_url?: string;
  is_verified?: boolean;
};
type RawMechanicRow = {
  id: string;
  display_id?: number;
  specialization?: string;
  hourly_rate?: number;
  rating?: number;
  review_count?: number;
  is_mobile?: boolean;
  working_hours?: unknown;
  experience_years?: number;
  description?: string;
  verified_at?: string;
  profiles: RawProfile | RawProfile[];
};

type MechanicFilters = {
  searchTerm: string;
  selectedCity: string | null;
  selectedDistrict: string | null;
  selectedSpecialization: string | null;
  mobileServiceOnly: boolean;
  minRating: number | null;
  verifiedOnly: boolean;
};

const PAGE_SIZE = 12;

const SELECT = `
  id, display_id, specialization, hourly_rate, rating, review_count,
  is_mobile, working_hours, experience_years, description, verified_at,
  profiles!inner(first_name, last_name, phone, city, district, avatar_url, is_verified)
`;

const transformRow = (m: RawMechanicRow): MechanicType => ({
  id: m.id,
  display_id: m.display_id,
  profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  specialization: m.specialization,
  hourly_rate: m.hourly_rate,
  rating: m.rating,
  review_count: m.review_count,
  is_mobile: m.is_mobile,
  working_hours: m.working_hours,
  experience_years: m.experience_years,
  description: m.description,
  verified_at: m.verified_at,
});

export const useMechanics = () => {
  const [mechanics, setMechanics] = useState<MechanicType[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Guard against stale responses overwriting fresh ones when filters change fast.
  const reqIdRef = useRef(0);
  // Full client-side search result set (search spans name + specialization +
  // description, which can't be paginated server-side across the joined table).
  const searchAllRef = useRef<MechanicType[]>([]);

  const fetchInitialData = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("city")
        .eq("role", "mechanic")
        .not("city", "is", null);
      if (error) throw error;
      setCities(Array.from(new Set(data?.map((p) => p.city).filter(Boolean) as string[])).sort());
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchDistricts = async (city: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("district")
        .eq("city", city)
        .eq("role", "mechanic")
        .not("district", "is", null);
      if (error) throw error;
      setDistricts(Array.from(new Set(data?.map((p) => p.district).filter(Boolean) as string[])).sort());
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (q: any, filters: MechanicFilters) => {
    if (filters.selectedCity) q = q.eq("profiles.city", filters.selectedCity);
    if (filters.selectedDistrict) q = q.eq("profiles.district", filters.selectedDistrict);
    if (filters.mobileServiceOnly) q = q.eq("is_mobile", true);
    if (filters.minRating) q = q.gte("rating", filters.minRating);
    if (filters.verifiedOnly) q = q.not("verified_at", "is", null);
    if (filters.selectedSpecialization) q = q.eq("specialization", filters.selectedSpecialization);
    return q;
  };

  /**
   * Paginated fetch. page 0 resets the list; page > 0 appends the next chunk.
   *  - No search term → server-side pagination via .range() (+ exact count).
   *  - Search term → fetch the matching set once (page 0), client-side search
   *    across name/specialization/description, then reveal 12 at a time.
   */
  const fetchMechanics = async (filters: MechanicFilters, page = 0) => {
    const myReq = ++reqIdRef.current;
    const isFirst = page === 0;
    if (isFirst) setLoading(true); else setLoadingMore(true);
    const searching = !!filters.searchTerm?.trim();

    try {
      if (searching) {
        // Client-side search: fetch the full filtered set only on page 0.
        if (isFirst) {
          const { data, error } = await applyFilters(
            supabase.from("mechanic_profiles").select(SELECT),
            filters
          )
            .order("rating", { ascending: false, nullsFirst: false })
            .limit(500);
          if (error) throw error;
          if (myReq !== reqIdRef.current) return; // stale

          const term = filters.searchTerm.toLowerCase().trim();
          searchAllRef.current = (data || []).map(transformRow).filter((m) => {
            return (
              m.profiles.first_name?.toLowerCase().includes(term) ||
              m.profiles.last_name?.toLowerCase().includes(term) ||
              m.specialization?.toLowerCase().includes(term) ||
              m.description?.toLowerCase().includes(term)
            );
          });
        }
        if (myReq !== reqIdRef.current) return;
        const shown = (page + 1) * PAGE_SIZE;
        setMechanics(searchAllRef.current.slice(0, shown));
        setHasMore(searchAllRef.current.length > shown);
      } else {
        // Server-side pagination.
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error, count } = await applyFilters(
          supabase.from("mechanic_profiles").select(SELECT, { count: "exact" }),
          filters
        )
          .order("rating", { ascending: false, nullsFirst: false })
          .range(from, to);
        if (error) throw error;
        if (myReq !== reqIdRef.current) return; // stale

        const rows = (data || []).map(transformRow);
        setMechanics((prev) => {
          if (isFirst) return rows;
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...rows.filter((m) => !seen.has(m.id))];
        });
        setHasMore(from + rows.length < (count ?? 0));
      }
    } catch (error) {
      console.error("Error fetching mechanics:", error);
      if (isFirst) {
        toast.error("ხელოსნების ჩატვირთვისას შეცდომა დაფიქსირდა");
        setMechanics([]);
        setHasMore(false);
      }
    } finally {
      if (myReq === reqIdRef.current) {
        if (isFirst) setLoading(false); else setLoadingMore(false);
      }
    }
  };

  return {
    mechanics,
    cities,
    districts,
    loading,
    loadingMore,
    hasMore,
    fetchInitialData,
    fetchDistricts,
    fetchMechanics,
  };
};
