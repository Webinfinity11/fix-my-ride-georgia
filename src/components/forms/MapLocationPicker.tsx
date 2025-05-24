
import { useState, useEffect, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapLocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  interactive?: boolean;
}

// Component to handle map events and marker
const MapController = ({ 
  position, 
  onLocationChange, 
  interactive 
}: { 
  position: [number, number]; 
  onLocationChange: (lat: number, lng: number) => void; 
  interactive: boolean; 
}) => {
  const map = useMap();

  // Handle map clicks
  useMapEvents({
    click(e) {
      if (interactive) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  // Update map view when position changes
  useEffect(() => {
    if (map) {
      map.setView(position, map.getZoom());
    }
  }, [map, position]);

  // Handle marker drag
  const eventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const marker = e.target;
        if (marker != null) {
          const newPos = marker.getLatLng();
          onLocationChange(newPos.lat, newPos.lng);
        }
      },
    }),
    [onLocationChange]
  );

  return (
    <Marker
      draggable={interactive}
      eventHandlers={interactive ? eventHandlers : {}}
      position={position}
    >
      <Popup>
        {interactive 
          ? "გადაიტანეთ მაკერი სასურველ ადგილზე ან დააჭირეთ რუკას" 
          : "სერვისის ლოკაცია"
        }
      </Popup>
    </Marker>
  );
};

const MapLocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  interactive = false 
}: MapLocationPickerProps) => {
  // Default coordinates for Tbilisi
  const defaultLat = 41.7151;
  const defaultLng = 44.8271;
  const defaultZoom = 12;

  // Use provided coordinates or default to Tbilisi
  const displayLat = latitude || defaultLat;
  const displayLng = longitude || defaultLng;

  // Memoize center position to prevent unnecessary re-renders
  const center = useMemo<[number, number]>(() => [
    displayLat, 
    displayLng
  ], [displayLat, displayLng]);

  // Handle location change with validation
  const handleLocationChange = useCallback((lat: number, lng: number) => {
    // Validate coordinates
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onLocationChange(lat, lng);
    }
  }, [onLocationChange]);

  return (
    <div className="space-y-4">
      <div className="h-64 rounded-lg overflow-hidden border border-primary/20 bg-gray-50">
        <MapContainer
          center={center}
          zoom={defaultZoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          attributionControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapController
            position={center}
            onLocationChange={handleLocationChange}
            interactive={interactive}
          />
        </MapContainer>
      </div>
      
      {interactive && (
        <p className="text-xs text-muted-foreground">
          რუკაზე დაჭერით ან მაკერის გადატანით შეგიძლიათ აირჩიოთ ზუსტი ლოკაცია
        </p>
      )}
      
      {interactive && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label 
              htmlFor="latitude" 
              className="block text-sm font-medium text-muted-foreground"
            >
              Latitude
            </label>
            <input
              type="number"
              id="latitude"
              step="0.000001"
              className="mt-1 p-2 w-full border rounded-md shadow-sm focus:ring focus:ring-primary/30 focus:outline-none focus:border-primary/50 text-sm"
              value={displayLat}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  handleLocationChange(lat, displayLng);
                }
              }}
            />
          </div>
          <div>
            <label 
              htmlFor="longitude" 
              className="block text-sm font-medium text-muted-foreground"
            >
              Longitude
            </label>
            <input
              type="number"
              id="longitude"
              step="0.000001"
              className="mt-1 p-2 w-full border rounded-md shadow-sm focus:ring focus:ring-primary/30 focus:outline-none focus:border-primary/50 text-sm"
              value={displayLng}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  handleLocationChange(displayLat, lng);
                }
              }}
            />
          </div>
        </div>
      )}
      
      {interactive && (displayLat !== defaultLat || displayLng !== defaultLng) && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => handleLocationChange(defaultLat, defaultLng)}
            className="text-sm text-primary hover:text-primary/80 underline"
          >
            თბილისზე დაბრუნება
          </button>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;
