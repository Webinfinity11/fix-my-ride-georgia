
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Stats = {
  mechanics: number;
  services: number;
  customers: number;
  completedBookings: number;
};

const About = () => {
  const [stats, setStats] = useState<Stats>({
    mechanics: 0,
    services: 0,
    customers: 0,
    completedBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Count mechanics
        const { count: mechanicsCount, error: mechanicsError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "mechanic");
        
        if (mechanicsError) throw mechanicsError;

        // Count customers
        const { count: customersCount, error: customersError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "customer");
          
        if (customersError) throw customersError;

        // Count services
        const { count: servicesCount, error: servicesError } = await supabase
          .from("mechanic_services")
          .select("*", { count: "exact", head: true });
          
        if (servicesError) throw servicesError;

        // Count completed bookings
        const { count: bookingsCount, error: bookingsError } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed");
          
        if (bookingsError) throw bookingsError;

        setStats({
          mechanics: mechanicsCount || 0,
          customers: customersCount || 0,
          services: servicesCount || 0,
          completedBookings: bookingsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm">
            <h1 className="text-3xl font-bold mb-6">ჩვენ შესახებ</h1>
            
            <p className="mb-4">
              ავტოხელოსანი არის პლატფორმა, რომელიც აკავშირებს ავტომფლობელებს კვალიფიციურ ავტომექანიკოსებთან. ჩვენი მისიაა გავამარტივოთ ავტომობილის მოვლისა და შეკეთების პროცესი.
            </p>
            
            <p className="mb-4">
              ჩვენი პლატფორმა საშუალებას აძლევს მომხმარებლებს:
            </p>
            
            <ul className="list-disc pl-6 mb-6">
              <li className="mb-2">მოძებნონ კვალიფიციური ხელოსნები</li>
              <li className="mb-2">მიიღონ დეტალური ინფორმაცია მათი გამოცდილებისა და სპეციალობების შესახებ</li>
              <li className="mb-2">დაჯავშნონ მომსახურება ონლაინ</li>
              <li className="mb-2">დატოვონ და წაიკითხონ შეფასებები</li>
            </ul>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-muted p-4 rounded-lg text-center">
                    <Skeleton className="h-10 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8 bg-primary/5 p-6 rounded-lg">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{stats.mechanics}</p>
                  <p className="text-sm text-muted-foreground">ხელოსანი</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{stats.customers}</p>
                  <p className="text-sm text-muted-foreground">მომხმარებელი</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{stats.services}</p>
                  <p className="text-sm text-muted-foreground">სერვისი</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{stats.completedBookings}</p>
                  <p className="text-sm text-muted-foreground">დასრულებული</p>
                </div>
              </div>
            )}
            
            <h2 className="text-xl font-semibold mb-3">ჩვენი ისტორია</h2>
            <p>
              პლატფორმა შეიქმნა 2025 წელს, როგორც პასუხი მზარდ მოთხოვნაზე გამჭვირვალე და სანდო ავტომობილის შეკეთების სერვისებზე. ჩვენ ვაერთიანებთ ტექნოლოგიას და ავტომობილების შეკეთების ინდუსტრიას, რათა მომხმარებლებს შევუქმნათ უკეთესი გამოცდილება.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
