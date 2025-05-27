import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, DollarSign, Clock, Calendar, Car, CreditCard, Banknote, MapPin } from "lucide-react";
import PhotoUpload from "@/components/forms/PhotoUpload";
import LocationSelector from "@/components/forms/LocationSelector";
import MapLocationPicker from "@/components/forms/MapLocationPicker";

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
  on_site_service?: boolean;
  photos?: string[];
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

type ServiceCategoryType = {
  id: number;
  name: string;
  description: string | null;
};

interface ServiceFormProps {
  service?: ServiceType | null;
  categories: ServiceCategoryType[];
  onSubmit: () => void;
  onCancel: () => void;
}

const weekDays = [
  { key: "monday", label: "ორშაბათი" },
  { key: "tuesday", label: "სამშაბათი" },
  { key: "wednesday", label: "ოთხშაბათი" },
  { key: "thursday", label: "ხუთშაბათი" },
  { key: "friday", label: "პარასკევი" },
  { key: "saturday", label: "შაბათი" },
  { key: "sunday", label: "კვირა" }
];

const commonCarBrands = [
  "BMW", "Mercedes-Benz", "Audi", "Toyota", "Honda", "Nissan", "Hyundai", 
  "Kia", "Volkswagen", "Ford", "Chevrolet", "Mazda", "Subaru", "Lexus",
  "Infiniti", "Acura", "Jeep", "Land Rover", "Porsche", "Mitsubishi",
  "Opel", "Peugeot", "Renault", "Citroen", "Fiat", "Volvo", "Saab",
  "Skoda", "Seat", "Alfa Romeo", "Lancia", "Ferrari", "Lamborghini",
  "Maserati", "Bentley", "Rolls-Royce", "Aston Martin", "McLaren",
  "Bugatti", "Lotus", "Jaguar", "Mini", "Smart", "Tesla", "Lucid",
  "Rivian", "Genesis", "Cadillac", "Lincoln", "Buick", "GMC", "Ram"
];

