import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MechanicMobileHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="md:hidden bg-background border-b sticky top-0 z-40 mb-3">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold">ხელოსნის პანელი</h1>
        <Button
          size="sm"
          onClick={() => navigate("/add-service")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>დამატება</span>
        </Button>
      </div>
    </div>
  );
};

export default MechanicMobileHeader;
