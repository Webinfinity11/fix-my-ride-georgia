import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DollarSign, Car, Shield } from "lucide-react";

interface ServicePageNavigationProps {
  currentPage?: "leasing" | "dealers" | "insurance";
}

export function ServicePageNavigation({ currentPage }: ServicePageNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const services = [
    {
      id: "leasing",
      label: "ლიზინგი",
      path: "/leasing",
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
      glowColor: "from-green-400 via-green-500 to-green-600",
      shadowColor: "shadow-green-500/50",
    },
    {
      id: "dealers",
      label: "დილერები",
      path: "/dealers",
      icon: Car,
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      glowColor: "from-blue-400 via-blue-500 to-blue-600",
      shadowColor: "shadow-blue-500/50",
    },
    {
      id: "insurance",
      label: "დაზღვევა",
      path: "/insurance",
      icon: Shield,
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
      glowColor: "from-purple-400 via-purple-500 to-purple-600",
      shadowColor: "shadow-purple-500/50",
    },
  ];

  return (
    <div className="flex flex-row gap-2 sm:gap-3 lg:gap-4 justify-start sm:justify-center items-center mb-8 lg:mb-12 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
      {services.map((service) => {
        const Icon = service.icon;
        const isActive = currentPage === service.id;

        return (
          <Button
            key={service.id}
            onClick={() => navigate(service.path)}
            variant={isActive ? "default" : "outline"}
            size="lg"
            className={`
              ${isActive ? 'active-tab-border' : ''}
              flex-shrink-0
              snap-center
              min-w-[110px] sm:min-w-[140px] md:min-w-[160px]
              px-3 sm:px-4 md:px-6
              py-2.5 sm:py-3
              ${
                isActive
                  ? `bg-gradient-to-r ${service.color} ${service.hoverColor} text-white shadow-lg`
                  : "bg-background border-2 hover:border-primary/50"
              }
              transition-all duration-200
              touch-manipulation
              active:scale-95
            `}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-base">{service.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
