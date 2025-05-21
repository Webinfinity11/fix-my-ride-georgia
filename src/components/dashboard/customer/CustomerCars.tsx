
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Car, Edit, Trash2, Plus } from "lucide-react";
import CarForm from "@/components/forms/CarForm";

type CarType = {
  id: number;
  make: string;
  model: string;
  year: number;
  engine?: string | null;
  transmission?: string | null;
  vin?: string | null;
};

const CustomerCars = () => {
  const { user } = useAuth();
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);

  useEffect(() => {
    fetchCars();
  }, [user]);

  const fetchCars = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCars(data || []);
    } catch (error: any) {
      toast.error(`ავტომობილების ჩატვირთვა ვერ მოხერხდა: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (car: CarType) => {
    setEditingCar(car);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ ავტომობილის წაშლა?")) return;

    try {
      const { error } = await supabase
        .from("cars")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      setCars(cars.filter(car => car.id !== id));
      toast.success("ავტომობილი წაიშალა");
    } catch (error: any) {
      toast.error(`ავტომობილის წაშლა ვერ მოხერხდა: ${error.message}`);
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingCar(null);
    fetchCars();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ჩემი ავტომობილები</h1>
        <Button onClick={() => { setEditingCar(null); setShowForm(true); }}>
          <Plus size={16} className="mr-2" />
          დამატება
        </Button>
      </div>

      {showForm ? (
        <CarForm
          car={editingCar}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingCar(null); }}
        />
      ) : (
        <>
          {cars.length === 0 ? (
            <div className="bg-muted p-8 rounded-lg text-center">
              <Car size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">ავტომობილი არ არის</h3>
              <p className="text-muted-foreground mb-4">
                თქვენ ჯერ არ გაქვთ დამატებული ავტომობილი
              </p>
              <Button onClick={() => setShowForm(true)}>
                დაამატეთ პირველი ავტომობილი
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {cars.map((car) => (
                <Card key={car.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium">
                          {car.make} {car.model}
                        </h3>
                        <p className="text-muted-foreground">{car.year}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(car)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(car.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {car.engine && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ძრავი:</span>
                          <span>{car.engine}</span>
                        </div>
                      )}
                      {car.transmission && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ტრანსმისია:</span>
                          <span>{car.transmission}</span>
                        </div>
                      )}
                      {car.vin && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">VIN კოდი:</span>
                          <span className="font-mono">{car.vin}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerCars;
