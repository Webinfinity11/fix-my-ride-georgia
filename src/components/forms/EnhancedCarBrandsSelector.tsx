import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown, 
  Search, 
  Plus, 
  Check,
  X,
  Car,
  Trash2
} from "lucide-react";

const allCarBrands = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti", 
  "Buick", "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Daewoo", "Dacia",
  "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti",
  "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln",
  "Maserati", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Opel",
  "Peugeot", "Porsche", "Ram", "Renault", "Rolls-Royce", "Saab", "Seat", 
  "Skoda", "Smart", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

interface EnhancedCarBrandsSelectorProps {
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  disabled?: boolean;
}

const EnhancedCarBrandsSelector = ({
  selectedBrands,
  onBrandsChange,
  placeholder = "აირჩიეთ მანქანის მარკები",
  maxSelections = 10,
  disabled = false
}: EnhancedCarBrandsSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customBrandName, setCustomBrandName] = useState("");

  // Filter brands based on search term
  const filteredBrands = allCarBrands.filter(brand =>
    brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBrandToggle = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter(b => b !== brand));
    } else if (selectedBrands.length < maxSelections) {
      onBrandsChange([...selectedBrands, brand]);
    }
  };

  const handleAddCustomBrand = () => {
    if (customBrandName.trim() && !selectedBrands.includes(customBrandName.trim())) {
      if (selectedBrands.length < maxSelections) {
        onBrandsChange([...selectedBrands, customBrandName.trim()]);
        setCustomBrandName("");
        setIsAddingCustom(false);
        setSearchTerm("");
      }
    }
  };

  const handleRemoveBrand = (brandToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onBrandsChange(selectedBrands.filter(brand => brand !== brandToRemove));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBrandsChange([]);
  };

  const resetForm = () => {
    setSearchTerm("");
    setIsAddingCustom(false);
    setCustomBrandName("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const isCustomBrand = (brand: string) => !allCarBrands.includes(brand);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        მანქანის მარკები
        <span className="text-gray-500 ml-1">
          ({selectedBrands.length}/{maxSelections})
        </span>
      </Label>
      
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between min-h-12 px-3 border-2 border-gray-200 hover:border-primary focus:border-primary"
            disabled={disabled}
          >
            <div className="flex items-center gap-2 flex-1 text-left">
              <Car className="h-4 w-4 text-gray-500 shrink-0" />
              {selectedBrands.length > 0 ? (
                <div className="flex flex-wrap gap-1 flex-1">
                  {selectedBrands.slice(0, 3).map((brand) => (
                    <Badge
                      key={brand}
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {brand}
                      {isCustomBrand(brand) && (
                        <span className="ml-1 text-blue-600">*</span>
                      )}
                    </Badge>
                  ))}
                  {selectedBrands.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedBrands.length - 3} მეტი
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {selectedBrands.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100"
                  onClick={handleClearAll}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-4 space-y-4 max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="მოძებნეთ მარკა..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-gray-200 focus:border-primary"
              />
            </div>

            {/* Selection Info */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>არჩეულია: {selectedBrands.length}/{maxSelections}</span>
              {selectedBrands.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBrandsChange([])}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                >
                  ყველას გასუფთავება
                </Button>
              )}
            </div>

            {/* Brands Grid */}
            <div className="max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {filteredBrands.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleBrandToggle(brand)}
                  >
                    <Checkbox
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={() => handleBrandToggle(brand)}
                      disabled={!selectedBrands.includes(brand) && selectedBrands.length >= maxSelections}
                    />
                    <span className="text-sm flex-1 truncate">{brand}</span>
                  </div>
                ))}
              </div>

              {filteredBrands.length === 0 && searchTerm && (
                <div className="text-center py-4 text-gray-500">
                  <Car className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">მარკა ვერ მოიძებნა</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Add Custom Brand */}
            <div className="space-y-3">
              {!isAddingCustom ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                  disabled={selectedBrands.length >= maxSelections}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  სხვა მარკის დამატება
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="ახალი მარკის სახელი..."
                    value={customBrandName}
                    onChange={(e) => setCustomBrandName(e.target.value)}
                    className="h-9 text-sm border-gray-200 focus:border-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustomBrand();
                      } else if (e.key === 'Escape') {
                        setIsAddingCustom(false);
                        setCustomBrandName("");
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddCustomBrand}
                      disabled={!customBrandName.trim() || selectedBrands.includes(customBrandName.trim()) || selectedBrands.length >= maxSelections}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      დამატება
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingCustom(false);
                        setCustomBrandName("");
                      }}
                      className="flex-1"
                    >
                      <X className="h-3 w-3 mr-1" />
                      გაუქმება
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 შეგიძლიათ აირჩიოთ მაქსიმუმ {maxSelections} მარკა. * ნიშნავს მომხმარებლის მიერ დამატებულ მარკას.
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Brands Display */}
      {selectedBrands.length > 0 && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">არჩეული მარკები:</span>
            <span className="text-xs text-gray-500">{selectedBrands.length}/{maxSelections}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedBrands.map((brand) => (
              <Badge
                key={brand}
                variant="default"
                className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer group"
                onClick={(e) => handleRemoveBrand(brand, e)}
              >
                <Car className="h-3 w-3 mr-1" />
                {brand}
                {isCustomBrand(brand) && (
                  <span className="ml-1 text-blue-600 font-bold">*</span>
                )}
                <X className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCarBrandsSelector;