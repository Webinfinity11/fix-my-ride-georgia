import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { useFuelImporters } from "@/hooks/useFuelImporters";
import type { FuelPrice } from "@/services/fuelPricesApi";

// Fuel category definitions
const FUEL_CATEGORIES = {
  super: {
    label: "სუპერი (98+)",
    keywords: ["super", "100", "98", "სუპერ", "ecto 100", "nano super", "g-force super", "efix super"],
  },
  premium: {
    label: "პრემიუმი (95-96)",
    keywords: ["premium", "95", "96", "პრემიუმ", "ecto plus", "nano premium", "g-force premium", "efix euro premium"],
  },
  regular: {
    label: "რეგულარი (92-93)",
    keywords: ["regular", "92", "93", "რეგულარ", "euro regular"],
  },
  diesel: {
    label: "დიზელი",
    keywords: ["diesel", "დიზელ", "euro diesel", "ecto diesel"],
  },
  gas: {
    label: "აირი (LPG/CNG)",
    keywords: ["gas", "lpg", "cng", "აირ", "გაზ"],
  },
};

type FuelCategory = keyof typeof FUEL_CATEGORIES;

interface ComparisonRow {
  company: string;
  fuelType: string;
  fuelTypeEnglish?: string;
  price: number;
  currency: string;
  abbreviation?: string;
}

const FuelComparison = () => {
  const [selectedCategory, setSelectedCategory] = useState<FuelCategory>("super");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: importers = [], isLoading } = useFuelImporters({ english: true });

  // Filter and sort fuels by category
  const comparisonData = useMemo(() => {
    if (!importers.length) return [];

    const category = FUEL_CATEGORIES[selectedCategory];
    const results: ComparisonRow[] = [];

    importers.forEach((importer) => {
      if (!importer.fuelPrices) return;

      // Find matching fuel for this category
      const matchingFuel = importer.fuelPrices.find((fuel: FuelPrice) => {
        const searchText = `${fuel.fuelType} ${fuel.fuelTypeEnglish || ""}`.toLowerCase();
        return category.keywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
      });

      if (matchingFuel) {
        results.push({
          company: importer.name,
          fuelType: matchingFuel.fuelType,
          fuelTypeEnglish: matchingFuel.fuelTypeEnglish,
          price: matchingFuel.price,
          currency: matchingFuel.currency,
          abbreviation: matchingFuel.abbreviation,
        });
      }
    });

    // Sort by price
    results.sort((a, b) => {
      return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
    });

    return results;
  }, [importers, selectedCategory, sortOrder]);

  // Calculate price statistics
  const priceStats = useMemo(() => {
    if (comparisonData.length === 0) return null;

    const prices = comparisonData.map((item) => item.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const spread = max - min;

    return { min, max, avg, spread };
  }, [comparisonData]);

  // Find cheapest and most expensive
  const cheapest = comparisonData[0];
  const mostExpensive = comparisonData[comparisonData.length - 1];

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-primary" />
          ფასების შედარება
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">საწვავის კატეგორია</label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as FuelCategory)}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FUEL_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors"
          >
            {sortOrder === "asc" ? (
              <>
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">იაფიდან ძვირამდე</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">ძვირიდან იაფამდე</span>
              </>
            )}
          </button>
        </div>

        {/* Price Statistics */}
        {priceStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">მინიმალური</p>
              <p className="text-lg font-semibold text-green-600">{priceStats.min.toFixed(2)} GEL</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">მაქსიმალური</p>
              <p className="text-lg font-semibold text-red-600">{priceStats.max.toFixed(2)} GEL</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">საშუალო</p>
              <p className="text-lg font-semibold">{priceStats.avg.toFixed(2)} GEL</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">სხვაობა</p>
              <p className="text-lg font-semibold">{priceStats.spread.toFixed(2)} GEL</p>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">იტვირთება...</div>
        ) : comparisonData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              ამ კატეგორიის საწვავი არ მოიძებნა
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comparisonData.map((item, index) => {
              const isCheapest = item.price === priceStats?.min;
              const isMostExpensive = item.price === priceStats?.max;
              const diffFromAvg = priceStats ? item.price - priceStats.avg : 0;

              return (
                <div
                  key={`${item.company}-${index}`}
                  className={`p-4 rounded-lg border transition-all ${
                    isCheapest
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : isMostExpensive
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{item.company}</h4>
                        {isCheapest && (
                          <Badge variant="default" className="bg-green-600">
                            ყველაზე იაფი
                          </Badge>
                        )}
                        {isMostExpensive && (
                          <Badge variant="destructive">ყველაზე ძვირი</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.fuelTypeEnglish || item.fuelType}
                        {item.abbreviation && (
                          <span className="ml-2 text-xs">({item.abbreviation})</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {item.price.toFixed(2)}{" "}
                        <span className="text-sm text-muted-foreground">{item.currency}</span>
                      </div>
                      {priceStats && diffFromAvg !== 0 && (
                        <div
                          className={`text-xs ${
                            diffFromAvg > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {diffFromAvg > 0 ? "+" : ""}
                          {diffFromAvg.toFixed(2)} საშუალოდან
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {comparisonData.length > 0 && cheapest && mostExpensive && (
          <div className="p-4 bg-muted/50 rounded-lg text-sm">
            <p>
              <strong>{cheapest.company}</strong>-ში ყველაზე იაფია ({cheapest.price.toFixed(2)} GEL),
              ხოლო <strong>{mostExpensive.company}</strong>-ში ყველაზე ძვირი ({mostExpensive.price.toFixed(2)} GEL).
              {priceStats && priceStats.spread > 0.1 && (
                <> სხვაობა შეადგენს <strong>{priceStats.spread.toFixed(2)} GEL</strong>-ს.</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FuelComparison;
