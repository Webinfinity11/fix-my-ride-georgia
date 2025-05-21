
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CustomerProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    city: user?.city || "",
    district: user?.district || "",
    street: user?.street || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          city: form.city,
          district: form.district,
          street: form.street,
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      toast.success("პროფილი წარმატებით განახლდა");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(`პროფილის განახლება ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ჩემი პროფილი</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>რედაქტირება</Button>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(false)}>გაუქმება</Button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">სახელი</Label>
            <Input
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">გვარი</Label>
            <Input
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">ელ-ფოსტა</Label>
            <Input
              id="email"
              value={user?.email || ""}
              readOnly
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">ტელეფონი</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">ქალაქი</Label>
            <Input
              id="city"
              name="city"
              value={form.city || ""}
              onChange={handleChange}
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="district">უბანი</Label>
            <Input
              id="district"
              name="district"
              value={form.district || ""}
              onChange={handleChange}
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
            />
          </div>
          
          <div className="col-span-2 space-y-2">
            <Label htmlFor="street">მისამართი</Label>
            <Input
              id="street"
              name="street"
              value={form.street || ""}
              onChange={handleChange}
              readOnly={!isEditing}
              className={!isEditing ? "bg-muted" : ""}
            />
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

export default CustomerProfile;
