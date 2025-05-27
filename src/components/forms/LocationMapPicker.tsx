
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  interactive?: boolean;
}

const LocationMapPicker = ({
  latitude,
  longitude,
  onLocationChange,
  interactive = true
}: LocationMapPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // Default coordinates for Tbilisi
  const defaultLat = 41.7151;
  const defaultLng = 44.8271;
  
  const [currentLat, setCurrentLat] = useState(latitude || defaultLat);
  const [currentLng, setCurrentLng] = useState(longitude || defaultLng);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([currentLat, currentLng], 13);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add marker
    const marker = L.marker([currentLat, currentLng]).addTo(map);
    
    if (interactive) {
      marker.bindPopup('გადაიტანეთ მაკერი ან დააჭირეთ რუკას ლოკაციის შესაცვლელად');
      
      // Make marker draggable
      marker.setDraggable(true);
      
      // Handle marker drag
      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        setCurrentLat(newPos.lat);
        setCurrentLng(newPos.lng);
        onLocationChange(newPos.lat, newPos.lng);
      });
      
      // Handle map click
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentLat(lat);
        setCurrentLng(lng);
        onLocationChange(lat, lng);
      });
    } else {
      marker.bindPopup('სერვისის ლოკაცია');
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update marker position when props change
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined && markerRef.current && mapInstanceRef.current) {
      const newLatLng = L.latLng(latitude, longitude);
      markerRef.current.setLatLng(newLatLng);
      mapInstanceRef.current.setView(newLatLng, mapInstanceRef.current.getZoom());
      setCurrentLat(latitude);
      setCurrentLng(longitude);
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-2">
      <div 
        ref={mapRef} 
        className="h-64 w-full rounded-lg border border-primary/20"
        style={{ minHeight: '256px' }}
      />
      {interactive && (
        <p className="text-xs text-muted-foreground">
          რუკაზე დაჭერით ან მაკერის გადატანით შეგიძლიათ აირჩიოთ ზუსტი ლოკაცია
        </p>
      )}
    </div>
  );
};

export default LocationMapPicker;
