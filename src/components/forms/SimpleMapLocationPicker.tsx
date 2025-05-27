
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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

// Component to handle map events
const MapEventHandler = ({ 
  onLocationChange, 
  interactive 
}: { 
  onLocationChange: (lat: number, lng: number) => void; 
  interactive: boolean; 
}) => {
  const map = useMap();

  useEffect(() => {
    if (interactive && map) {
      const handleClick = (e: L.LeafletMouseEvent) => {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      };

      map.on('click', handleClick);

      return () => {
        map.off('click', handleClick);
      };
    }
  }, [map, onLocationChange, interactive]);

  return null;
};

const SimpleMapLocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  interactive = true 
}: SimpleMapLocationPickerProps) => {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Default center: Tbilisi, Georgia
  const defaultCenter: [number, number] = [41.7151, 44.8271];
  const center: [number, number] = position || defaultCenter;

  const handleLocationChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
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
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventHandler 
          onLocationChange={handleLocationChange} 
          interactive={interactive} 
        />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  );
};

export default SimpleMapLocationPicker;
