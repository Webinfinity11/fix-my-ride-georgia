
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Clock, Phone, DollarSign, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SendMessageButton } from "@/components/mechanic/SendMessageButton";

interface Service {
  id: number; // Changed from string to number to match database
  name: string;
  description: string;
  price_from: number;
  price_to: number;
  mechanic_id: string;
  city: string;
  district: string;
  rating: number;
  review_count: number;
  mechanic_profiles: {
    profiles: {
      first_name: string;
      last_name: string;
      phone: string;
      avatar_url: string;
    };
  };
}

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("mechanic_services")
          .select(`
            *,
            mechanic_profiles!inner(
              profiles!inner(
                first_name,
                last_name,
                phone,
                avatar_url
              )
            )
          `)
          .eq("id", parseInt(id)) // Convert string to number for database query
          .single();

        if (error) throw error;
        setService(data); // Now the types match correctly
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">სერვისი ვერ მოიძებნა</h2>
              <p className="text-gray-600">მოთხოვნილი სერვისი არ არსებობს.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const mechanicName = `${service.mechanic_profiles.profiles.first_name} ${service.mechanic_profiles.profiles.last_name}`;
  const location = `${service.city}, ${service.district}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Service Info */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">{service.name}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{service.rating}</span>
                    <span>({service.review_count} შეფასება)</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">აღწერა</h3>
                    <p className="text-gray-600">{service.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">
                        {service.price_from} - {service.price_to} ₾
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mechanic Info Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>ხელოსანი</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={service.mechanic_profiles.profiles.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {service.mechanic_profiles.profiles.first_name.charAt(0)}
                      {service.mechanic_profiles.profiles.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{mechanicName}</h3>
                    <p className="text-sm text-gray-600">{location}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{service.rating}</span>
                    <span className="text-sm text-gray-600">({service.review_count} შეფასება)</span>
                  </div>
                </div>

                <Separator />

                {/* Contact Buttons */}
                <div className="space-y-2">
                  {service.mechanic_profiles.profiles.phone && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`tel:${service.mechanic_profiles.profiles.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        დარეკვა
                      </a>
                    </Button>
                  )}
                  
                  <SendMessageButton 
                    mechanicId={service.mechanic_id}
                    mechanicName={mechanicName}
                    variant="default"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ServiceDetail;
