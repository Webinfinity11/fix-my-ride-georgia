import { useState } from "react";
import { useFuelImporters } from "@/hooks/useFuelImporters";
import FuelImporterCard from "@/components/fuel/FuelImporterCard";
import FuelHero from "@/components/fuel/FuelHero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Fuel } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FuelImporters = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  
  const { data: importers = [], isLoading } = useFuelImporters();

  // Apply search filter
  const filteredImporters = importers.filter((importer) => {
    const matchesSearch = searchQuery === "" || 
      importer.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Apply sorting
  const sortedImporters = [...filteredImporters].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name, "ka");
    } else if (sortBy === "super-price") {
      return (a.super_ron_98_price || 999) - (b.super_ron_98_price || 999);
    } else if (sortBy === "premium-price") {
      return (a.premium_ron_96_price || 999) - (b.premium_ron_96_price || 999);
    } else if (sortBy === "regular-price") {
      return (a.regular_ron_93_price || 999) - (b.regular_ron_93_price || 999);
    }
    return 0;
  });

  return (
    <Layout>
      <SEOHead
        title="საწვავის იმპორტიორები - FixUp | აირჩიეთ საუკეთესო ფასი"
        description="იხილეთ საწვავის ყველა იმპორტიორის აქტუალური ფასები საქართველოში. სუპერი, პრემიუმი და რეგულარი საწვავის ფასების შედარება."
        keywords="საწვავი, ბენზინი, დიზელი, საწვავის ფასი, RON 98, RON 96, RON 93, საწვავის იმპორტიორები, საქართველო"
      />

      <FuelHero />

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="მოძებნეთ კომპანია..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="დალაგება" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">დასახელება (ა-ჰ)</SelectItem>
                <SelectItem value="super-price">სუპერი (ფასი)</SelectItem>
                <SelectItem value="premium-price">პრემიუმი (ფასი)</SelectItem>
                <SelectItem value="regular-price">რეგულარი (ფასი)</SelectItem>
              </SelectContent>
            </Select>

            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4 mr-2" />
                გასუფთავება
              </Button>
            )}
          </div>
        </div>

        {/* Importers Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">იტვირთება...</p>
          </div>
        ) : sortedImporters.length === 0 ? (
          <div className="text-center py-12">
            <Fuel className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">კომპანია არ მოიძებნა</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "სცადეთ სხვა საძიებო ტერმინი" 
                : "საწვავის იმპორტიორები ჯერ არ არის დამატებული"
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                ყველა კომპანიის ნახვა
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedImporters.map((importer) => (
              <FuelImporterCard key={importer.id} importer={importer} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FuelImporters;
