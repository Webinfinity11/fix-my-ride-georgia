import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useFuelImporters } from "@/hooks/useFuelImporters";
import { useFuelHistory, supportsHistoricalData, getDateRangeOptions } from "@/hooks/useFuelHistory";
import type { CompanyName } from "@/services/fuelPricesApi";

const FuelPriceHistory = () => {
  const [selectedCompany, setSelectedCompany] = useState<CompanyName>("wissol");
  const [selectedFuelType, setSelectedFuelType] = useState<string>("");
  const [dateRange, setDateRange] = useState<number>(30);

  // Fetch available companies
  const { data: importers = [] } = useFuelImporters({ english: true });

  // Filter companies that support historical data
  const companiesWithHistory = useMemo(() => {
    return importers.filter((importer) => supportsHistoricalData(importer.name));
  }, [importers]);

  // Get fuel types for selected company
  const selectedImporter = useMemo(() => {
    return importers.find((imp) => imp.name.toLowerCase() === selectedCompany);
  }, [importers, selectedCompany]);

  const fuelTypes = useMemo(() => {
    return selectedImporter?.fuelPrices || [];
  }, [selectedImporter]);

  // Set default fuel type when company changes
  useMemo(() => {
    if (fuelTypes.length > 0 && !selectedFuelType) {
      setSelectedFuelType(fuelTypes[0].fuelType);
    }
  }, [fuelTypes, selectedFuelType]);

  // Fetch historical data
  const { data: historyData, isLoading, error } = useFuelHistory(
    selectedCompany,
    selectedFuelType,
    dateRange,
    Boolean(selectedFuelType)
  );

  // Format chart data
  const chartData = useMemo(() => {
    if (!historyData?.data?.historicalPrices) return [];

    return historyData.data.historicalPrices.map((record) => ({
      date: new Date(record.date).toLocaleDateString("ka-GE", {
        month: "short",
        day: "numeric",
      }),
      price: record.price,
      fullDate: record.date,
    }));
  }, [historyData]);

  // Calculate price trend
  const priceTrend = useMemo(() => {
    if (!historyData?.data?.priceChange) return null;

    const change = historyData.data.priceChange;
    return {
      amount: change.amount,
      percentage: change.percentage,
      direction: change.amount > 0 ? "up" : change.amount < 0 ? "down" : "stable",
    };
  }, [historyData]);

  // Get date range options
  const dateRangeOptions = getDateRangeOptions(selectedCompany);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          ფასების ისტორია
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">კომპანია</label>
            <Select
              value={selectedCompany}
              onValueChange={(value) => {
                setSelectedCompany(value as CompanyName);
                setSelectedFuelType(""); // Reset fuel type
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companiesWithHistory.map((importer) => (
                  <SelectItem key={importer.id} value={importer.name.toLowerCase()}>
                    {importer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fuel Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">საწვავის ტიპი</label>
            <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
              <SelectTrigger>
                <SelectValue placeholder="აირჩიეთ საწვავი..." />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((fuel, index) => (
                  <SelectItem key={index} value={fuel.fuelType}>
                    {fuel.fuelTypeEnglish || fuel.fuelType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">პერიოდი</label>
            <Select
              value={dateRange.toString()}
              onValueChange={(value) => setDateRange(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price Trend Indicator */}
        {priceTrend && (
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {priceTrend.direction === "up" && (
                <TrendingUp className="w-5 h-5 text-red-500" />
              )}
              {priceTrend.direction === "down" && (
                <TrendingDown className="w-5 h-5 text-green-500" />
              )}
              {priceTrend.direction === "stable" && (
                <Minus className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {priceTrend.direction === "up" && "ზრდა"}
                {priceTrend.direction === "down" && "კლება"}
                {priceTrend.direction === "stable" && "სტაბილური"}
              </span>
            </div>
            <div className="text-sm">
              <span
                className={
                  priceTrend.direction === "up"
                    ? "text-red-500"
                    : priceTrend.direction === "down"
                    ? "text-green-500"
                    : "text-muted-foreground"
                }
              >
                {priceTrend.amount > 0 ? "+" : ""}
                {priceTrend.amount.toFixed(2)} GEL ({priceTrend.percentage.toFixed(1)}%)
              </span>
              <span className="text-muted-foreground ml-2">შერჩეულ პერიოდში</span>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-[400px] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-sm text-muted-foreground">
                ისტორიული მონაცემების ჩატვირთვისას მოხდა შეცდომა
              </p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">
                ისტორიული მონაცემები არ არის ხელმისაწვდომი
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "ფასი (GEL)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  name="ფასი (GEL)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Info */}
        {historyData && (
          <div className="text-xs text-muted-foreground text-center">
            მონაცემები: {historyData.data.totalRecords} ჩანაწერი •{" "}
            {selectedImporter?.name} • {selectedFuelType}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FuelPriceHistory;
