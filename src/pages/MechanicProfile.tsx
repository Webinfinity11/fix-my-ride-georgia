
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Phone, Clock, DollarSign, Award, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SendMessageButton } from "@/components/mechanic/SendMessageButton";

interface MechanicProfile {
  id: string;
  description: string;
  specialization: string;
  experience_years: number;
  hourly_rate: number;
  rating: number;
  review_count: number;
  is_mobile: boolean;
  accepts_card_payment: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
    city: string;
    district: string;
    avatar_url: string;
  };
}

const MechanicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [mechanic, setMechanic] = useState<MechanicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMechanic = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("mechanic_profiles")
          .select(`
            *,
            profiles!inner(
              first_name,
              last_name,
              phone,
              city,
              district,
              avatar_url
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        setMechanic(data);
      } catch (error) {
        console.error("Error fetching mechanic:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMechanic();
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

  if (!mechanic) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">ხელოსანი ვერ მოიძებნა</h2>
              <p className="text-gray-600">მოთხოვნილი ხელოსანი არ არსებობს.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const mechanicName = `${mechanic.profiles.first_name} ${mechanic.profiles.last_name}`;
  const location = `${mechanic.profiles.city}, ${mechanic.profiles.district}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={mechanic.profiles.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {mechanic.profiles.first_name.charAt(0)}
                      {mechanic.profiles.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{mechanicName}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{mechanic.rating}</span>
                        <span>({mechanic.review_count} შეფასება)</span>
                      </div>
                    </div>
                    {mechanic.specialization && (
                      <Badge variant="secondary" className="mb-2">
                        {mechanic.specialization}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mechanic.description && (
                    <div>
                      <h3 className="font-semibold mb-2">ჩემ შესახებ</h3>
                      <p className="text-gray-600">{mechanic.description}</p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mechanic.experience_years && (
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        <span>{mechanic.experience_years} წლის გამოცდილება</span>
                      </div>
                    )}
                    
                    {mechanic.hourly_rate && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span>{mechanic.hourly_rate} ₾/საათი</span>
                      </div>
                    )}
                    
                    {mechanic.is_mobile && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        <span>ადგილზე მისვლა</span>
                      </div>
                    )}
                    
                    {mechanic.accepts_card_payment && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        <span>ბარათით გადახდა</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>კონტაქტი</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{mechanic.rating}</span>
                    <span className="text-sm text-gray-600">({mechanic.review_count} შეფასება)</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{location}</span>
                  </div>
                </div>

                <Separator />

                {/* Contact Buttons */}
                <div className="space-y-2">
                  {mechanic.profiles.phone && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`tel:${mechanic.profiles.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        დარეკვა
                      </a>
                    </Button>
                  )}
                  
                  <SendMessageButton 
                    mechanicId={mechanic.id}
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

export default MechanicProfile;
