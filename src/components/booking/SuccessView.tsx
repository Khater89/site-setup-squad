import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessViewProps {
  onReset: () => void;
}

const SuccessView = ({ onReset }: SuccessViewProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 space-y-6 animate-slide-up">
      <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {t("status.success")}
        </h2>
        <p className="text-muted-foreground max-w-sm">
          {t("status.success.desc")}
        </p>
      </div>

      <Button onClick={onReset} size="lg" className="mt-4">
        {t("action.book_now")}
      </Button>
    </div>
  );
};

export default SuccessView;
