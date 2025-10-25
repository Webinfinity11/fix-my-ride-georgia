import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FuelImporter } from "@/hooks/useFuelImporters";

interface FuelImporterCardProps {
  importer: FuelImporter;
}

const FuelImporterCard = ({ importer }: FuelImporterCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 5;

  const fuelPrices = importer.fuelPrices || [];
  const displayedFuelTypes = isExpanded ? fuelPrices : fuelPrices.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreItems = fuelPrices.length > INITIAL_DISPLAY_COUNT;

  // Connect company uses yellow header with black text/prices, others use blue
  const isConnect = importer.name === "Connect";
  const isGulf = importer.name === "Gulf";
  const isLukoil = importer.name === "Lukoil";
  const isPortal = importer.name === "Portal";
  const isRompetrol = importer.name === "Rompetrol";
  const isSocar = importer.name === "Socar";
  const isWissol = importer.name === "Wissol";

  const primaryColor = isConnect ? '#000000' : '#027bc7';

  // Get logo path
  const logoPath = (() => {
    if (isConnect) return '/fuel-company-logos/connect-main-logo.svg';
    if (isGulf) return '/fuel-company-logos/gulf-logo.png';
    if (isLukoil) return '/fuel-company-logos/lukoil-logo.png';
    if (isPortal) return '/fuel-company-logos/portal-logo.svg';
    if (isRompetrol) return '/fuel-company-logos/rompetrol-logo.png';
    if (isSocar) return '/fuel-company-logos/socar-logo.svg';
    if (isWissol) return '/fuel-company-logos/wissol-logo.png';
    return null;
  })();

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow"
      style={{ 
        borderTop: `3px solid ${primaryColor}`,
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <CardTitle className="text-lg sm:text-xl">{importer.name}</CardTitle>
              <div className="sm:hidden text-right">
                <div className="text-xs text-muted-foreground">ტიპი</div>
                <div className="text-xl font-bold" style={{ color: primaryColor }}>
                  {displayedFuelTypes.length}
                </div>
              </div>
            </div>
            {importer.logo_url && (
              <div className="mt-3">
                <img 
                  src={logoPath || importer.logo_url}
                  alt={`${importer.name} ლოგო`}
                  className="h-6 sm:h-8 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== importer.logo_url) {
                      target.src = importer.logo_url;
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs text-muted-foreground mb-1">
              სულ ტიპი
            </div>
            <div className="text-2xl font-bold" style={{ color: primaryColor }}>
              {displayedFuelTypes.length}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {fuelPrices.length > 0 ? (
          <>
            <div className="space-y-2">
              {displayedFuelTypes.map((fuel, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="text-sm font-medium">{fuel.fuelType}</span>
                  <span className="text-lg font-bold" style={{ color: primaryColor }}>
                    {fuel.price.toFixed(2)} ₾
                  </span>
                </div>
              ))}
            </div>

            {hasMoreItems && (
              <Button
                variant="ghost"
                className="w-full mt-3 text-sm"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ color: primaryColor }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    შეკეცვა
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    ვრცლად ({fuelPrices.length - INITIAL_DISPLAY_COUNT} კიდევ)
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            ფასები ჯერ არ არის მითითებული
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FuelImporterCard;