const ServiceForm = ({ service, categories, onSubmit, onCancel }: ServiceFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    category_id: service?.category_id || "",
    price_from: service?.price_from || "",
    price_to: service?.price_to || "",
    estimated_hours: service?.estimated_hours || "",
    accepts_card_payment: service?.accepts_card_payment || false,
    accepts_cash_payment: service?.accepts_cash_payment ?? true,
    working_days: service?.working_days || ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours_start: service?.working_hours_start || "09:00",
    working_hours_end: service?.working_hours_end || "18:00",
    car_brands: service?.car_brands || [],
    on_site_service: service?.on_site_service || false,
    photos: service?.photos || [],
    city: service?.city || "",
    district: service?.district || "",
    address: service?.address || "",
    latitude: service?.latitude || null,
    longitude: service?.longitude || null
  });

  const [selectAllBrands, setSelectAllBrands] = useState(false);
  const [otherBrand, setOtherBrand] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  useEffect(() => {
    // Check if all brands are selected
    setSelectAllBrands(formData.car_brands.length === commonCarBrands.length);
  }, [formData.car_brands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // ქალაქის ვალიდაცია
    if (!formData.city) {
      toast.error("გთხოვთ აირჩიოთ ქალაქი");
      return;
    }

    setLoading(true);
    try {
      const serviceData = {
        mechanic_id: user.id,
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id ? parseInt(formData.category_id.toString()) : null,
        price_from: formData.price_from ? parseFloat(formData.price_from.toString()) : null,
        price_to: formData.price_to ? parseFloat(formData.price_to.toString()) : null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours.toString()) : null,
        accepts_card_payment: formData.accepts_card_payment,
        accepts_cash_payment: formData.accepts_cash_payment,
        working_days: formData.working_days,
        working_hours_start: formData.working_hours_start,
        working_hours_end: formData.working_hours_end,
        car_brands: formData.car_brands,
        on_site_service: formData.on_site_service,
        photos: formData.photos,
        city: formData.city,
        district: formData.district || null,
        address: formData.address || null,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      if (service) {
        const { error } = await supabase
          .from("mechanic_services")
          .update(serviceData)
          .eq("id", service.id)
          .eq("mechanic_id", user.id);

        if (error) throw error;
        toast.success("სერვისი წარმატებით განახლდა");
      } else {
        const { error } = await supabase
          .from("mechanic_services")
          .insert([serviceData]);

        if (error) throw error;
        toast.success("სერვისი წარმატებით დაემატა");
      }

      onSubmit();
    } catch (error: any) {
      toast.error(`შეცდომა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleWorkingDayToggle = (day: string) => {
    const newWorkingDays = formData.working_days.includes(day)
      ? formData.working_days.filter(d => d !== day)
      : [...formData.working_days, day];
    
    handleInputChange("working_days", newWorkingDays);
  };

  const handleCarBrandToggle = (brand: string) => {
    const newCarBrands = formData.car_brands.includes(brand)
      ? formData.car_brands.filter(b => b !== brand)
      : [...formData.car_brands, brand];
    
    handleInputChange("car_brands", newCarBrands);
  };

  const handleSelectAllBrands = (checked: boolean) => {
    setSelectAllBrands(checked);
    if (checked) {
      handleInputChange("car_brands", [...commonCarBrands]);
    } else {
      handleInputChange("car_brands", []);
    }
  };

  const handleOtherBrand = () => {
    if (otherBrand.trim()) {
      const trimmedBrand = otherBrand.trim();
      if (!formData.car_brands.includes(trimmedBrand)) {
        handleInputChange("car_brands", [...formData.car_brands, trimmedBrand]);
        setOtherBrand("");
        setShowOtherInput(false);
        toast.success(`"${trimmedBrand}" დაემატა`);
      } else {
        toast.error("ეს მარკა უკვე არჩეულია");
      }
    }
  };

  const handleCityChange = (city: string) => {
    handleInputChange("city", city);
    if (city !== "თბილისი") {
      handleInputChange("district", "");
    }
  };

  const handleDistrictChange = (district: string) => {
    handleInputChange("district", district);
  };

  const removeBrand = (brandToRemove: string) => {
    const newCarBrands = formData.car_brands.filter(brand => brand !== brandToRemove);
    handleInputChange("car_brands", newCarBrands);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="hover:bg-primary/10"
            >
              <ArrowLeft size={16} />
            </Button>
            {service ? "სერვისის რედაქტირება" : "ახალი სერვისის დამატება"}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">სერვისის დასახელება *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="მაგ.: ძრავის დიაგნოსტიკა"
                required
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">კატეგორია *</Label>
              <Select
                value={formData.category_id.toString()}
                onValueChange={(value) => handleInputChange("category_id", parseInt(value))}
              >
                <SelectTrigger className="border-primary/20 focus-visible:ring-primary">
                  <SelectValue placeholder="აირჩიეთ კატეგორია" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-1">
              <MapPin size={14} />
              მდებარეობა *
            </Label>
            <LocationSelector
              selectedCity={formData.city}
              selectedDistrict={formData.district}
              onCityChange={handleCityChange}
              onDistrictChange={handleDistrictChange}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-1">
              <MapPin size={14} />
              ზუსტი მისამართი და რუკაზე მდებარეობა
            </Label>
            
            <div className="space-y-2">
              <Label htmlFor="address">ზუსტი მისამართი</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="მაგ.: ყაზბეგის ავენუ 15, მე-2 სართული"
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label>რუკაზე მდებარეობა</Label>
              <MapLocationPicker
                latitude={formData.latitude || undefined}
                longitude={formData.longitude || undefined}
                onLocationChange={handleLocationChange}
                interactive={true}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">აღწერა</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="სერვისის დეტალური აღწერა..."
              rows={4}
              className="border-primary/20 focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_from" className="flex items-center gap-1">
                <DollarSign size={14} />
                ფასი (დან)
              </Label>
              <Input
                id="price_from"
                type="number"
                value={formData.price_from}
                onChange={(e) => handleInputChange("price_from", e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_to" className="flex items-center gap-1">
                <DollarSign size={14} />
                ფასი (მდე)
              </Label>
              <Input
                id="price_to"
                type="number"
                value={formData.price_to}
                onChange={(e) => handleInputChange("price_to", e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours" className="flex items-center gap-1">
                <Clock size={14} />
                სავარაუდო დრო (საათები)
              </Label>
              <Input
                id="estimated_hours"
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => handleInputChange("estimated_hours", e.target.value)}
                placeholder="0"
                min="0"
                className="border-primary/20 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">გადახდის მეთოდები</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accepts_cash"
                  checked={formData.accepts_cash_payment}
                  onCheckedChange={(checked) => handleInputChange("accepts_cash_payment", checked)}
                />
                <Label htmlFor="accepts_cash" className="flex items-center gap-1 text-sm">
                  <Banknote size={14} className="text-green-600" />
                  ნაღდი ანგარიშსწორება
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accepts_card"
                  checked={formData.accepts_card_payment}
                  onCheckedChange={(checked) => handleInputChange("accepts_card_payment", checked)}
                />
                <Label htmlFor="accepts_card" className="flex items-center gap-1 text-sm">
                  <CreditCard size={14} className="text-blue-600" />
                  ბარათით გადახდა
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="on_site"
                  checked={formData.on_site_service}
                  onCheckedChange={(checked) => handleInputChange("on_site_service", checked)}
                />
                <Label htmlFor="on_site" className="text-sm">
                  ადგილზე მისვლის სერვისი
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-1">
              <Calendar size={14} />
              სამუშაო გრაფიკი
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weekDays.map(day => (
                <div key={day.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.key}
                    checked={formData.working_days.includes(day.key)}
                    onCheckedChange={() => handleWorkingDayToggle(day.key)}
                  />
                  <Label htmlFor={day.key} className="text-sm">{day.label}</Label>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">დაწყების დრო</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.working_hours_start}
                  onChange={(e) => handleInputChange("working_hours_start", e.target.value)}
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">დასრულების დრო</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.working_hours_end}
                  onChange={(e) => handleInputChange("working_hours_end", e.target.value)}
                  className="border-primary/20 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-1">
              <Car size={14} />
              მანქანის მარკები
            </Label>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select_all_brands"
                  checked={selectAllBrands}
                  onCheckedChange={handleSelectAllBrands}
                />
                <Label htmlFor="select_all_brands" className="text-sm font-medium">ყველას არჩევა</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOtherInput(!showOtherInput)}
                  className="border-primary/20 hover:bg-primary/5"
                >
                  სხვა მარკა
                </Button>
              </div>
            </div>

            {showOtherInput && (
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="ჩაწერეთ მანქანის მარკა"
                  value={otherBrand}
                  onChange={(e) => setOtherBrand(e.target.value)}
                  className="border-primary/20 focus-visible:ring-primary"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleOtherBrand();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={handleOtherBrand} 
                  size="sm"
                  className="bg-primary hover:bg-primary-light"
                >
                  დამატება
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonCarBrands.map(brand => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand}
                    checked={formData.car_brands.includes(brand)}
                    onCheckedChange={() => handleCarBrandToggle(brand)}
                  />
                  <Label htmlFor={brand} className="text-sm">{brand}</Label>
                </div>
              ))}
            </div>
            
            {formData.car_brands.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">არჩეული მარკები ({formData.car_brands.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.car_brands.map(brand => (
                    <Badge key={brand} variant="outline" className="bg-muted/50 flex items-center gap-1">
                      {brand}
                      <button
                        type="button"
                        onClick={() => removeBrand(brand)}
                        className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="ამოღება"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <PhotoUpload
            photos={formData.photos}
            onPhotosChange={(photos) => handleInputChange("photos", photos)}
            mechanicId={user?.id || ""}
            maxPhotos={5}
            bucketName="service-photos"
          />

          <div className="flex gap-3 pt-6 border-t border-primary/10">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-primary/20 hover:bg-primary/5"
            >
              გაუქმება
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.city}
              className="bg-primary hover:bg-primary-light transition-colors"
            >
              {loading ? "მუშავდება..." : service ? "განახლება" : "დამატება"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceForm;
