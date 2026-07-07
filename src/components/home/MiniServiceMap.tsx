import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useFuelStations } from "@/hooks/useFuelStations";
import { useChargers } from "@/hooks/useChargers";

/**
 * Mini version of the /map page for the homepage bento tile. Raw Leaflet
 * (react-leaflet v5 needs React 19) + lazy-loaded so it stays out of the initial
 * bundle. Shows real pins for the active layer — mechanics, fuel stations, or
 * EV chargers — and re-renders markers when the layer changes.
 */
export type MapLayer = "mechanic" | "fuel" | "ev";

const COLORS: Record<MapLayer, string> = {
  mechanic: "#1F3D6B", // brand
  fuel: "#F26B2D", // accent
  ev: "#12B76A", // success
};

type Pt = [number, number];

const MiniServiceMap = ({ layer }: { layer: MapLayer }) => {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [services, setServices] = useState<Pt[]>([]);

  const { stations } = useFuelStations();
  const { chargers } = useChargers();

  // Mechanic pins — geolocated services.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("mechanic_services")
        .select("latitude, longitude")
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(200);
      if (alive && data) {
        setServices(
          (data as { latitude: number; longitude: number }[])
            .filter((s) => s.latitude && s.longitude)
            .map((s) => [s.latitude, s.longitude] as Pt),
        );
      }
    })();
    return () => { alive = false; };
  }, []);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !ref.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(ref.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      }).setView([41.72, 44.83], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
      groupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
      setTimeout(() => map.invalidateSize(), 120);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Draw markers for the active layer whenever it (or its data) changes.
  useEffect(() => {
    const L = LRef.current;
    const group = groupRef.current;
    if (!ready || !L || !group) return;
    group.clearLayers();
    const pts: Pt[] =
      layer === "mechanic"
        ? services
        : layer === "fuel"
          ? (stations ?? []).filter((s) => s.latitude && s.longitude).map((s) => [s.latitude, s.longitude] as Pt)
          : (chargers ?? []).filter((c) => c.latitude && c.longitude).map((c) => [c.latitude, c.longitude] as Pt);
    const color = COLORS[layer];
    pts.forEach((p) =>
      L.circleMarker(p, { radius: 4, color: "#ffffff", weight: 1.5, fillColor: color, fillOpacity: 1 }).addTo(group),
    );
  }, [ready, layer, services, stations, chargers]);

  return <div ref={ref} className="absolute inset-0 h-full w-full" style={{ background: "#E8ECF3" }} />;
};

export default MiniServiceMap;
