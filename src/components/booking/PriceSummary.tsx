import { useLanguage } from "@/contexts/LanguageContext";
import { MedicalService, calculatePricing } from "@/lib/services";
import { Separator } from "@/components/ui/separator";
import { Receipt } from "lucide-react";

interface PriceSummaryProps {
  service: MedicalService;
}

const PriceSummary = ({ service }: PriceSummaryProps) => {
  const { t } = useLanguage();
  const { basePrice, commission, total } = calculatePricing(service.basePrice);
  const currency = t("price.currency");

  return (
    <div className="rounded-xl border-2 border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">{t("service.category." + service.category)}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{t("price.base")}</span>
          <span className="font-medium text-foreground">
            {basePrice} {currency}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{t("price.commission")}</span>
          <span className="font-medium text-foreground">
            {commission} {currency}
          </span>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-bold text-foreground">{t("price.total")}</span>
          <span className="text-xl font-bold text-primary">
            {total} {currency}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceSummary;
