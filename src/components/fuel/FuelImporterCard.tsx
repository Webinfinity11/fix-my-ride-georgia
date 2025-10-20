import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type FuelImporter = Database["public"]["Tables"]["fuel_importers"]["Row"];

interface FuelImporterCardProps {
  importer: FuelImporter;
}

const FuelImporterCard = ({ importer }: FuelImporterCardProps) => {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      {/* Logo Section */}
      {importer.logo_url ? (
        <div className="relative h-32 overflow-hidden rounded-t-lg bg-muted flex items-center justify-center p-4">
          <img
            src={importer.logo_url}
            alt={importer.name}
            className="max-h-full max-w-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><div class="w-12 h-12 text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg></div></div>';
            }}
          />
        </div>
      ) : (
        <div className="h-32 bg-muted flex items-center justify-center rounded-t-lg">
          <Building2 className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">{importer.name}</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {importer.super_ron_98_price && (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <span className="font-medium text-green-900 dark:text-green-100">სუპერი RON 98</span>
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                {importer.super_ron_98_price} ₾
              </Badge>
            </div>
          )}
          
          {importer.premium_ron_96_price && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <span className="font-medium text-blue-900 dark:text-blue-100">პრემიუმი RON 96</span>
              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                {importer.premium_ron_96_price} ₾
              </Badge>
            </div>
          )}
          
          {importer.regular_ron_93_price && (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="font-medium text-slate-900 dark:text-slate-100">რეგულარი RON 93</span>
              <Badge variant="secondary">
                {importer.regular_ron_93_price} ₾
              </Badge>
            </div>
          )}
        </div>

        {!importer.super_ron_98_price && !importer.premium_ron_96_price && !importer.regular_ron_93_price && (
          <p className="text-center text-sm text-muted-foreground py-4">
            ფასები ჯერ არ არის მითითებული
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FuelImporterCard;
