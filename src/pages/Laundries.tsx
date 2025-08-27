import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Filter, Search, MapPin } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Temporary interface until Supabase types are updated
interface TempLaundry {
  id: number;
  name: string;
  description?: string;
  address?: string;
  contact_number?: string;
  latitude?: number;
  longitude: number;
  water_price?: number;
  foam_price?: number;
  wax_price?: number;
  box_count?: number;
  photos?: string[];
  videos?: string[];
  created_at?: string;
}

const Laundries = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Temporary mock data until backend is ready
  const laundries: TempLaundry[] = [];
  const isLoading = false;

  // Filter laundries based on search term
  const filteredLaundries = laundries?.filter((laundry) =>
    laundry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    laundry.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    laundry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewDetails = (laundry: TempLaundry) => {
    console.log("View details for:", laundry);
  };

  return (
    <Layout>
      <Helmet>
        <title>სამრეცხაოები - FixUp</title>
        <meta 
          name="description" 
          content="იპოვეთ ახლომდებარე სამრეცხაოები. ავტომობილის რეცხვის სერვისები საუკეთესო ფასებით თბილისში." 
        />
        <meta name="keywords" content="სამრეცხაო, ავტომობილის რეცხვა, car wash, თბილისი" />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">სამრეცხაოები</h1>
          <p className="text-muted-foreground">
            იპოვეთ საუკეთესო სამრეცხაოები თქვენს ახლოს
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="მოძებნეთ სამრეცხაო სახელით ან მისამართით..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              ფილტრები
            </Button>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              ნაპოვნია {filteredLaundries.length} სამრეცხაო
            </p>
            
            {searchTerm && (
              <Badge variant="secondary" className="ml-2">
                ძიება: {searchTerm}
              </Badge>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">იტვირთება...</p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredLaundries.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">სამრეცხაო არ მოიძებნა</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "სცადეთ სხვა საძიებო ტერმინი" 
                : "ამ მხარეში სამრეცხაოები არ არის დარეგისტრირებული"
              }
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
              >
                ყველა სამრეცხაოს ნაჩვენები
              </Button>
            )}
          </div>
        )}

        {/* Laundries Grid */}
        {!isLoading && filteredLaundries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLaundries.map((laundry) => (
              <Card key={laundry.id} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{laundry.name}</CardTitle>
                  {laundry.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {laundry.address}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {laundry.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {laundry.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {laundry.water_price && (
                      <Badge variant="outline" className="text-xs">
                        წყალი: {laundry.water_price}₾
                      </Badge>
                    )}
                    {laundry.foam_price && (
                      <Badge variant="outline" className="text-xs">
                        ქაფი: {laundry.foam_price}₾
                      </Badge>
                    )}
                    {laundry.wax_price && (
                      <Badge variant="outline" className="text-xs">
                        ცვილი: {laundry.wax_price}₾
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Laundries;