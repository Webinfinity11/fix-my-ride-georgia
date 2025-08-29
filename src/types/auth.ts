
import { Database } from "@/integrations/supabase/types";

// Re-export the user role type from Supabase database
export type UserRole = Database["public"]["Enums"]["user_role"];

// Define user profile type based on Supabase profiles table
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Define mechanic profile type based on Supabase mechanic_profiles table
export type MechanicProfile = Database["public"]["Tables"]["mechanic_profiles"]["Row"];

// Define a combined user type that includes auth and profile data
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  role: UserRole;
  isVerified: boolean;
  phone?: string | null;
  city?: string | null;
  district?: string | null;
  street?: string | null;
  building?: string | null;
  apartment?: string | null;
  fullAddress?: string | null;
}

// Define auth context state
export interface AuthState {
  user: User | null;
  initialized: boolean;
  loading: boolean;
}
