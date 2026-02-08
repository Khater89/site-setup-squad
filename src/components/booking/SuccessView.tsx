import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SuccessViewProps {
  onReset: () => void;
}

const SuccessView = ({ onReset }: SuccessViewProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 space-y-8">
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative"
      >
        <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          className="absolute -top-2 -end-2 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <PartyPopper className="h-4 w-4 text-primary" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-3"
      >
        <h2 className="text-2xl sm:text-3xl font-black text-foreground">
          {t("status.success")}
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {t("status.success.desc")}
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Button onClick={onReset} size="lg" className="rounded-full px-8 font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow">
          {t("action.book_now")}
        </Button>
      </motion.div>
    </div>
  );
};

export default SuccessView;
