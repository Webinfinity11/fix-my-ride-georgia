import { supabase } from "@/integrations/supabase/client";

const ua = () => (typeof navigator !== "undefined" ? navigator.userAgent : null);

// Records a phone-call / number-reveal click for a SERVICE. Non-blocking.
export const trackServicePhone = async (serviceId: number) => {
  if (!serviceId) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("service_phone_views").insert({
      service_id: serviceId,
      viewer_id: user?.id || null,
      user_agent: ua(),
    });
  } catch {
    /* tracking must never break the UX */
  }
};

// Records a search query a user typed in a search field. Non-blocking.
export const trackSearch = async (query: string, source?: string) => {
  const q = query?.trim();
  if (!q || q.length < 2) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("search_logs").insert({
      query: q.toLowerCase(),
      source: source || null,
      viewer_id: user?.id || null,
    });
  } catch {
    /* tracking must never break the UX */
  }
};

// Records a phone-call / number-reveal click for a MECHANIC. Non-blocking.
export const trackMechanicPhone = async (mechanicId: string) => {
  if (!mechanicId) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === mechanicId) return; // don't count a mechanic calling themselves
    await supabase.from("mechanic_phone_views").insert({
      mechanic_id: mechanicId,
      viewer_id: user?.id || null,
      user_agent: ua(),
    });
  } catch {
    /* tracking must never break the UX */
  }
};
