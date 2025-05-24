
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

interface MapLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}

const MapLocationPicker = ({ latitude, longitude, onLocationChange }: MapLocationPickerProps) => {
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("თქვენი ბრაუზერი გეოლოკაციას არ მხარდაჭერს");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentLocation({ lat, lng });
        onLocationChange(lat, lng);
        toast.success("მდებარეობა წარმატებით განისაზღვრა");
      },
      (error) => {
        toast.error("მდებარეობის განსაზღვრა ვერ მოხერხდა");
      }
    );
  };

  const openGoogleMaps = () => {
    if (currentLocation) {
      const url = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          მდებარეობა რუკაზე
        </Label>
        
        <div className="border border-primary/20 rounded-lg p-4 space-y-3">
          {currentLocation ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                განსაზღვრული მდებარეობა:
              </p>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openGoogleMaps}
                  className="border-primary/30 hover:bg-primary/5"
                >
                  <MapPin className="mr-1 h-3 w-3" />
                  რუკაზე ნახვა
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  className="border-primary/30 hover:bg-primary/5"
                >
                  <Navigation className="mr-1 h-3 w-3" />
                  განახლება
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                დააჭირეთ ღილაკს თქვენი მდებარეობის განსაზღვრისთვის
              </p>
              <Button
                type="button"
                onClick={getCurrentLocation}
                className="bg-primary hover:bg-primary-light"
              >
                <Navigation className="mr-2 h-4 w-4" />
                მდებარეობის განსაზღვრა
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;
