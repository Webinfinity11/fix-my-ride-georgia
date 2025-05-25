
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Car, X, Plus } from "lucide-react";

interface EnhancedCarBrandsSelectorProps {
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  disabled?: boolean;
}

const popularBrands = [
  "Toyota", "Honda", "Nissan", "Hyundai", "Kia", "Volkswagen", 
  "BMW", "Mercedes-Benz", "Audi", "Ford", "Chevrolet", "Mazda",
  "Subaru", "Lexus", "Infiniti", "Acura", "Jeep", "Land Rover",
  "Porsche", "Volvo", "MINI", "Jaguar", "Bentley", "Ferrari",
  "Lamborghini", "Maserati", "Tesla", "Peugeot", "Renault",
  "Citroën", "Fiat", "Alfa Romeo", "Škoda", "SEAT"
];

const EnhancedCarBrandsSelector = ({ 
  selectedBrands, 
  onBrandsChange, 
  disabled = false 
}: EnhancedCarBrandsSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const filteredBrands = popularBrands.filter(brand =>
    brand.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedBrands.includes(brand)
  );

  const handleBrandToggle = (brand: string) => {
    if (disabled) return;
    
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter(b => b !== brand));
    } else {
      onBrandsChange([...selectedBrands, brand]);
    }
  };

  const handleAddCustomBrand = () => {
    if (!customBrand.trim() || selectedBrands.includes(customBrand.trim())) return;
    
    onBrandsChange([...selectedBrands, customBrand.trim()]);
    setCustomBrand("");
    setShowCustomInput(false);
  };

  const handleClearAll = () => {
    if (!disabled) {
      onBrandsChange([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">მანქანის მარკები</div>
        {selectedBrands.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-red-600 hover:text-red-700"
          >
            ყველას გაუქმება
          </Button>
        )}
      </div>

      {selectedBrands.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">არჩეული მარკები ({selectedBrands.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedBrands.map((brand) => (
                <Badge
                  key={brand}
                  variant="secondary"
                  className="bg-primary text-white hover:bg-primary/90 cursor-pointer"
                  onClick={() => handleBrandToggle(brand)}
                >
                  {brand}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="მარკის ძიება..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
        {filteredBrands.map((brand) => (
          <Button
            key={brand}
            variant="outline"
            size="sm"
            className="justify-start hover:bg-primary hover:text-white transition-colors"
            onClick={() => handleBrandToggle(brand)}
            disabled={disabled}
          >
            <Plus className="h-3 w-3 mr-2" />
            {brand}
          </Button>
        ))}
      </div>

      {filteredBrands.length === 0 && searchTerm && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-2">მარკა ვერ მოიძებნა</p>
          {!showCustomInput ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomInput(true)}
              disabled={disabled}
            >
              <Plus className="h-3 w-3 mr-1" />
              "{searchTerm}" დამატება
            </Button>
          ) : (
            <div className="flex gap-2 max-w-xs mx-auto">
              <Input
                placeholder="მარკის სახელი"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomBrand()}
                size="sm"
                disabled={disabled}
              />
              <Button
                size="sm"
                onClick={handleAddCustomBrand}
                disabled={!customBrand.trim() || disabled}
              >
                დამატება
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomInput(false)}
                disabled={disabled}
              >
                გაუქმება
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomInput(!showCustomInput)}
          disabled={disabled}
        >
          <Plus className="h-3 w-3 mr-1" />
          სხვა მარკა
        </Button>
      </div>
    </div>
  );
};

export default EnhancedCarBrandsSelector;
