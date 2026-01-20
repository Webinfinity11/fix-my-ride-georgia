import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronUp, X, MapPin, Phone, Zap, BatteryCharging, Droplet, Car, Image, Fuel } from "lucide-react";
import { ChargerLocation, getChargerTypeLabel, getChargerColor } from "@/types/charger";
import { FuelStation, FuelBrand, getFuelStationColor, getFuelStationLogo, fuelTypeLabels } from "@/types/fuelStation";
import { Tables } from "@/integrations/supabase/types";

type Laundry = Tables<"laundries">;
type Drive = Tables<"drives">;

interface MapBottomSheetProps {
  viewMode: 'services' | 'laundries' | 'drives' | 'chargers' | 'stations';
  laundries?: Laundry[];
  drives?: Drive[];
  chargers?: ChargerLocation[];
  stations?: FuelStation[];
  selectedId?: string | number | null;
  onItemClick: (item: any) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  chargerFilter?: 'all' | 'fast' | 'level2';
  onChargerFilterChange?: (filter: 'all' | 'fast' | 'level2') => void;
  fastChargersCount?: number;
  stationBrandFilter?: FuelBrand | 'all';
  onStationBrandFilterChange?: (brand: FuelBrand | 'all') => void;
  stationBrandCounts?: Record<FuelBrand | 'all', number>;
}

