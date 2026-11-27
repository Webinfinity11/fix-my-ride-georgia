import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// The growth tables are newer than the generated types.
export const growthDb = supabase as unknown as SupabaseClient;
