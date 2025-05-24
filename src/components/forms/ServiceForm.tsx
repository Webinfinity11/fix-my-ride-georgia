import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CreditCard, Banknote, MapPin } from "lucide-react";
import LocationSelector from "./LocationSelector";
import MapLocationPicker from "./MapLocationPicker";

type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  estimated_hours: number | null;
  category_id: number | null;
  is_active: boolean;
  accepts_card_payment?: boolean;
  accepts_cash_payment?: boolean;
  working_days?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  car_brands?: string[];
  city?: string;
  district?: string;
  photos?: string[];
  latitude?: number | null;
  longitude?: number | null;
  on_site_service?: boolean;
};

type CategoryType = {
  id: number;
  name: string;
  description?: string | null;
};

interface ServiceFormProps {
  service: ServiceType | null;
  categories: CategoryType[];
  onSubmit: () => void;
  onCancel: () => void;
}

const weekDays = [
  { id: "monday", label: "ორშაბათი" },
  { id: "tuesday", label: "სამშაბათი" },
  { id: "wednesday", label: "ოთხშაბათი" },
  { id: "thursday", label: "ხუთშაბათი" },
  { id: "friday", label: "პარასკევი" },
  { id: "saturday", label: "შაბათი" },
  { id: "sunday", label: "კვირა" },
];

// Common car brands in Georgia
const popularCarBrands = [
  "Mercedes-Benz", "BMW", "Toyota", "Opel", "Volkswagen", 
  "Ford", "Hyundai", "Kia", "Nissan", "Honda", 
  "Lexus", "Audi", "Mitsubishi", "Mazda", "Subaru",
  "Chevrolet", "Renault", "Peugeot", "Skoda", "Porsche"
];

