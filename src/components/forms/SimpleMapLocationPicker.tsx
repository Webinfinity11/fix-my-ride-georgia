
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { LatLng } from "leaflet";
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

// Component to handle map clicks
function LocationMarker({ position, onLocationChange }: { 
  position: LatLng | null; 
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const SimpleMapLocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  interactive = true 
}: SimpleMapLocationPickerProps) => {
  const [position, setPosition] = useState<LatLng | null>(null);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setPosition(new LatLng(latitude, longitude));
    }
  }, [latitude, longitude]);

  const handleLocationChange = (lat: number, lng: number) => {
    const newPosition = new LatLng(lat, lng);
    setPosition(newPosition);
    onLocationChange(lat, lng);
  };

  // Default center: Tbilisi, Georgia
  const defaultCenter: [number, number] = [41.7151, 44.8271];
  const center: [number, number] = position ? [position.lat, position.lng] : defaultCenter;

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
        {interactive && (
          <LocationMarker position={position} onLocationChange={handleLocationChange} />
        )}
        {!interactive && position && (
          <Marker position={position}></Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default SimpleMapLocationPicker;