// Simple mobile-optimized card components
const MobileLaundryCard = ({ laundry, onClick }: { laundry: Laundry; onClick: () => void }) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardContent className="p-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
          <Droplet className="w-5 h-5 text-cyan-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{laundry.name}</h3>
          {laundry.address && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {laundry.address}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {laundry.box_count && (
              <Badge variant="secondary" className="text-xs">{laundry.box_count} ბოქსი</Badge>
            )}
            {laundry.photos && laundry.photos.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Image className="w-3 h-3 mr-1" />
                {laundry.photos.length}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const MobileDriveCard = ({ drive, onClick }: { drive: Drive; onClick: () => void }) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardContent className="p-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <Car className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{drive.name}</h3>
          {drive.address && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {drive.address}
            </p>
          )}
          {drive.photos && drive.photos.length > 0 && (
            <Badge variant="outline" className="text-xs mt-1">
              <Image className="w-3 h-3 mr-1" />
              {drive.photos.length} ფოტო
            </Badge>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const MobileChargerCard = ({ charger, onClick, isSelected }: { charger: ChargerLocation; onClick: () => void; isSelected: boolean }) => {
  const isFastCharger = charger.type === 'fast_charger' || charger.status === 'fast';
  const typeColor = getChargerColor(charger.type);
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-yellow-500 shadow-lg' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: typeColor }}
          >
            {isFastCharger ? (
              <BatteryCharging className="w-5 h-5 text-white" />
            ) : (
              <Zap className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{charger.name_ka}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
              >
                {getChargerTypeLabel(charger.type)}
              </Badge>
              {isFastCharger && (
                <Badge className="text-xs bg-green-100 text-green-700">⚡ სწრაფი</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Mobile station card
const MobileStationCard = ({ station, onClick, isSelected }: { station: FuelStation; onClick: () => void; isSelected: boolean }) => {
  const brandColor = getFuelStationColor(station.brand);
  const logo = getFuelStationLogo(station.brand);
  
  const activeFuelTypes = Object.entries(station.fuel_types)
    .filter(([_, available]) => available)
    .map(([type]) => type);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-orange-500 shadow-lg' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div 
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center p-1"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            {logo ? (
              <img src={logo} alt={station.brand} className="w-full h-full object-contain" />
            ) : (
              <Fuel className="w-5 h-5" style={{ color: brandColor }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{station.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {activeFuelTypes.slice(0, 3).map((type) => (
                <Badge key={type} variant="secondary" className="text-[9px] px-1 py-0">
                  {fuelTypeLabels[type] || type}
                </Badge>
              ))}
              {activeFuelTypes.length > 3 && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  +{activeFuelTypes.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MapBottomSheet = ({
  viewMode,
  laundries = [],
  drives = [],
  chargers = [],
  stations = [],
  selectedId,
  onItemClick,
  searchQuery,
  onSearchChange,
  chargerFilter = 'all',
  onChargerFilterChange,
  fastChargersCount = 0,
  stationBrandFilter = 'all',
  onStationBrandFilterChange,
  stationBrandCounts,
}: MapBottomSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [snapPoint, setSnapPoint] = useState<number | string | null>(0.4);

  const getItemCount = () => {
    switch (viewMode) {
      case 'laundries': return laundries.length;
      case 'drives': return drives.length;
      case 'chargers': return chargers.length;
      case 'stations': return stations.length;
      default: return 0;
    }
  };

  const getLabel = () => {
    switch (viewMode) {
      case 'laundries': return 'სამრეცხაო';
      case 'drives': return 'დრაივი';
      case 'chargers': return 'დამტენი';
      case 'stations': return 'სადგური';
      default: return 'ობიექტი';
    }
  };

  // Don't show for services view (uses different layout)
  if (viewMode === 'services') return null;

  return (
    <>
      {/* Collapsed Peek Bar */}
      {!isOpen && (
        <div 
          className="fixed bottom-16 left-0 right-0 bg-background border-t rounded-t-2xl shadow-lg z-40 cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex flex-col items-center py-3 px-4">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-2" />
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">
                {getItemCount()} {getLabel()} ნაპოვნია
              </span>
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      {/* Full Drawer */}
      <Drawer 
        open={isOpen} 
        onOpenChange={setIsOpen}
        snapPoints={[0.4, 0.85]}
        activeSnapPoint={snapPoint}
        setActiveSnapPoint={setSnapPoint}
      >
        <DrawerContent className="h-[85vh] rounded-t-3xl">
          <DrawerHeader className="pb-2">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-base">
                {getItemCount()} {getLabel()} ნაპოვნია
              </DrawerTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DrawerHeader>

          {/* Search */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ძებნა..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-10 rounded-full bg-muted/50"
              />
            </div>
          </div>

          {/* Charger Filter Chips */}
          {viewMode === 'chargers' && onChargerFilterChange && (
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
              <Button
                variant={chargerFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs h-8 shrink-0"
                onClick={() => onChargerFilterChange('all')}
              >
                ყველა ({chargers.length})
              </Button>
              <Button
                variant={chargerFilter === 'fast' ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full text-xs h-8 shrink-0 ${chargerFilter === 'fast' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => onChargerFilterChange('fast')}
              >
                ⚡ სწრაფი ({fastChargersCount})
              </Button>
              <Button
                variant={chargerFilter === 'level2' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs h-8 shrink-0"
                onClick={() => onChargerFilterChange('level2')}
              >
                Level 2
              </Button>
            </div>
          )}

          {/* Station Brand Filter Chips */}
          {viewMode === 'stations' && onStationBrandFilterChange && stationBrandCounts && (
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
              <Button
                variant={stationBrandFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs h-8 shrink-0"
                onClick={() => onStationBrandFilterChange('all')}
              >
                ყველა ({stationBrandCounts.all})
              </Button>
              {(['SOCAR', 'WISSOL', 'ROMPETROL', 'GULF', 'PORTAL'] as FuelBrand[]).map(brand => (
                <Button
                  key={brand}
                  variant={stationBrandFilter === brand ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs h-8 shrink-0 gap-1"
                  style={stationBrandFilter === brand ? { backgroundColor: getFuelStationColor(brand) } : {}}
                  onClick={() => onStationBrandFilterChange(brand)}
                >
                  <img src={getFuelStationLogo(brand)} alt={brand} className="w-4 h-4 object-contain" />
                  {stationBrandCounts[brand]}
                </Button>
              ))}
            </div>
          )}

          {/* Items List */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 pb-4">
              {viewMode === 'chargers' && chargers.map((charger) => (
                <MobileChargerCard
                  key={charger.id}
                  charger={charger}
                  onClick={() => onItemClick(charger)}
                  isSelected={selectedId === charger.id}
                />
              ))}

              {viewMode === 'stations' && stations.map((station) => (
                <MobileStationCard
                  key={station.id}
                  station={station}
                  onClick={() => onItemClick(station)}
                  isSelected={selectedId === station.id}
                />
              ))}

              {viewMode === 'laundries' && laundries.map((laundry) => (
                <MobileLaundryCard
                  key={laundry.id}
                  laundry={laundry}
                  onClick={() => onItemClick(laundry)}
                />
              ))}

              {viewMode === 'drives' && drives.map((drive) => (
                <MobileDriveCard
                  key={drive.id}
                  drive={drive}
                  onClick={() => onItemClick(drive)}
                />
              ))}

              {getItemCount() === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">ვერაფერი მოიძებნა</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
};
