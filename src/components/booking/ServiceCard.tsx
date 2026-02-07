import { useLanguage } from "@/contexts/LanguageContext";
import { MedicalService, HOURLY_PRICING } from "@/lib/services";
import { cn } from "@/lib/utils";
import {
  Stethoscope,
  UserRound,
  ClipboardCheck,
  Syringe,
  HeartPulse,
  Activity,
  CircleDot,
  Dumbbell,
  Accessibility,
  TestTube,
  FlaskConical,
  Check,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Stethoscope,
  UserRound,
  ClipboardCheck,
  Syringe,
  HeartPulse,
  Activity,
  CircleDot,
  Dumbbell,
  Accessibility,
  TestTube,
  FlaskConical,
};

interface ServiceCardProps {
  service: MedicalService;
  isSelected: boolean;
  onSelect: (service: MedicalService) => void;
}

const ServiceCard = ({ service, isSelected, onSelect }: ServiceCardProps) => {
  const { t } = useLanguage();
  const Icon = iconMap[service.icon];

  return (
    <button
      onClick={() => onSelect(service)}
      className={cn(
        "relative w-full text-start p-4 rounded-xl border-2 transition-all duration-200 group",
        isSelected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border bg-card hover:border-primary/30 hover:shadow-md"
      )}
    >
      {isSelected && (
        <div className="absolute top-3 end-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-11 w-11 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          {Icon && <Icon className="h-5 w-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground">
            {t(service.nameKey)}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {t(service.descKey)}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-sm font-bold text-primary">
              {t("price.starts_from")} {HOURLY_PRICING.day.firstHour} {t("price.currency")}/{t("price.per_hour")}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default ServiceCard;
