import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dueReview, markAsked } from "@/lib/reviewPrompt";

const ReviewPrompt = () => {
  const { pathname } = useLocation();
  const [serviceId, setServiceId] = useState(() => dueReview());
  const service = useQuery({
    queryKey: ["review-prompt", serviceId],
    enabled: serviceId !== null,
    queryFn: async () => {
      const { data, error } = await supabase.from("mechanic_services").select("name").eq("id", serviceId!).eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (serviceId === null || !service.data || pathname.startsWith("/dashboard")) return null;
  const done = () => { markAsked(serviceId); setServiceId(null); };

  return (
    <aside aria-label="შეფასების თხოვნა" className="fixed inset-x-3 bottom-20 z-[100000] mx-auto max-w-sm rounded-2xl border bg-card p-4 shadow-xl md:bottom-6 md:left-6 md:right-auto md:mx-0">
      <button type="button" aria-label="დახურვა" onClick={done} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
      <p className="pr-8 text-sm font-semibold">როგორ იყო „{service.data.name}“?</p>
      <Link to={`/service/${serviceId}?review=1`} onClick={done} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
        <Star className="h-4 w-4" />შეაფასე
      </Link>
    </aside>
  );
};

export default ReviewPrompt;
