import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WizardStepperProps {
  currentStep: number;
  steps: string[];
}

const WizardStepper = ({ currentStep, steps }: WizardStepperProps) => {
  return (
    <div className="flex items-center justify-center w-full max-w-xl mx-auto px-2">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-2 min-w-[64px]">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? "hsl(var(--success))"
                    : isActive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted))",
                }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold",
                  isCompleted && "text-success-foreground shadow-md",
                  isActive && "text-primary-foreground shadow-lg ring-4 ring-primary/20",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : stepNum}
              </motion.div>
              <span
                className={cn(
                  "text-xs font-semibold whitespace-nowrap transition-colors",
                  isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-1 sm:mx-2 h-1 rounded-full relative overflow-hidden bg-muted -mt-6">
                <motion.div
                  initial={false}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-success origin-left rtl:origin-right"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WizardStepper;
