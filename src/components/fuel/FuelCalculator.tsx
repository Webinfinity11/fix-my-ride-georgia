import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Fuel } from "lucide-react";
import { useFuelImporters } from "@/hooks/useFuelImporters";

const FuelCalculator = () => {
  const { data: importers = [] } = useFuelImporters();
  const [amount, setAmount] = useState<string>("");
  const [selectedImporter, setSelectedImporter] = useState<string>("");
  const [selectedFuelType, setSelectedFuelType] = useState<string>("");

  // Get selected importer data
  const importer = importers.find(imp => String(imp.id) === selectedImporter);

  // Get available fuel types for selected importer
  const availableFuelTypes = importer?.fuelPrices || [];

  // Calculate liters based on amount and selected fuel price
  const selectedFuel = availableFuelTypes.find(f => f.fuelType === selectedFuelType);
  const liters = amount && selectedFuel ? (parseFloat(amount) / selectedFuel.price).toFixed(2) : "0";

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">საწვავის კალკულატორი</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="importer">აირჩიეთ კომპანია</Label>
          <Select value={selectedImporter} onValueChange={setSelectedImporter}>
            <SelectTrigger id="importer">
              <SelectValue placeholder="აირჩიეთ კომპანია..." />
            </SelectTrigger>
            <SelectContent>
              {importers.map((imp) => (
                <SelectItem key={imp.id} value={String(imp.id)}>
                  {imp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedImporter && availableFuelTypes.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="fuel-type">საწვავის ტიპი</Label>
            <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
              <SelectTrigger id="fuel-type">
                <SelectValue placeholder="აირჩიეთ საწვავის ტიპი..." />
              </SelectTrigger>
            <SelectContent>
              {availableFuelTypes.map((fuel) => (
                <SelectItem key={fuel.fuelType} value={fuel.fuelType}>
                  {fuel.fuelType} - {fuel.price.toFixed(2)} ₾
                </SelectItem>
              ))}
            </SelectContent>
            </Select>
          </div>
        )}

        {selectedFuelType && (
          <div className="space-y-2">
            <Label htmlFor="amount">თანხა (₾)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="მაგ: 50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        )}

        {amount && selectedFuel && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">მიიღებთ:</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {liters} ლ
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-right">
              ფასი: {selectedFuel.price.toFixed(2)} ₾/ლ
            </div>
          </div>
        )}

        {!selectedImporter && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            აირჩიეთ კომპანია კალკულაციის დასაწყებად
          </div>
        )}
      </div>
    </Card>
  );
};

export default FuelCalculator;
