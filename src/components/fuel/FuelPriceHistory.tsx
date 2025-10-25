import { Card } from "@/components/ui/card";
import { TrendingUp, Clock } from "lucide-react";

const FuelPriceHistory = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">ფასების ისტორია</h3>
      </div>

      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
        <h4 className="text-lg font-semibold mb-2">მალე მოვა</h4>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          საწვავის ფასების ისტორიული მონაცემები და ტრენდების ანალიზი მალე ხელმისაწვდომი იქნება
        </p>
      </div>
    </Card>
  );
};

export default FuelPriceHistory;
