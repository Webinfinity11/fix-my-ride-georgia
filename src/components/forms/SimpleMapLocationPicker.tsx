
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
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

// Custom hook component for handling map events
const MapClickHandler = ({ 
  onLocationChange, 
  interactive 
}: { 
  onLocationChange: (lat: number, lng: number) => void;
  interactive: boolean;
}) => {
  const map = useMapEvents({
    click: (e) => {
      if (interactive) {
        console.log("🗺️ Map clicked", e.latlng);
        const { lat, lng } = e.latlng;
        onLocationChange(lat, lng);
      }
    }
  });
  
  return null;
};

const SimpleMapLocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  interactive = true 
}: SimpleMapLocationPickerProps) => {
  console.log("🗺️ SimpleMapLocationPicker rendering", { latitude, longitude, interactive });
  
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    console.log("🗺️ Position useEffect triggered", { latitude, longitude });
    if (latitude !== undefined && longitude !== undefined) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Default center: Tbilisi, Georgia
  const defaultCenter: [number, number] = [41.7151, 44.8271];
  const center: [number, number] = position || defaultCenter;

  console.log("🗺️ Rendering map with center:", center, "position:", position);

  const handleLocationChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
  };

  try {
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
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && <Marker position={position} />}
          <MapClickHandler 
            onLocationChange={handleLocationChange} 
            interactive={interactive} 
          />
        </MapContainer>
      </div>
    );
  } catch (error) {
    console.error("🗺️ Error rendering SimpleMapLocationPicker:", error);
    return (
      <div className="h-64 w-full rounded-lg overflow-hidden border border-primary/20 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Map failed to load</p>
      </div>
    );
  }
};

export default SimpleMapLocationPicker;
