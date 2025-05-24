
import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const MapController = ({ center, zoom }: MapControllerProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

interface MapClickHandlerProps {
  onLocationChange: (lat: number, lng: number) => void;
  interactive: boolean;
}

const MapClickHandler = ({ onLocationChange, interactive }: MapClickHandlerProps) => {
  const map = useMapEvents({
    click: (e) => {
      if (interactive) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  
  return null;
};

interface MapLocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  interactive?: boolean;
}

const MapLocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange, 
  interactive = false 
}: MapLocationPickerProps) => {
  const defaultLat = 41.7151;
  const defaultLng = 44.8271;
  const defaultZoom = 12;

  const [center, setCenter] = useState<[number, number]>([
    latitude || defaultLat, 
    longitude || defaultLng
  ]);

  useEffect(() => {
    setCenter([latitude || defaultLat, longitude || defaultLng]);
  }, [latitude, longitude, defaultLat, defaultLng]);

  // Stabilize the marker drag handler with useCallback
  const handleMarkerDrag = useCallback((e: any) => {
    const marker = e.target;
    const position = marker.getLatLng();
    onLocationChange(position.lat, position.lng);
  }, [onLocationChange]);

  return (
    <div className="space-y-4">
      <div className="h-64 rounded-lg overflow-hidden border border-primary/20">
        <MapContainer
          center={center}
          zoom={defaultZoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapController center={center} zoom={defaultZoom} />
          {interactive && (
            <MapClickHandler onLocationChange={onLocationChange} interactive={interactive} />
          )}
          {latitude && longitude && (
            <Marker 
              position={[latitude, longitude]}
              draggable={interactive}
              eventHandlers={interactive ? {
                dragend: handleMarkerDrag
              } : {}}
            >
              <Popup>
                {interactive ? "გადაიტანეთ მაკერი სასურველ ადგილზე" : "სერვისის ლოკაცია"}
              </Popup>
            </Marker>
          )}
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
              className="mt-1 p-2 w-full border rounded-md shadow-sm focus:ring focus:ring-primary/30 focus:outline-none focus:border-primary/50 text-sm"
              value={latitude || ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  onLocationChange(lat, longitude || defaultLng);
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
              className="mt-1 p-2 w-full border rounded-md shadow-sm focus:ring focus:ring-primary/30 focus:outline-none focus:border-primary/50 text-sm"
              value={longitude || ''}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  onLocationChange(latitude || defaultLat, lng);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;
