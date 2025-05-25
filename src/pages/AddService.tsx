
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EnhancedCategorySelector from "@/components/forms/EnhancedCategorySelector";
import EnhancedCarBrandsSelector from "@/components/forms/EnhancedCarBrandsSelector";

const AddService = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: null as number | null,
    price_from: "",
    price_to: "",
    estimated_hours: "",
    car_brands: [] as string[],
    on_site_service: false,
    accepts_card_payment: false,
    accepts_cash_payment: true,
    working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    city: "",
    district: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("გთხოვთ გაიაროთ ავტორიზაცია");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("სერვისის სახელი სავალდებულოა");
      return;
    }

    if (!formData.category_id) {
      toast.error("კატეგორიის არჩევა სავალდებულოა");
      return;
    }

    setLoading(true);

    try {
      const serviceData = {
        mechanic_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id,
        price_from: formData.price_from ? parseFloat(formData.price_from) : null,
        price_to: formData.price_to ? parseFloat(formData.price_to) : null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        car_brands: formData.car_brands.length > 0 ? formData.car_brands : null,
        on_site_service: formData.on_site_service,
        accepts_card_payment: formData.accepts_card_payment,
        accepts_cash_payment: formData.accepts_cash_payment,
        working_days: formData.working_days,
        working_hours_start: formData.working_hours_start,
        working_hours_end: formData.working_hours_end,
        city: formData.city.trim() || null,
        district: formData.district.trim() || null,
        is_active: true
      };

      const { error } = await supabase
        .from("mechanic_services")
        .insert([serviceData]);

      if (error) throw error;

      toast.success("სერვისი წარმატებით დაემატა");
      navigate("/dashboard/services");
    } catch (error: any) {
      console.error("Error creating service:", error);
      toast.error(`სერვისის დამატებისას შეცდომა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = [
    { id: "monday", label: "ორშაბათი" },
    { id: "tuesday", label: "სამშაბათი" },
    { id: "wednesday", label: "ოთხშაბათი" },
    { id: "thursday", label: "ხუთშაბათი" },
    { id: "friday", label: "პარასკევი" },
    { id: "saturday", label: "შაბათი" },
    { id: "sunday", label: "კვირა" }
  ];

  const toggleWorkingDay = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      working_days: prev.working_days.includes(dayId)
        ? prev.working_days.filter(d => d !== dayId)
        : [...prev.working_days, dayId]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/services")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              სერვისებზე დაბრუნება
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ახალი სერვისის დამატება</h1>
            <p className="text-gray-600">შეავსეთ ინფორმაცია თქვენი ახალი სერვისის შესახებ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>ძირითადი ინფორმაცია</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">სერვისის სახელი *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="მაგ: ძრავის დიაგნოსტიკა"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">აღწერა</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="სერვისის დეტალური აღწერა..."
                    rows={4}
                  />
                </div>

                <EnhancedCategorySelector
                  selectedCategoryId={formData.category_id}
                  onCategorySelect={(categoryId) => setFormData(prev => ({ ...prev, category_id: categoryId }))}
                />
              </CardContent>
            </Card>

            {/* Pricing & Time */}
            <Card>
              <CardHeader>
                <CardTitle>ფასები და დრო</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_from">ფასი დან (₾)</Label>
                    <Input
                      id="price_from"
                      type="number"
                      value={formData.price_from}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_from: e.target.value }))}
                      placeholder="50"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price_to">ფასი მდე (₾)</Label>
                    <Input
                      id="price_to"
                      type="number"
                      value={formData.price_to}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_to: e.target.value }))}
                      placeholder="200"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimated_hours">სავარაუდო დრო (საათი)</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    placeholder="2"
                    min="1"
                    max="24"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Car Brands */}
            <Card>
              <CardHeader>
                <CardTitle>მანქანის მარკები</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedCarBrandsSelector
                  selectedBrands={formData.car_brands}
                  onBrandsChange={(brands) => setFormData(prev => ({ ...prev, car_brands: brands }))}
                />
              </CardContent>
            </Card>

            {/* Service Options */}
            <Card>
              <CardHeader>
                <CardTitle>სერვისის პარამეტრები</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="on_site_service">ადგილზე მისვლა</Label>
                    <Switch
                      id="on_site_service"
                      checked={formData.on_site_service}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, on_site_service: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="accepts_card_payment">ბარათით გადახდა</Label>
                    <Switch
                      id="accepts_card_payment"
                      checked={formData.accepts_card_payment}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accepts_card_payment: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="accepts_cash_payment">ნაღდი გადახდა</Label>
                    <Switch
                      id="accepts_cash_payment"
                      checked={formData.accepts_cash_payment}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accepts_cash_payment: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle>სამუშაო გრაფიკი</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">სამუშაო დღეები</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {weekDays.map((day) => (
                      <div key={day.id} className="flex items-center space-x-2">
                        <Switch
                          id={day.id}
                          checked={formData.working_days.includes(day.id)}
                          onCheckedChange={() => toggleWorkingDay(day.id)}
                        />
                        <Label htmlFor={day.id} className="text-sm">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="working_hours_start">დაწყების საათი</Label>
                    <Input
                      id="working_hours_start"
                      type="time"
                      value={formData.working_hours_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, working_hours_start: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="working_hours_end">დასრულების საათი</Label>
                    <Input
                      id="working_hours_end"
                      type="time"
                      value={formData.working_hours_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, working_hours_end: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>მდებარეობა</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">ქალაქი</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="თბილისი"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="district">უბანი</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      placeholder="საბურთალო"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/services")}
                disabled={loading}
                className="flex-1"
              >
                გაუქმება
              </Button>
              
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    შენახვა...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    სერვისის შენახვა
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AddService;
