import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

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
  const [searchAddress, setSearchAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Geocoding function using Nominatim API
  const searchLocation = async (address: string) => {
    if (!address.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=ge`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onLocationChange(newLat, newLng);
        
        // Update map view and marker
        if (mapInstanceRef.current && markerRef.current) {
          const newLatLng = L.latLng(newLat, newLng);
          markerRef.current.setLatLng(newLatLng);
          mapInstanceRef.current.setView(newLatLng, 16);
        }
      } else {
        alert("მისამართი ვერ მოიძებნა. გთხოვთ სცადოთ სხვა მისამართი.");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("ძიებისას მოხდა შეცდომა. გთხოვთ სცადოთ თავიდან.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchClick = () => {
    searchLocation(searchAddress);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchLocation(searchAddress);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map without invalid zIndex property
    mapInstanceRef.current = L.map(mapRef.current).setView([currentLat, currentLng], 13);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    // Add marker with draggable option
    const marker = L.marker([currentLat, currentLng], {
      draggable: interactive
    }).addTo(mapInstanceRef.current);
    
    if (interactive) {
      marker.bindPopup('გადაიტანეთ მაკერი ან დააჭირეთ რუკას ლოკაციის შესაცვლელად');
      
      // Handle marker drag
      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        setCurrentLat(newPos.lat);
        setCurrentLng(newPos.lng);
        onLocationChange(newPos.lat, newPos.lng);
      });
      
      // Handle map click
      mapInstanceRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentLat(lat);
        setCurrentLng(lng);
        onLocationChange(lat, lng);
      });
    } else {
      marker.bindPopup('სერვისის ლოკაცია');
    }

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
    <div className="space-y-4 relative">
      {interactive && (
        <div className="flex gap-2 relative z-20">
          <Input
            type="text"
            placeholder="ჩაწერეთ მისამართი (მაგ: რუსთაველის გამზირი 25, თბილისი)"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-primary/20 focus-visible:ring-primary"
          />
          <Button 
            type="button"
            onClick={handleSearchClick}
            disabled={isSearching || !searchAddress.trim()}
            className="bg-primary hover:bg-primary-light"
          >
            <Search size={16} className="mr-1" />
            {isSearching ? "ეძებს..." : "ძიება"}
          </Button>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="h-64 w-full rounded-lg border border-primary/20 relative z-10"
        style={{ minHeight: '256px', zIndex: 1 }}
      />
      
      {interactive && (
        <p className="text-xs text-muted-foreground relative z-20">
          რუკაზე დაჭერით, მაკერის გადატანით ან მისამართის ძიებით შეგიძლიათ აირჩიოთ ზუსტი ლოკაცია
        </p>
      )}
    </div>
  );
};

export default LocationMapPicker;
