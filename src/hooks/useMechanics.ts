
import { useState } from "react";
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
  working_hours?: any;
  experience_years?: number;
  description?: string;
  verified_at?: string;
};

export const useMechanics = () => {
  const [mechanics, setMechanics] = useState<MechanicType[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    console.log("🔄 Fetching initial data...");
    try {
      // Fetch unique cities from mechanic profiles
      console.log("🏙️ Fetching cities...");
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("city")
        .eq("role", "mechanic")
        .not("city", "is", null);

      if (profilesError) {
        console.error("❌ Cities error:", profilesError);
        // Don't throw here, just log and continue
      } else {
        const uniqueCities = Array.from(
          new Set(profilesData?.map(p => p.city).filter(Boolean) as string[])
        ).sort();
        console.log("✅ Cities fetched:", uniqueCities);
        setCities(uniqueCities);
      }

    } catch (error: any) {
      console.error("❌ Error fetching initial data:", error);
      toast.error("მონაცემების ჩატვირთვისას შეცდომა დაფიქსირდა");
    }
  };

  const fetchDistricts = async (city: string) => {
    console.log("🏘️ Fetching districts for city:", city);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("district")
        .eq("city", city)
        .eq("role", "mechanic")
        .not("district", "is", null);

      if (error) {
        console.error("❌ Districts error:", error);
        return;
      }
      
      const uniqueDistricts = Array.from(
        new Set(data?.map(p => p.district).filter(Boolean) as string[])
      ).sort();
      console.log("✅ Districts fetched:", uniqueDistricts);
      setDistricts(uniqueDistricts);
    } catch (error: any) {
      console.error("❌ Error fetching districts:", error);
    }
  };

  const fetchMechanics = async (filters: {
    searchTerm: string;
    selectedCity: string | null;
    selectedDistrict: string | null;
    selectedSpecialization: string | null;
    mobileServiceOnly: boolean;
    minRating: number | null;
    verifiedOnly: boolean;
  }) => {
    console.log("🔍 Starting fetchMechanics with filters:", filters);
    setLoading(true);
    
    try {
      console.log("🚀 Attempting main query...");
      let query = supabase
        .from("mechanic_profiles")
        .select(`
          id,
          display_id,
          specialization,
          hourly_rate,
          rating,
          review_count,
          is_mobile,
          working_hours,
          experience_years,
          description,
          verified_at,
          profiles!inner(
            first_name,
            last_name,
            phone,
            city,
            district,
            avatar_url,
            is_verified
          )
        `);

      // Apply filters
      if (filters.selectedCity) {
        console.log("🏙️ Applying city filter:", filters.selectedCity);
        query = query.eq("profiles.city", filters.selectedCity);
      }

      if (filters.selectedDistrict) {
        console.log("🏘️ Applying district filter:", filters.selectedDistrict);
        query = query.eq("profiles.district", filters.selectedDistrict);
      }

      if (filters.mobileServiceOnly) {
        console.log("🚗 Applying mobile service filter");
        query = query.eq("is_mobile", true);
      }

      if (filters.minRating) {
        console.log("⭐ Applying rating filter:", filters.minRating);
        query = query.gte("rating", filters.minRating);
      }

      if (filters.verifiedOnly) {
        console.log("✅ Applying verified filter");
        query = query.not("verified_at", "is", null);
      }

      if (filters.selectedSpecialization) {
        console.log("🔧 Applying specialization filter:", filters.selectedSpecialization);
        query = query.eq("specialization", filters.selectedSpecialization);
      }

      // Order by rating descending (fixed the nullsLast error)
      const { data: mechanicsData, error: mechanicsError } = await query.order("rating", { ascending: false, nullsFirst: false });

      if (mechanicsError) {
        console.error("❌ Main query failed:", mechanicsError);
        throw mechanicsError;
      }

      console.log("✅ Raw mechanics data:", mechanicsData);

      if (!mechanicsData) {
        console.log("⚠️ No mechanics data returned");
        setMechanics([]);
        return;
      }

      // Transform the data
      let transformedMechanics: MechanicType[] = mechanicsData.map(mechanic => ({
        id: mechanic.id,
        display_id: mechanic.display_id,
        profiles: Array.isArray(mechanic.profiles) ? mechanic.profiles[0] : mechanic.profiles,
        specialization: mechanic.specialization,
        hourly_rate: mechanic.hourly_rate,
        rating: mechanic.rating,
        review_count: mechanic.review_count,
        is_mobile: mechanic.is_mobile,
        working_hours: mechanic.working_hours,
        experience_years: mechanic.experience_years,
        description: mechanic.description,
        verified_at: mechanic.verified_at,
      }));

      // Enhanced client-side search filtering
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchLower = filters.searchTerm.toLowerCase().trim();
        console.log("🔍 Applying enhanced client-side search for:", searchLower);
        
        transformedMechanics = transformedMechanics.filter(mechanic => {
          // Search in first name
          const firstNameMatch = mechanic.profiles.first_name?.toLowerCase().includes(searchLower);
          
          // Search in last name
          const lastNameMatch = mechanic.profiles.last_name?.toLowerCase().includes(searchLower);
          
          // Search in specialization
          const specializationMatch = mechanic.specialization?.toLowerCase().includes(searchLower);
          
          // Search in description
          const descriptionMatch = mechanic.description?.toLowerCase().includes(searchLower);
          
          return firstNameMatch || lastNameMatch || specializationMatch || descriptionMatch;
        });
        
        console.log("✅ Enhanced search results:", transformedMechanics.length);
      }

      console.log("✅ Final transformed mechanics:", transformedMechanics);
      setMechanics(transformedMechanics);
      
    } catch (error: any) {
      console.error("❌ Error fetching mechanics:", error);
      toast.error("ხელოსნების ჩატვირთვისას შეცდომა დაფიქსირდა");
      setMechanics([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    mechanics,
    cities,
    districts,
    loading,
    fetchInitialData,
    fetchDistricts,
    fetchMechanics,
  };
};
