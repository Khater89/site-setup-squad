import { useLanguage } from "@/contexts/LanguageContext";
import { calculateHourlyPricing, PeriodType, HOURLY_PRICING, CATEGORY_CONFIG } from "@/lib/services";
import type { DbService } from "@/hooks/useServices";
import { Separator } from "@/components/ui/separator";
import { Receipt } from "lucide-react";

interface PriceSummaryProps {
  service: DbService;
  hours: number;
  period: PeriodType;
}

const PriceSummary = ({ service, hours, period }: PriceSummaryProps) => {
  const { t, lang } = useLanguage();
  const { basePrice, commission, total } = calculateHourlyPricing(period, hours);
  const config = HOURLY_PRICING[period];
  const currency = t("price.currency");

  const catConfig = CATEGORY_CONFIG[service.category];
  const categoryLabel = catConfig
    ? lang === "ar" ? catConfig.labelAr : catConfig.labelEn
    : service.category;

  return (
    <div className="rounded-xl border-2 border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">{service.name}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{t("price.period")}</span>
          <span className="font-medium text-foreground">{t(`price.period.${period}`)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{t("price.first_hour")}</span>
          <span className="font-medium text-foreground">
            {config.firstHour} {currency}
          </span>
        </div>

        {hours > 1 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {hours - 1} × {t("price.additional_hour")}
            </span>
            <span className="font-medium text-foreground">
              {(hours - 1) * config.additionalHour} {currency}
            </span>
          </div>
        )}

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

        <p className="text-[10px] text-muted-foreground text-center">{t("price.materials_note")}</p>
      </div>
    </div>
  );
};

export default PriceSummary;
