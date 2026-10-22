import PersonalProfile from "@/components/dashboard/PersonalProfile";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MechanicProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    description: "",
    experienceYears: "",
    specialization: "",
    hourlyRate: "",
    isMobile: false,
    acceptsCardPayment: false
  });
  
  // Fetch mechanic profile data
  const [profileLoading, setProfileLoading] = useState(true);
  
  useEffect(() => {
    const fetchMechanicProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("mechanic_profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setForm(prev => ({
            ...prev,
            description: data.description || "",
            experienceYears: data.experience_years?.toString() || "",
            specialization: data.specialization || "",
            hourlyRate: data.hourly_rate?.toString() || "",
            isMobile: data.is_mobile || false,
            acceptsCardPayment: data.accepts_card_payment || false
          }));
        }
      } catch (error) {
        console.error("Error fetching mechanic profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchMechanicProfile();
  }, [user?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setForm(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Update mechanic profile
      const { error: mechanicError } = await supabase
        .from("mechanic_profiles")
        .update({
          description: form.description,
          experience_years: form.experienceYears ? parseInt(form.experienceYears) : null,
          specialization: form.specialization,
          hourly_rate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
          is_mobile: form.isMobile,
          accepts_card_payment: form.acceptsCardPayment
        })
        .eq("id", user.id);
      
      if (mechanicError) throw mechanicError;
      
      toast.success("პროფილი წარმატებით განახლდა");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(`პროფილის განახლება ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ჩემი პროფილი</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>პროფესიული მონაცემების შეცვლა</Button>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(false)}>გაუქმება</Button>
        )}
      </div>
      
      <div className="mb-6"><PersonalProfile /></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">პროფესიული ინფორმაცია</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">თქვენ შესახებ</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="მოკლე აღწერა თქვენი გამოცდილების და უნარების შესახებ"
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceYears">გამოცდილება (წლები)</Label>
                <Input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  value={form.experienceYears}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specialization">სპეციალიზაცია</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  placeholder="მაგ: ძრავის შეკეთება, ელექტრონიკა"
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">საათობრივი ტარიფი (GEL)</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isMobile">მობილური სერვისი</Label>
                  <p className="text-sm text-muted-foreground">
                    შეუძლია თუ არა ადგილზე მისვლა
                  </p>
                </div>
                <Switch
                  id="isMobile"
                  checked={form.isMobile}
                  onCheckedChange={(checked) => handleSwitchChange("isMobile", checked)}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="acceptsCardPayment">ბარათით გადახდა</Label>
                  <p className="text-sm text-muted-foreground">
                    იღებს თუ არა ბარათით გადახდას
                  </p>
                </div>
                <Switch
                  id="acceptsCardPayment"
                  checked={form.acceptsCardPayment}
                  onCheckedChange={(checked) => handleSwitchChange("acceptsCardPayment", checked)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </div>
        
        {isEditing && (
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "მიმდინარეობს..." : "შენახვა"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default MechanicProfile;
