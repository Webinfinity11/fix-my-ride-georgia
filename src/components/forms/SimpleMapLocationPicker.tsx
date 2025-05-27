
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface SimpleMapLocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  interactive?: boolean;
}

const SimpleMapLocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  interactive = true 
}: SimpleMapLocationPickerProps) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Default center: Tbilisi, Georgia
  const defaultCenter: [number, number] = [41.7151, 44.8271];
  const center: [number, number] = position || defaultCenter;

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
    
    if (interactive) {
      // Add click handler
      const handleMapClick = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationChange(lat, lng);
      };

      map.on('click', handleMapClick);

      // Cleanup function
      return () => {
        map.off('click', handleMapClick);
      };
    }
  };

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-primary/20">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        ref={(map) => {
          if (map) {
            handleMapReady(map);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  );
};

export default SimpleMapLocationPicker;
