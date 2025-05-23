
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
    if (currentStep === "success") return steps.length; // Success is after the last step
    return steps.findIndex(step => step.id === currentStep);
  };

  const stepIndex = getCurrentStepIndex();
  
  return (
    <div className="mb-8">
      {/* Desktop version */}
      <div className="hidden sm:block">
        <ol className="flex items-center w-full">
          {steps.map((step, index) => {
            const isComplete = index < stepIndex;
            const isCurrent = index === stepIndex;
            const isUpcoming = index > stepIndex;
            
            return (
              <li 
                key={step.id} 
                className={cn(
                  "flex items-center relative",
                  index !== steps.length - 1 ? "flex-1" : ""
                )}
              >
                {/* Progress bar */}
                {index !== 0 && (
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full -translate-x-1/2",
                    isComplete ? "bg-primary" : "bg-muted"
                  )} />
                )}
                
                {/* Step circle */}
                <div className="relative flex items-center z-10">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    isComplete ? "bg-primary text-white" : 
                    isCurrent ? "bg-white border-2 border-primary text-primary" : 
                    "bg-white border-2 border-muted text-muted-foreground"
                  )}>
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  
                  <span className={cn(
                    "ml-3 text-sm font-medium",
                    isComplete ? "text-primary" : 
                    isCurrent ? "text-primary" : 
                    "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      
      {/* Mobile version - simplified pill design */}
      <div className="sm:hidden">
        <nav className="overflow-x-auto">
          <ol className="flex space-x-2">
            {steps.map((step, index) => {
              const isComplete = index < stepIndex;
              const isCurrent = index === stepIndex;
              
              return (
                <li key={step.id} className="flex-1">
                  <div className={cn(
                    "text-xs font-medium px-3 py-2 rounded-full text-center",
                    isComplete ? "bg-primary text-primary-foreground" : 
                    isCurrent ? "bg-primary/20 text-primary border border-primary/30" : 
                    "bg-muted text-muted-foreground"
                  )}>
                    {step.name}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default BookingSteps;
