
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
          {steps.map((step, index) => (
            <li key={step.id} className={cn(
              "relative flex-1",
              index !== steps.length - 1 ? "pr-6" : "",
            )}>
              {index < stepIndex ? (
                // Completed step
                <div className="group">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-primary" />
                  <div className="relative flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <span className="ml-3 text-sm font-medium text-primary">
                      {step.name}
                    </span>
                  </div>
                </div>
              ) : index === stepIndex ? (
                // Current step
                <div className="group flex items-center" aria-current="step">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full">
                    <div className="h-1 w-1/2 bg-primary" />
                  </div>
                  <div className="relative flex items-center">
                    <div className="h-10 w-10 rounded-full border-2 border-primary bg-white flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <span className="ml-3 text-sm font-medium text-primary">
                      {step.name}
                    </span>
                  </div>
                </div>
              ) : (
                // Upcoming step
                <div className="group">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-muted w-full" />
                  <div className="relative flex items-center">
                    <div className="h-10 w-10 rounded-full border-2 border-muted bg-white flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>
                    <span className="ml-3 text-sm font-medium text-muted-foreground">
                      {step.name}
                    </span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
      
      {/* Mobile version */}
      <div className="sm:hidden">
        <nav className="overflow-x-auto">
          <ol className="flex space-x-2 pb-4">
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
