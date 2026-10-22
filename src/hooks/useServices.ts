import { useCatalogueState, useCatalogueResume } from "@/hooks/useCatalogueState";
import { rotateServiceIds, serviceRotationSeed, sessionServiceIds } from "@/utils/serviceRotation";
import { normalizeModels, type ServiceModel } from '@/utils/serviceModels';
import { getPublicServiceCategories, getPublicServiceCities } from "@/lib/serviceMetadata";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ServiceType = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  vehicle_models?: ServiceModel[];
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  rating: number | null;
  review_count: number | null;
  photos: string[] | null;
  vip_status: 'vip' | 'super_vip' | null;
  vip_until: string | null;
  is_vip_active: boolean;
  created_at?: string;
  category: {
    id: number;
    name: string;
  } | null;
  mechanic: {
    id: string;
    display_id?: number;
    first_name: string;
    last_name: string;
    rating: number | null;
    phone: string | null;
    phone_number: string | null;
  };
};

export type ServiceCategory = {
  id: number;
  name: string;
};

export type ServiceSortOption =
  | "rotation"
  | "newest"
  | "oldest"
  | "price_low"
  | "price_high"
  | "rating"
  | "popular";

export type ServiceFilters = {
  searchTerm: string;
  selectedCategory: number | "all";
  selectedCity: string | null;
  selectedDistrict: string | null;
  selectedBrands: string[];
  selectedModel?: { brand: string; slug: string };
  onSiteOnly: boolean;
  minRating: number | null;
  sortBy?: ServiceSortOption;
};

const PAGE_SIZE = 24;

// Chosen sort → (column, ascending). VIP tier always ranks above these.
const SORT_MAP: Record<ServiceSortOption, [string, boolean]> = {
  rotation: ["id", true],
  newest: ["created_at", false],
  oldest: ["created_at", true],
  price_low: ["price_from", true],
  price_high: ["price_to", false],
  rating: ["rating", false],
  popular: ["review_count", false],
};

