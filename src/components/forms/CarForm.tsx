
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type CarType = {
  id: number;
  make: string;
  model: string;
  year: number;
  engine?: string | null;
  transmission?: string | null;
  vin?: string | null;
};

interface CarFormProps {
  car: CarType | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const CarForm = ({ car, onSubmit, onCancel }: CarFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    engine: "",
    transmission: "",
    vin: "",
  });

  useEffect(() => {
    if (car) {
      setForm({
        make: car.make,
        model: car.model,
        year: car.year,
        engine: car.engine || "",
        transmission: car.transmission || "",
        vin: car.vin || "",
      });
    }
  }, [car]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (value: string) => {
    setForm((prev) => ({ ...prev, year: parseInt(value) }));
  };

  const handleTransmissionChange = (value: string) => {
    setForm((prev) => ({ ...prev, transmission: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      if (!form.make || !form.model || !form.year) {
        throw new Error("გთხოვთ შეავსოთ აუცილებელი ველები");
      }
      
      if (car) {
        // Update existing car
        const { error } = await supabase
          .from("cars")
          .update({
            make: form.make,
            model: form.model,
            year: form.year,
            engine: form.engine || null,
            transmission: form.transmission || null,
            vin: form.vin || null,
          })
          .eq("id", car.id)
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        toast.success("ავტომობილი განახლდა");
      } else {
        // Create new car
        const { error } = await supabase
          .from("cars")
          .insert({
            user_id: user.id,
            make: form.make,
            model: form.model,
            year: form.year,
            engine: form.engine || null,
            transmission: form.transmission || null,
            vin: form.vin || null,
          });
        
        if (error) throw error;
        
        toast.success("ავტომობილი დაემატა");
      }
      
      onSubmit();
    } catch (error: any) {
      toast.error(`ავტომობილის შენახვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {car ? "ავტომობილის რედაქტირება" : "ახალი ავტომობილის დამატება"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">მარკა</Label>
              <Input
                id="make"
                name="make"
                value={form.make}
                onChange={handleChange}
                placeholder="მაგ: Toyota"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">მოდელი</Label>
              <Input
                id="model"
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="მაგ: Camry"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">წელი</Label>
              <Select
                value={form.year.toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="აირჩიეთ წელი" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="engine">ძრავი</Label>
              <Input
                id="engine"
                name="engine"
                value={form.engine}
                onChange={handleChange}
                placeholder="მაგ: 2.5L"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transmission">ტრანსმისია</Label>
              <Select
                value={form.transmission}
                onValueChange={handleTransmissionChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="აირჩიეთ ტრანსმისია" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">ავტომატური</SelectItem>
                  <SelectItem value="Manual">მექანიკური</SelectItem>
                  <SelectItem value="CVT">CVT</SelectItem>
                  <SelectItem value="Semi-automatic">ნახევრად ავტომატური</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vin">VIN კოდი</Label>
              <Input
                id="vin"
                name="vin"
                value={form.vin}
                onChange={handleChange}
                placeholder="მაგ: 4T1BF1FK5CU123456"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              გაუქმება
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "მიმდინარეობს..." : "შენახვა"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CarForm;
