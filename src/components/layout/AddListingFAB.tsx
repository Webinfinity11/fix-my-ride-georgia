import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const AddListingFAB = () => {
  return (
    <Button
      asChild
      size="lg"
      className="hidden lg:flex fixed bottom-8 right-8 z-40 rounded-full shadow-lg h-14 px-6 hover:scale-105 transition-transform"
    >
      <Link to="/add-listing">
        <Plus className="h-5 w-5 mr-2" />
        <span className="font-medium">დაამატე უფასოდ</span>
      </Link>
    </Button>
  );
};