const ServiceForm = ({ service, categories, onSubmit, onCancel }: ServiceFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    priceFrom: "",
    priceTo: "",
    estimatedHours: "",
    categoryId: "",
    isActive: true,
    acceptsCardPayment: false,
    acceptsCashPayment: true,
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"] as string[],
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    carBrands: [] as string[],
    onSiteService: false,
    city: "",
    district: "",
    photos: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        description: service.description || "",
        priceFrom: service.price_from?.toString() || "",
        priceTo: service.price_to?.toString() || "",
        estimatedHours: service.estimated_hours?.toString() || "",
        categoryId: service.category_id?.toString() || "",
        isActive: service.is_active,
        acceptsCardPayment: service.accepts_card_payment || false,
        acceptsCashPayment: service.accepts_cash_payment !== false,
        workingDays: service.working_days || ["monday", "tuesday", "wednesday", "thursday", "friday"],
        workingHoursStart: service.working_hours_start || "09:00",
        workingHoursEnd: service.working_hours_end || "18:00",
        carBrands: service.car_brands || [],
        onSiteService: service.on_site_service || false,
        city: service.city || "",
        district: service.district || "",
        photos: service.photos || [],
        latitude: service.latitude || null,
        longitude: service.longitude || null,
      });
    }
  }, [service]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setForm((prev) => ({ ...prev, categoryId: value }));
  };

  const handleSwitchChange = (checked: boolean, field: string) => {
    setForm((prev) => ({ ...prev, [field]: checked }));
  };

  const handleWorkingDayToggle = (day: string) => {
    setForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const handleCarBrandToggle = (brand: string) => {
    setForm((prev) => ({
      ...prev,
      carBrands: prev.carBrands.includes(brand)
        ? prev.carBrands.filter((b) => b !== brand)
        : [...prev.carBrands, brand]
    }));
  };

  const handleSelectAllBrands = () => {
    setForm((prev) => ({
      ...prev,
      carBrands: prev.carBrands.length === popularCarBrands.length ? [] : [...popularCarBrands]
    }));
  };

  const handleOtherBrandToggle = () => {
    const otherBrand = "სხვა";
    setForm((prev) => ({
      ...prev,
      carBrands: prev.carBrands.includes(otherBrand)
        ? prev.carBrands.filter((b) => b !== otherBrand)
        : [...prev.carBrands, otherBrand]
    }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setForm(prev => ({ 
      ...prev, 
      latitude: lat, 
      longitude: lng 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      if (!form.name) {
        throw new Error("გთხოვთ შეავსოთ სერვისის სახელი");
      }
      
      const serviceData = {
        mechanic_id: user.id,
        name: form.name,
        description: form.description || null,
        price_from: form.priceFrom ? parseFloat(form.priceFrom) : null,
        price_to: form.priceTo ? parseFloat(form.priceTo) : null,
        estimated_hours: form.estimatedHours ? parseInt(form.estimatedHours) : null,
        category_id: form.categoryId ? parseInt(form.categoryId) : null,
        is_active: form.isActive,
        accepts_card_payment: form.acceptsCardPayment,
        accepts_cash_payment: form.acceptsCashPayment,
        working_days: form.workingDays,
        working_hours_start: form.workingHoursStart,
        working_hours_end: form.workingHoursEnd,
        car_brands: form.carBrands,
        on_site_service: form.onSiteService,
        city: form.city || null,
        district: form.district || null,
        photos: form.photos,
        latitude: form.latitude,
        longitude: form.longitude,
      };
      
      if (service) {
        // Update existing service
        const { error } = await supabase
          .from("mechanic_services")
          .update(serviceData)
          .eq("id", service.id)
          .eq("mechanic_id", user.id);
        
        if (error) throw error;
        
        toast.success("სერვისი განახლდა");
      } else {
        // Create new service
        const { error } = await supabase
          .from("mechanic_services")
          .insert(serviceData);
        
        if (error) throw error;
        
        toast.success("სერვისი დაემატა");
      }
      
      onSubmit();
    } catch (error: any) {
      toast.error(`სერვისის შენახვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="border border-primary/10 shadow-md">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-6 text-primary">
          {service ? "სერვისის რედაქტირება" : "ახალი სერვისის დამატება"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="name" className="text-base">სერვისის დასახელება *</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="მაგ: ძრავის ზეთის შეცვლა"
              className="border-primary/20 focus-visible:ring-primary"
              required
            />
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="description" className="text-base">აღწერა</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="სერვისის დეტალური აღწერა"
              className="border-primary/20 focus-visible:ring-primary resize-y min-h-[100px]"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="categoryId" className="text-base">კატეგორია</Label>
              <div className="space-y-2">
                <Input
                  placeholder="კატეგორიის ძიება..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="border-primary/20 focus-visible:ring-primary"
                />
                <Select
                  value={form.categoryId}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="w-full border-primary/20 focus-visible:ring-primary">
                    <SelectValue placeholder="აირჩიეთ კატეგორია" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="estimatedHours" className="text-base">სავარაუდო დრო (საათებში)</Label>
              <Input
                id="estimatedHours"
                name="estimatedHours"
                type="number"
                min="0.5"
                step="0.5"
                value={form.estimatedHours}
                onChange={handleChange}
                placeholder="მაგ: 2"
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="priceFrom" className="text-base">ფასი - დან (GEL)</Label>
              <Input
                id="priceFrom"
                name="priceFrom"
                type="number"
                min="0"
                value={form.priceFrom}
                onChange={handleChange}
                placeholder="მაგ: 50"
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="priceTo" className="text-base">ფასი - მდე (GEL)</Label>
              <Input
                id="priceTo"
                name="priceTo"
                type="number"
                min="0"
                value={form.priceTo}
                onChange={handleChange}
                placeholder="მაგ: 100"
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>
          </div>

          <LocationSelector
            selectedCity={form.city}
            selectedDistrict={form.district}
            onCityChange={(city) => setForm(prev => ({ ...prev, city, district: city !== "თბილისი" ? "" : prev.district }))}
            onDistrictChange={(district) => setForm(prev => ({ ...prev, district }))}
          />

          <div className="space-y-4 pt-2">
            <h3 className="text-base font-medium flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> 
              სერვისის ლოკაცია რუკაზე
            </h3>
            <p className="text-sm text-muted-foreground">
              დააჭირეთ რუკაზე ან გადაიტანეთ მაკერი თქვენი სერვისის ზუსტი ლოკაციისთვის
            </p>
            <MapLocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onLocationChange={handleLocationChange}
              interactive={true}
            />
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-base font-medium flex items-center gap-2">
              <Clock size={18} className="text-primary" /> 
              სამუშაო საათები და დღეები
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="workingHoursStart" className="text-sm text-muted-foreground">დაწყების დრო</Label>
                <Input
                  id="workingHoursStart"
                  name="workingHoursStart"
                  type="time"
                  value={form.workingHoursStart}
                  onChange={handleChange}
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>
              
              <div className="space-y-4">
                <Label htmlFor="workingHoursEnd" className="text-sm text-muted-foreground">დასრულების დრო</Label>
                <Input
                  id="workingHoursEnd"
                  name="workingHoursEnd"
                  type="time"
                  value={form.workingHoursEnd}
                  onChange={handleChange}
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <Label className="text-sm text-muted-foreground">სამუშაო დღეები</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {weekDays.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={day.id} 
                      checked={form.workingDays.includes(day.id)}
                      onCheckedChange={() => handleWorkingDayToggle(day.id)}
                      className="text-primary border-primary/30"
                    />
                    <label
                      htmlFor={day.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-base font-medium flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> 
              გადახდის მეთოდები
            </h3>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acceptsCashPayment" 
                  checked={form.acceptsCashPayment}
                  onCheckedChange={(checked) => handleSwitchChange(!!checked, "acceptsCashPayment")}
                  className="text-primary border-primary/30"
                />
                <Label htmlFor="acceptsCashPayment" className="cursor-pointer flex items-center gap-2">
                  <Banknote size={16} /> ნაღდი ანგარიშსწორება
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acceptsCardPayment" 
                  checked={form.acceptsCardPayment}
                  onCheckedChange={(checked) => handleSwitchChange(!!checked, "acceptsCardPayment")}
                  className="text-primary border-primary/30"
                />
                <Label htmlFor="acceptsCardPayment" className="cursor-pointer flex items-center gap-2">
                  <CreditCard size={16} /> ბარათით გადახდა
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-base font-medium">მანქანის მარკები, რომლებზეც მუშაობთ</h3>
            
            <div className="flex gap-2 mb-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllBrands}
                className="border-primary/30 hover:bg-primary/5"
              >
                {form.carBrands.length === popularCarBrands.length ? "გაუქმება" : "ყველას არჩევა"}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {popularCarBrands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`brand-${brand}`} 
                    checked={form.carBrands.includes(brand)}
                    onCheckedChange={() => handleCarBrandToggle(brand)}
                    className="text-primary border-primary/30"
                  />
                  <label
                    htmlFor={`brand-${brand}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {brand}
                  </label>
                </div>
              ))}
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="brand-other" 
                  checked={form.carBrands.includes("სხვა")}
                  onCheckedChange={handleOtherBrandToggle}
                  className="text-primary border-primary/30"
                />
                <label
                  htmlFor="brand-other"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  სხვა
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-4">
            <Switch
              id="onSiteService"
              checked={form.onSiteService}
              onCheckedChange={(checked) => handleSwitchChange(checked, "onSiteService")}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="onSiteService" className="cursor-pointer">
              ადგილზე მისვლის სერვისი
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(checked) => handleSwitchChange(checked, "isActive")}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              აქტიური სერვისი
            </Label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-6">
            <Button type="button" variant="outline" onClick={onCancel} className="border-primary/30 hover:bg-primary/10">
              გაუქმება
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-primary hover:bg-primary-light"
            >
              {loading ? "მიმდინარეობს..." : "შენახვა"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceForm;
