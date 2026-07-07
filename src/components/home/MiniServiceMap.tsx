import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

/**
 * Small real map for the homepage bento tile — a preview of geolocated services.
 * Uses raw Leaflet (dynamic import) like the /map page; react-leaflet v5 needs
 * React 19, which this project isn't on. Lazy-loaded so Leaflet stays out of the
 * initial homepage bundle. The full multi-layer map lives at /map.
 */
const MiniServiceMap = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      }).setView([41.72, 44.83], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

      const { data } = await supabase
        .from("mechanic_services")
        .select("latitude, longitude")
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(80);
      if (cancelled || !map) return;
      (data as { latitude: number; longitude: number }[] | null ?? []).forEach((s) => {
        if (s.latitude && s.longitude) {
          L.circleMarker([s.latitude, s.longitude], {
            radius: 4,
            color: "#ffffff",
            weight: 1.5,
            fillColor: "#1F3D6B",
            fillOpacity: 1,
          }).addTo(map);
        }
      });
      setTimeout(() => map && map.invalidateSize(), 120);
    })();
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, []);

  return <div ref={ref} className="absolute inset-0 h-full w-full" style={{ background: "#E8ECF3" }} />;
};

export default MiniServiceMap;
