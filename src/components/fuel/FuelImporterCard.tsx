import { useState } from "react";
import { Card } from "@/components/ui/card";
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
  const hasMoreItems = fuelPrices.length > INITIAL_DISPLAY_COUNT;
  const displayedPrices = isExpanded
    ? fuelPrices
    : fuelPrices.slice(0, INITIAL_DISPLAY_COUNT);

  // Connect company uses yellow header with black text/prices, others use blue
  const isConnect = importer.name === "Connect";
  const isGulf = importer.name === "Gulf";
  const isLukoil = importer.name === "Lukoil";
  const isPortal = importer.name === "Portal";
  const isRompetrol = importer.name === "Rompetrol";
  const isSocar = importer.name === "Socar";
  const isWissol = importer.name === "Wissol";
  const hasLogo = isConnect || isGulf || isLukoil || isPortal || isRompetrol || isSocar || isWissol;

  const primaryColor = isConnect ? '#000000' : '#027bc7'; // Black for Connect prices, blue for others
  const gradientColor = isConnect ? '#ffdd00' : '#027bc7'; // Yellow for Connect header
  const gradientEnd = isConnect ? '#ffc700' : '#0268a8';
  const textColor = isConnect ? 'text-gray-900' : 'text-white';
  const subtextColor = isConnect ? 'text-gray-700' : 'text-white/80';

  // Get logo path
  const getLogoPath = () => {
    if (isConnect) return '/fuel-company-logos/connect-main-logo.svg';
    if (isGulf) return '/fuel-company-logos/gulf-logo.png';
    if (isLukoil) return '/fuel-company-logos/lukoil-logo.png';
    if (isPortal) return '/fuel-company-logos/portal-logo.svg';
    if (isRompetrol) return '/fuel-company-logos/rompetrol-logo.png';
    if (isSocar) return '/fuel-company-logos/socar-logo.svg';
    if (isWissol) return '/fuel-company-logos/wissol-logo.png';
    return null;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with gradient background */}
      <div className={`p-4 ${textColor}`} style={{ background: `linear-gradient(to right, ${gradientColor}, ${gradientEnd})` }}>
        <div className="flex items-center gap-3">
          {hasLogo && getLogoPath() && (
            <div className="bg-white rounded-full p-3 flex items-center justify-center w-16 h-16 shrink-0">
              <img
                src={getLogoPath()}
                alt={`${importer.name} logo`}
                className={`h-10 w-10 object-contain ${isWissol ? 'rounded-md' : ''}`}
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">{importer.name}</h3>
            <p className={`text-sm ${subtextColor}`}>
              {importer.totalFuelTypes ? `${importer.totalFuelTypes} საწვავის ტიპი` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Fuel prices list */}
      <div className="bg-white">
        {fuelPrices.length > 0 ? (
          <>
            <div className="divide-y divide-gray-100">
              {displayedPrices.map((fuel, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700 font-medium">
                    {fuel.fuelType}
                  </span>
                  <span className="font-bold text-lg" style={{ color: primaryColor }}>
                    {fuel.price.toFixed(2)} ₾
                  </span>
                </div>
              ))}
            </div>

            {/* Expand/Collapse button */}
            {hasMoreItems && (
              <div className="border-t border-gray-100">
                <Button
                  variant="ghost"
                  className="w-full py-3 text-sm hover:bg-gray-50"
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
                      ვრცლად ({fuelPrices.length - INITIAL_DISPLAY_COUNT} დამატებითი)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          // Fallback: show old format if fuelPrices is not available
          <div className="divide-y divide-gray-100">
            {importer.super_ron_98_price && (
              <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700 font-medium">სუპერი RON 98</span>
                <span className="font-bold text-lg" style={{ color: primaryColor }}>
                  {importer.super_ron_98_price.toFixed(2)} ₾
                </span>
              </div>
            )}
            {importer.premium_ron_96_price && (
              <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700 font-medium">პრემიუმი RON 96</span>
                <span className="font-bold text-lg" style={{ color: primaryColor }}>
                  {importer.premium_ron_96_price.toFixed(2)} ₾
                </span>
              </div>
            )}
            {importer.regular_ron_93_price && (
              <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-gray-700 font-medium">რეგულარი RON 93</span>
                <span className="font-bold text-lg" style={{ color: primaryColor }}>
                  {importer.regular_ron_93_price.toFixed(2)} ₾
                </span>
              </div>
            )}
            {!importer.super_ron_98_price && !importer.premium_ron_96_price && !importer.regular_ron_93_price && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">
                  ფასები ჯერ არ არის მითითებული
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default FuelImporterCard;
