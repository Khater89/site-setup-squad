import { useLanguage } from "@/contexts/LanguageContext";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => {
  const { t } = useLanguage();

  const steps = [
    t("booking.step1"),
    t("booking.step2"),
    t("booking.step3"),
  ];

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-2">
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
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-black transition-shadow",
                  isCompleted && "text-success-foreground shadow-md",
                  isActive && "text-primary-foreground shadow-lg ring-4 ring-primary/20",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </motion.div>
              <span
                className={cn(
                  "text-[11px] font-semibold whitespace-nowrap transition-colors",
                  isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 h-0.5 rounded-full relative overflow-hidden bg-muted">
                <motion.div
                  initial={false}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-success origin-start"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
