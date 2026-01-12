import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreatePartsOrder } from "@/hooks/usePartsOrders";
import { Loader2, Package, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";

const OrderParts = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    car_brand: "",
    car_model: "",
    car_year: "",
    engine_volume: "",
    part_name: "",
    part_description: "",
  });

  const createOrder = useCreatePartsOrder();

  const { data: carBrands } = useQuery({
    queryKey: ["car-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_brands")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrder.mutateAsync(formData);
    setFormData({
      full_name: "",
      phone: "",
      car_brand: "",
      car_model: "",
      car_year: "",
      engine_volume: "",
      part_name: "",
      part_description: "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-orange-50 pb-[70px] md:pb-0">
      <SEOHead
        title="ნაწილის შეკვეთა | FixUp"
        description="შეუკვეთეთ ავტონაწილი მარტივად და სწრაფად. ჩვენ მოვძებნით საუკეთესო ფასს თქვენთვის."
        keywords="ავტონაწილი, ნაწილის შეკვეთა, ავტომობილის ნაწილები, საქართველო"
        url="https://fixup.ge/order-parts"
        canonical="https://fixup.ge/order-parts"
      />
      
      <Header />

      <main className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              მთავარ გვერდზე დაბრუნება
            </Link>

            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full w-fit mb-4">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl">ნაწილის შეკვეთა</CardTitle>
                <CardDescription className="text-base">
                  შეავსეთ ფორმა და ჩვენ დაგიკავშირდებით უმოკლეს დროში
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">სახელი გვარი *</Label>
                      <Input
                        id="full_name"
                        required
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">ტელეფონის ნომერი *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>მანქანის მარკა *</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {carBrands?.map((brand) => (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, car_brand: brand.name })
                          }
                          className={`
                            p-3 rounded-lg border-2 transition-all
                            ${
                              formData.car_brand === brand.name
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }
                          `}
                        >
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              className="w-full h-8 object-contain"
                            />
                          ) : (
                            <span className="text-xs font-medium">{brand.name}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="car_model">მოდელი *</Label>
                      <Input
                        id="car_model"
                        required
                        value={formData.car_model}
                        onChange={(e) =>
                          setFormData({ ...formData, car_model: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="car_year">წელი</Label>
                      <Input
                        id="car_year"
                        placeholder="მაგ: 2020"
                        value={formData.car_year}
                        onChange={(e) =>
                          setFormData({ ...formData, car_year: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="engine_volume">ძრავის მოცულობა</Label>
                      <Input
                        id="engine_volume"
                        placeholder="მაგ: 2.0"
                        value={formData.engine_volume}
                        onChange={(e) =>
                          setFormData({ ...formData, engine_volume: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="part_name">ნაწილის დასახელება *</Label>
                    <Input
                      id="part_name"
                      required
                      placeholder="მაგ: საჭე, ფილტრი, ზეთი..."
                      value={formData.part_name}
                      onChange={(e) =>
                        setFormData({ ...formData, part_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="part_description">აღწერა და დამატებითი დეტალები</Label>
                    <Textarea
                      id="part_description"
                      rows={4}
                      placeholder="დეტალური ინფორმაცია ნაწილის შესახებ..."
                      value={formData.part_description}
                      onChange={(e) =>
                        setFormData({ ...formData, part_description: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={createOrder.isPending}
                    className="w-full h-12 text-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                  >
                    {createOrder.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        იგზავნება...
                      </>
                    ) : (
                      "შეკვეთის გაგზავნა"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default OrderParts;
