import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useCallback } from "react";

type BannerStats = {
  banner_id: string;
  impressions: number;
  clicks: number;
};

// Fetch banner stats for admin
export const useBannerStats = () => {
  return useQuery({
    queryKey: ["banner-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_banner_stats");
      if (error) throw error;
      return (data || []) as BannerStats[];
    },
  });
};

// Track banner events
export const useBannerTracking = (bannerId: string | undefined) => {
  const tracked = useRef(false);

  const trackEvent = useCallback(async (eventType: 'impression' | 'click') => {
    if (!bannerId) return;
    await supabase.from("banner_analytics").insert({
      banner_id: bannerId,
      event_type: eventType,
    });
  }, [bannerId]);

  const trackImpression = useCallback(() => {
    if (tracked.current || !bannerId) return;
    tracked.current = true;
    trackEvent('impression');
  }, [bannerId, trackEvent]);

  const trackClick = useCallback(() => {
    trackEvent('click');
  }, [trackEvent]);

  return { trackImpression, trackClick };
};