export const useServices = (initial?: { services: ServiceType[]; totalCount: number; hasMore: boolean } | null) => {
  const resume = useCatalogueResume();
  const [services, setServices] = useCatalogueState<ServiceType[]>(initial?.services ?? [], "services");
  const [categories, setCategories] = useCatalogueState<ServiceCategory[]>([], "categories");
  const [cities, setCities] = useCatalogueState<string[]>([], "cities");
  const [districts, setDistricts] = useCatalogueState<string[]>([], "districts");
  const [loading, setLoading] = useState(!initial && !resume.current);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useCatalogueState(initial?.totalCount ?? 0, "totalCount");
  const [hasMore, setHasMore] = useCatalogueState(initial?.hasMore ?? false, "hasMore");

  const serviceRequest = useRef(0);
  const [savedFilterSignature, setSavedFilterSignature] = useCatalogueState<string | null>(null, "serviceFilters");

  const fetchInitialData = async () => {
    console.log("🔄 Fetching initial data...");
    try {
      // Filter metadata is independent: neither query waits for the other.
      await Promise.all([
        (async () => {
          const data = await getPublicServiceCategories();
          setCategories(data.map(({ id, name }) => ({ id, name })));
        })(),
        (async () => {
          try {
            setCities(await getPublicServiceCities());
          } catch (error) {
            console.error("Cities error:", error);
          }
        })(),
      ]);

    } catch (error: any) {
      console.error("❌ Error fetching initial data:", error);
      toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
    }
  };

  const fetchDistricts = async (city: string) => {
    console.log("🏘️ Fetching districts for city:", city);
    try {
      const { data, error } = await supabase
        .from("mechanic_services")
        .select("district")
        .eq("city", city)
        .eq("is_active", true)
        .not("district", "is", null);

      if (error) {
        console.error("❌ Districts error:", error);
        return;
      }
      
      const uniqueDistricts = Array.from(
        new Set(data?.map(s => s.district).filter(Boolean) as string[])
      ).sort();
      console.log("✅ Districts fetched:", uniqueDistricts);
      setDistricts(uniqueDistricts);
    } catch (error: any) {
      console.error("❌ Error fetching districts:", error);
    }
  };

  // Rotation reads matching IDs/provider IDs first, then only one page of full cards.
  // Explicit user sorts keep server-side pagination.
  // `page` 0 replaces the list; higher pages append ("load more").
  // `options.all` fetches every matching row in one go (used by the map, which
  // needs all services as pins — not a 24-row page). `withCoordinates` is
  // a separate map-only filter; catalogue pages also need ungeolocated rows.
  const fetchServices = async (
    filters: ServiceFilters,
    page = 0,
    options?: { all?: boolean; withCoordinates?: boolean; background?: boolean },
  ) => {
    const signature = JSON.stringify(filters);
    if (page === 0 && resume.current && savedFilterSignature === signature) { resume.current = false; return; }
    resume.current = false;
    setSavedFilterSignature(signature);
    const request = ++serviceRequest.current;
    if (page === 0) {
      if (!options?.background) setLoading(true);
      setLoadingMore(false);
    } else setLoadingMore(true);

    try {
      const [sortCol, sortAsc] = SORT_MAP[filters.sortBy ?? "rotation"];
      const from = page * PAGE_SIZE;
      const fetchAll = options?.all === true;

      // Build the filtered/paginated query. `useRank` orders by the vip_rank
      // generated column (active super_vip → active vip → everyone else, each by
      // the chosen sort). If that column doesn't exist yet (migration not
      // applied), we fall back to is_vip_active ordering so the page never
      // breaks — see the retry below.
      const build = (useRank: boolean, inventoryOffset?: number, ids?: number[]) => {
        let q = (supabase as any)
          .from("mechanic_services")
          .select(
            inventoryOffset !== undefined ? "id,mechanic_id,is_vip_active,vip_status,vip_until" : `
            id,
            name,
            slug,
            description,
            price_from,
            price_to,
            estimated_hours,
            city,
            district,
            address,
            latitude,
            longitude,
            car_brands,
            vehicle_models,
            on_site_service,
            accepts_card_payment,
            accepts_cash_payment,
            rating,
            review_count,
            photos,
            category_id,
            mechanic_id,
            vip_status,
            vip_until,
            is_vip_active,
            created_at,
            service_categories(id, name),
            mechanic:profiles!fk_mechanic_services_profiles(
              id, first_name, last_name, phone, mechanic_profiles(display_id, rating)
            )
          `,
            { count: "exact" },
          )
          .eq("is_active", true);

        // Map mode: only rows with coordinates (they're the only ones that can
        // become a pin), and never paginate them away.
        if (options?.withCoordinates) {
          q = q.not("latitude", "is", null).not("longitude", "is", null);
        }

        // Structured filters
        if (filters.selectedCategory && filters.selectedCategory !== "all") {
          q = q.eq("category_id", filters.selectedCategory);
        }
        if (filters.selectedCity) q = q.eq("city", filters.selectedCity);
        if (filters.selectedDistrict) q = q.eq("district", filters.selectedDistrict);
        if (filters.onSiteOnly) q = q.eq("on_site_service", true);
        if (filters.minRating) q = q.gte("rating", filters.minRating);

        // Brand filter — server-side overlap for specific brands. The "სხვა"
        // (other = any brand not in the popular list) option can't be expressed
        // as a single PostgREST filter, so when it's the ONLY selection we don't
        // constrain by brand (rare).
        const specificBrands = filters.selectedBrands.filter((b) => b !== "სხვა");
        if (specificBrands.length > 0) q = q.overlaps("car_brands", specificBrands);

        if (filters.selectedModel) q = q.contains("vehicle_models", JSON.stringify([filters.selectedModel]));

        // Text search — service name + description, plus any category whose name
        // matches. Strip characters that would break PostgREST's or() grammar.
        const term = filters.searchTerm?.trim();
        if (term) {
          const safe = term.replace(/[,()]/g, " ").trim();
          const matchingCatIds = categories
            .filter((c) => c.name.toLowerCase().includes(safe.toLowerCase()))
            .map((c) => c.id);
          const ors = [`name.ilike.%${safe}%`, `description.ilike.%${safe}%`];
          if (matchingCatIds.length > 0) ors.push(`category_id.in.(${matchingCatIds.join(",")})`);
          q = q.or(ors.join(","));
        }

        if (inventoryOffset !== undefined) return q.order("id", { ascending: true }).range(inventoryOffset, inventoryOffset + 999);
        if (ids) return q.in("id", ids).order("id", { ascending: true }).range(0, Math.max(ids.length - 1, 0));

        // Ordering
        if (useRank) {
          q = q.order("vip_rank", { ascending: true, nullsFirst: false });
        } else {
          // Fallback (no vip_rank column): active VIP first. This can't cleanly
          // separate super_vip from vip, but never leaks expired VIPs upward.
          q = q.order("is_vip_active", { ascending: false, nullsFirst: false });
        }
        q = q.order(sortCol, { ascending: sortAsc, nullsFirst: false });

        return fetchAll ? q.range(0, 4999) : q.range(from, from + PAGE_SIZE - 1);
      };

      const rotation = (filters.sortBy ?? "rotation") === "rotation" && !fetchAll;
      let rotationIds: number[] | undefined;
      if (rotation) {
        const scope = JSON.stringify({ ...filters, selectedBrands: [...filters.selectedBrands].sort(), sortBy: 'rotation', coordinates: Boolean(options?.withCoordinates) });
        rotationIds = await sessionServiceIds(scope, async () => {
          const inventory = [];
          for (let offset = 0; ; offset += 1000) {
            const { data, error } = await build(false, offset);
            if (error) throw error;
            inventory.push(...(data ?? []));
            if ((data?.length ?? 0) < 1000) break;
          }
          return rotateServiceIds(inventory, serviceRotationSeed());
        });
        if (request !== serviceRequest.current) return;
      }
      const pageIds = rotationIds?.slice(from, from + PAGE_SIZE);
      let { data: servicesData, error: servicesError, count } = pageIds
        ? pageIds.length ? await build(false, undefined, pageIds) : { data: [], error: null, count: 0 }
        : await build(true);
      if (!rotation && servicesError && /vip_rank/i.test(servicesError.message || "")) {
        console.warn("vip_rank column missing — run migration; using fallback order");
        ({ data: servicesData, error: servicesError, count } = await build(false));
      }
      if (request !== serviceRequest.current) return;
      if (servicesError) throw servicesError;

      const rows = (servicesData ?? []) as any[];
      if (pageIds) {
        const positions = new Map(pageIds.map((id, index) => [id, index]));
        rows.sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
        count = rotationIds!.length;
      }

      if (fetchAll && (filters.sortBy ?? "rotation") === "rotation") {
        const ids = await sessionServiceIds(JSON.stringify({ ...filters, selectedBrands: [...filters.selectedBrands].sort(), all: true, coordinates: Boolean(options?.withCoordinates) }), async () => rotateServiceIds(rows, serviceRotationSeed()));
        if (request !== serviceRequest.current) return;
        const positions = new Map(ids.map((id, index) => [id, index]));
        const visible = rows.filter(row => positions.has(row.id));
        rows.splice(0, rows.length, ...visible);
        rows.sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
      }

      // Transform the data
      let transformedServices: ServiceType[] = rows.map((service) => {
        // A left embedded relation preserves services even when a profile is hidden by RLS.
        const mechanic = Array.isArray(service.mechanic)
          ? service.mechanic[0]
          : service.mechanic;
        const mechanicProfile = Array.isArray(mechanic?.mechanic_profiles) 
          ? mechanic.mechanic_profiles[0] 
          : mechanic?.mechanic_profiles;

        const category = Array.isArray(service.service_categories) 
          ? service.service_categories[0] 
          : service.service_categories;

        return {
          id: service.id,
          name: service.name || "უცნობი სერვისი",
          slug: service.slug,
          description: service.description,
          price_from: service.price_from,
          price_to: service.price_to,
          estimated_hours: service.estimated_hours,
          city: service.city,
          district: service.district,
          address: service.address,
          latitude: service.latitude,
          longitude: service.longitude,
          vehicle_models: normalizeModels(service.vehicle_models),
          car_brands: service.car_brands,
          on_site_service: service.on_site_service || false,
          accepts_card_payment: service.accepts_card_payment || false,
          accepts_cash_payment: service.accepts_cash_payment || true,
          rating: service.rating,
          review_count: service.review_count,
          photos: service.photos || [],
          vip_status: (service as any).vip_status || null,
          vip_until: (service as any).vip_until || null,
          is_vip_active: (service as any).is_vip_active || false,
          created_at: service.created_at,
          category: category ? {
            id: category.id,
            name: category.name
          } : null,
          mechanic: {
            id: mechanic?.id || service.mechanic_id || "",
            display_id: mechanicProfile?.display_id || undefined,
            first_name: mechanic?.first_name || "",
            last_name: mechanic?.last_name || "",
            rating: mechanicProfile?.rating || null,
            phone: mechanic?.phone || null,
            phone_number: mechanic?.phone || null,
          }
        };
      });

      // Check for expired VIP on client-side
      transformedServices = transformedServices.map(service => {
        if (service.vip_until && service.is_vip_active) {
          const expirationDate = new Date(service.vip_until);
          const now = new Date();
          
          if (expirationDate < now) {
            // VIP expired - mark as inactive
            return {
              ...service,
              is_vip_active: false,
            };
          }
        }
        
        return service;
      });

      setTotalCount(count ?? 0);
      setHasMore(from + rows.length < (count ?? 0));
      setServices((prev) =>
        page === 0 ? transformedServices : [...prev, ...transformedServices],
      );
    } catch (error: any) {
      if (request !== serviceRequest.current) return;
      console.error("Error fetching services:", error);
      toast.error("სერვისების ჩატვირთვისას შეცდომა დაფიქსირდა");
      if (page === 0 && !options?.background) setServices([]);
    } finally {
      if (request === serviceRequest.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  return {
    services,
    categories,
    cities,
    districts,
    loading,
    loadingMore,
    totalCount,
    hasMore,
    fetchInitialData,
    fetchDistricts,
    fetchServices,
  };
};
