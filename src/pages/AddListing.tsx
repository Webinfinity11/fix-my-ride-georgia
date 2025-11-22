import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wrench, Car, Sparkles, Briefcase } from "lucide-react";
import { LeadForm } from "@/components/forms/LeadForm";
import SEOHead from "@/components/seo/SEOHead";

const AddListing = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"service" | "drive" | "laundry" | "vacancy">("service");

  const listings = [
    {
      id: "service",
      type: "service" as const,
      icon: Wrench,
      title: "სერვისის დამატება",
      description: "დაამატე შენი ავტოსერვისი და მიიღე მეტი კლიენტი",
      gradient: "from-blue-500/10 to-blue-600/10",
      iconColor: "text-blue-600",
    },
    {
      id: "drive",
      type: "drive" as const,
      icon: Car,
      title: "დრაივის დამატება",
      description: "დაამატე შენი დრაივი პლატფორმაზე",
      gradient: "from-green-500/10 to-green-600/10",
      iconColor: "text-green-600",
    },
    {
      id: "laundry",
      type: "laundry" as const,
      icon: Sparkles,
      title: "სამრეცხაოს დამატება",
      description: "დაამატე შენი ავტომრეცხავი და გაზარდე ვიზიტორები",
      gradient: "from-purple-500/10 to-purple-600/10",
      iconColor: "text-purple-600",
    },
    {
      id: "vacancy",
      type: "vacancy" as const,
      icon: Briefcase,
      title: "ვაკანსიის დამატება",
      description: "მოძებნე კვალიფიციური თანამშრომელი",
      gradient: "from-orange-500/10 to-orange-600/10",
      iconColor: "text-orange-600",
    },
  ];

  const handleCardClick = (type: typeof selectedType) => {
    setSelectedType(type);
    setDialogOpen(true);
  };

  const getFormTitle = () => {
    switch (selectedType) {
      case "service":
        return "სერვისის დამატების განაცხადი";
      case "drive":
        return "დრაივის დამატების განაცხადი";
      case "laundry":
        return "სამრეცხაოს დამატების განაცხადი";
      case "vacancy":
        return "ვაკანსიის დამატების განაცხადი";
    }
  };

  const getFormDescription = () => {
    switch (selectedType) {
      case "service":
        return "შეავსე ფორმა და ჩვენი გუნდი მალე დაგიკავშირდება";
      case "drive":
        return "შეავსე ფორმა და დაამატე შენი დრაივი";
      case "laundry":
        return "შეავსე ფორმა და დაამატე შენი სამრეცხაო";
      case "vacancy":
        return "შეავსე ფორმა და დაამატე ვაკანსია";
    }
  };

  return (
    <Layout>
      <SEOHead
        title="დაამატე უფასოდ | FixUp"
        description="დაამატე შენი ავტოსერვისი, სამრეცხაო, დრაივი ან ვაკანსია უფასოდ FixUp პლატფორმაზე"
        keywords="ავტოსერვისის დამატება, დრაივის დამატება, სამრეცხაოს დამატება, ვაკანსიის დამატება"
      />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            დაამატე უფასოდ
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            შეავსე მარტივი ფორმა და დაამატე შენი სერვისი, დრაივი, სამრეცხაო ან ვაკანსია
            FixUp-ის პლატფორმაზე სრულიად უფასოდ
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {listings.map((listing) => {
            const Icon = listing.icon;
            return (
              <Card
                key={listing.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group"
                onClick={() => handleCardClick(listing.type)}
              >
                <CardContent className="p-6">
                  <div className={`bg-gradient-to-br ${listing.gradient} rounded-lg p-6 mb-4 transition-transform group-hover:scale-105`}>
                    <Icon className={`h-12 w-12 ${listing.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
                  <p className="text-muted-foreground">{listing.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">{getFormTitle()}</DialogTitle>
          <DialogDescription className="sr-only">{getFormDescription()}</DialogDescription>
          <LeadForm
            leadType={selectedType}
            title={getFormTitle()}
            description={getFormDescription()}
            onSuccess={() => {
              setTimeout(() => setDialogOpen(false), 2000);
            }}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AddListing;
