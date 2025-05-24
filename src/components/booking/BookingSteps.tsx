
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingStep = "service" | "datetime" | "confirmation" | "success";

interface BookingStepsProps {
  currentStep: BookingStep;
}

const steps = [
  { id: "service", name: "სერვისი" },
  { id: "datetime", name: "თარიღი & დრო" },
  { id: "confirmation", name: "დადასტურება" },
];

const BookingSteps = ({ currentStep }: BookingStepsProps) => {
  const getCurrentStepIndex = () => {
    if (currentStep === "success") return steps.length;
    return steps.findIndex(step => step.id === currentStep);
  };

  const stepIndex = getCurrentStepIndex();
  
  return (
    <div className="mb-8">
      {/* Desktop version */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Progress background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 rounded"></div>
          
          {/* Progress active line */}
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary rounded transition-all duration-500 ease-out"
            style={{ width: `${(stepIndex / (steps.length - 1)) * 100}%` }}
          ></div>
          
          <ol className="flex items-center justify-between relative z-10">
            {steps.map((step, index) => {
              const isComplete = index < stepIndex;
              const isCurrent = index === stepIndex;
              const isUpcoming = index > stepIndex;
              
              return (
                <li key={step.id} className="flex flex-col items-center">
                  {/* Step circle */}
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                    isComplete 
                      ? "bg-primary border-primary text-white shadow-primary/20" 
                      : isCurrent 
                        ? "bg-white border-primary text-primary shadow-primary/10 ring-4 ring-primary/20" 
                        : "bg-white border-gray-300 text-gray-400"
                  )}>
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step label */}
                  <span className={cn(
                    "mt-2 text-sm font-medium transition-colors duration-300",
                    isComplete 
                      ? "text-primary" 
                      : isCurrent 
                        ? "text-primary font-semibold" 
                        : "text-gray-500"
                  )}>
                    {step.name}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      
      {/* Mobile version */}
      <div className="sm:hidden">
        <div className="relative mb-4">
          {/* Progress bar background */}
          <div className="h-2 bg-gray-200 rounded-full"></div>
          
          {/* Progress bar fill */}
          <div 
            className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        <nav className="overflow-x-auto">
          <ol className="flex space-x-2">
            {steps.map((step, index) => {
              const isComplete = index < stepIndex;
              const isCurrent = index === stepIndex;
              
              return (
                <li key={step.id} className="flex-1 min-w-0">
                  <div className={cn(
                    "text-xs font-medium px-3 py-2 rounded-full text-center transition-all duration-300",
                    isComplete 
                      ? "bg-primary text-white shadow-sm" 
                      : isCurrent 
                        ? "bg-primary/20 text-primary border border-primary/30 font-semibold" 
                        : "bg-gray-100 text-gray-500"
                  )}>
                    {step.name}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
        
        {/* Current step indicator */}
        <div className="mt-3 text-center">
          <span className="text-sm font-medium text-primary">
            ეტაპი {stepIndex + 1} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BookingSteps;
