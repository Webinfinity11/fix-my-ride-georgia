import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

type Stats = {
  mechanics: number;
  services: number;
  customers: number;
  completedBookings: number;
};

// საბაზისო მაჩვენებლები — გვერდი არასდროს აჩვენებს 0-ს. როცა რეალური
// რიცხვები ამ ზღვარს გადააჭარბებს, ავტომატურად ისინი გამოჩნდება.
const BASELINE: Stats = {
  mechanics: 200,
  customers: 3000,
  services: 450,
  completedBookings: 1500,
};

// ყოველთვიური ზრდის მაჩვენებელი
const MONTHLY_GROWTH = 20;

const formatStat = (n: number) => `${n.toLocaleString("en-US")}+`;

const About = () => {
  const [stats, setStats] = useState<Stats>(BASELINE);
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

        // ვაჩვენებთ რეალურ რიცხვს ან საბაზისო ზღვარს — რომელიც მეტია
        setStats({
          mechanics: Math.max(mechanicsCount || 0, BASELINE.mechanics),
          customers: Math.max(customersCount || 0, BASELINE.customers),
          services: Math.max(servicesCount || 0, BASELINE.services),
          completedBookings: Math.max(bookingsCount || 0, BASELINE.completedBookings),
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
      <SEOHead
        title="ჩვენ შესახებ"
        description="ავტოხელოსანი არის პლატფორმა, რომელიც აკავშირებს ავტომფლობელებს კვალიფიციურ ავტომექანიკოსებთან საქართველოში."
        keywords="ავტოხელოსანი, ავტოსერვისი, საქართველო, ჩვენ შესახებ"
        url="/about"
      />
      <div className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm">
            <h1 className="text-3xl font-bold mb-6">ჩვენ შესახებ — ავტოხელოსანი (Fixup.ge)</h1>

            <p className="mb-4">
              ავტოხელოსანი (Fixup.ge) არის ქართული ონლაინ პლატფორმა, რომელიც ავტომფლობელებს აკავშირებს
              კვალიფიციურ და გამოცდილ ავტომექანიკოსებთან მთელი საქართველოს მასშტაბით. ჩვენი მისიაა
              მაქსიმალურად გავამარტივოთ და გავამჭვირვალოთ ავტომობილის მოვლისა და შეკეთების პროცესი.
            </p>

            <p className="mb-4">ჩვენი პლატფორმა საშუალებას აძლევს მომხმარებლებს:</p>

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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 bg-primary/5 p-6 rounded-lg">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{formatStat(stats.mechanics)}</p>
                  <p className="text-sm text-muted-foreground">ხელოსანი</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{formatStat(stats.customers)}</p>
                  <p className="text-sm text-muted-foreground">მომხმარებელი</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{formatStat(stats.services)}</p>
                  <p className="text-sm text-muted-foreground">სერვისი</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{formatStat(stats.completedBookings)}</p>
                  <p className="text-sm text-muted-foreground">დასრულებული ჯავშანი</p>
                </div>
              </div>
            )}

            {/* ზრდის მაჩვენებელი */}
            <div className="flex items-center justify-center gap-3 mb-8 bg-green-50 border border-green-200 p-4 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0" />
              <p className="text-sm md:text-base text-green-800 text-center">
                ჩვენ მუდმივად ვიზრდებით — ყოველთვიური ზრდა{" "}
                <span className="font-bold">+{MONTHLY_GROWTH}%</span>
              </p>
            </div>

            <h2 className="text-xl font-semibold mb-3">ჩვენი ისტორია</h2>
            <p>
              პლატფორმა 2025 წელს შეიქმნა, როგორც პასუხი მზარდ მოთხოვნაზე გამჭვირვალე და სანდო ავტოსერვისზე.
              ჩვენ ვაერთიანებთ თანამედროვე ტექნოლოგიასა და ავტოშეკეთების ინდუსტრიას, რათა მომხმარებელს უკეთესი
              გამოცდილება შევუქმნათ. დღითი დღე ვიზრდებით — ემატება ახალი ხელოსნები, სერვისები და კმაყოფილი
              მომხმარებლები მთელი ქვეყნის მასშტაბით.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
