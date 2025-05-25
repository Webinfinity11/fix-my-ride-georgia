
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Tag, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface EnhancedCategorySelectorProps {
  selectedCategoryId: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  disabled?: boolean;
}

const EnhancedCategorySelector = ({ 
  selectedCategoryId, 
  onCategorySelect, 
  disabled = false 
}: EnhancedCategorySelectorProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast.error("კატეგორიების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium">კატეგორია</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">კატეგორია</div>
        {selectedCategory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCategorySelect(null)}
            disabled={disabled}
            className="text-red-600 hover:text-red-700"
          >
            გაუქმება
          </Button>
        )}
      </div>

      {selectedCategory && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="font-medium">{selectedCategory.name}</span>
              <Check className="h-4 w-4 text-green-600 ml-auto" />
            </div>
            {selectedCategory.description && (
              <p className="text-sm text-gray-600 mt-2">{selectedCategory.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="კატეგორიის ძიება..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
        {filteredCategories.map((category) => (
          <Card
            key={category.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCategoryId === category.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-primary/50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !disabled && onCategorySelect(category.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{category.name}</h3>
                {selectedCategoryId === category.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              {category.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {category.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500">
          <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>კატეგორია ვერ მოიძებნა</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedCategorySelector;
