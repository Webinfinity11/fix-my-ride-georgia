
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Service {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  custom_category: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  city: string | null;
  district: string | null;
  car_brands: string[] | null;
  on_site_service: boolean;
  accepts_card_payment: boolean;
  accepts_cash_payment: boolean;
  working_days: string[] | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  photos: string[] | null;
  rating: number | null;
  review_count: number | null;
  mechanic: {
    id: string;
    first_name: string;
    last_name: string;
    city: string;
    district: string;
    phone: string | null;
    specialization: string | null;
    rating: number;
  };
  category: {
    id: number;
    name: string;
    description: string | null;
  } | null;
}

interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
}

interface ServiceFilters {
  searchTerm: string;
  selectedCategory: number | "all";
  selectedCity: string | null;
  selectedDistrict: string | null;
  selectedBrands: string[];
  onSiteOnly: boolean;
  minRating: number | null;
}

interface UseServicesReturn {
  services: Service[];
  categories: ServiceCategory[];
  cities: string[];
  districts: string[];
  loading: boolean;
  fetchInitialData: () => Promise<void>;
  fetchServices: (filters: ServiceFilters) => Promise<void>;
  fetchDistricts: (city: string) => Promise<void>;
}

export const useServices = (): UseServicesReturn => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch unique cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('mechanic_services')
        .select('city')
        .not('city', 'is', null)
        .eq('is_active', true);

      if (citiesError) throw citiesError;
      
      const uniqueCities = [...new Set(citiesData?.map(item => item.city).filter(Boolean))] as string[];
      setCities(uniqueCities.sort());

    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchServices = useCallback(async (filters: ServiceFilters) => {
    setLoading(true);
    try {
      let query = supabase
        .from('mechanic_services')
        .select(`
          *,
          profiles!mechanic_services_mechanic_id_fkey(id, first_name, last_name, city, district, phone),
          mechanic_profiles!mechanic_services_mechanic_id_fkey(specialization, rating),
          service_categories!mechanic_services_category_id_fkey(id, name, description)
        `)
        .eq('is_active', true);

      // Enhanced search - includes category names and custom categories
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchTerm = filters.searchTerm.trim();
        query = query.or(`
          name.ilike.%${searchTerm}%,
          description.ilike.%${searchTerm}%,
          custom_category.ilike.%${searchTerm}%
        `);
      }

      // Category filter
      if (filters.selectedCategory !== "all" && filters.selectedCategory) {
        query = query.eq('category_id', filters.selectedCategory);
      }

      // City filter
      if (filters.selectedCity) {
        query = query.eq('city', filters.selectedCity);
      }

      // District filter
      if (filters.selectedDistrict) {
        query = query.eq('district', filters.selectedDistrict);
      }

      // Car brands filter
      if (filters.selectedBrands.length > 0) {
        query = query.overlaps('car_brands', filters.selectedBrands);
      }

      // On-site service filter
      if (filters.onSiteOnly) {
        query = query.eq('on_site_service', true);
      }

      // Rating filter
      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match Service interface
      const transformedServices: Service[] = (data || []).map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category_id: service.category_id,
        custom_category: service.custom_category,
        price_from: service.price_from,
        price_to: service.price_to,
        estimated_hours: service.estimated_hours,
        city: service.city,
        district: service.district,
        car_brands: service.car_brands,
        on_site_service: service.on_site_service,
        accepts_card_payment: service.accepts_card_payment,
        accepts_cash_payment: service.accepts_cash_payment,
        working_days: service.working_days,
        working_hours_start: service.working_hours_start,
        working_hours_end: service.working_hours_end,
        photos: service.photos,
        rating: service.rating,
        review_count: service.review_count,
        mechanic: {
          id: service.profiles?.id || '',
          first_name: service.profiles?.first_name || '',
          last_name: service.profiles?.last_name || '',
          city: service.profiles?.city || '',
          district: service.profiles?.district || '',
          phone: service.profiles?.phone || null,
          specialization: service.mechanic_profiles?.specialization || null,
          rating: service.mechanic_profiles?.rating || 0
        },
        category: service.service_categories
      }));

      setServices(transformedServices);

    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDistricts = useCallback(async (city: string) => {
    try {
      const { data, error } = await supabase
        .from('mechanic_services')
        .select('district')
        .eq('city', city)
        .not('district', 'is', null)
        .eq('is_active', true);

      if (error) throw error;

      const uniqueDistricts = [...new Set(data?.map(item => item.district).filter(Boolean))] as string[];
      setDistricts(uniqueDistricts.sort());

    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    }
  }, []);

  return {
    services,
    categories,
    cities,
    districts,
    loading,
    fetchInitialData,
    fetchServices,
    fetchDistricts
  };
};
