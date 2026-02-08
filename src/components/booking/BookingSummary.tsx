import { useLanguage } from "@/contexts/LanguageContext";
import type { DbService } from "@/hooks/useServices";
import { PatientData } from "./PatientForm";
import { PeriodType, calculateHourlyPricing, HOURLY_PRICING } from "@/lib/services";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Stethoscope, User, Phone, MapPin, CalendarDays, Clock, Receipt } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface BookingSummaryProps {
  service: DbService | null;
  patient: PatientData;
  step: number;
}

const BookingSummary = ({ service, patient, step }: BookingSummaryProps) => {
  const { t, lang } = useLanguage();

  if (!service) return null;

  const period: PeriodType = patient.time === "evening" ? "night" : "day";
  const pricing = calculateHourlyPricing(period, patient.hours);
  const config = HOURLY_PRICING[period];
  const currency = t("price.currency");

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Receipt className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-bold text-sm text-foreground">
          {t("booking.summary")}
        </h3>
      </div>

      {/* Service */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-2.5">
          <Stethoscope className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-foreground">{service.name}</p>
            {service.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Patient info */}
      {step >= 2 && (patient.name || patient.phone || patient.city) && (
        <div className="space-y-2.5 text-sm">
          {patient.name && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{patient.name}</span>
            </div>
          )}
          {patient.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span dir="ltr">{patient.phone}</span>
            </div>
          )}
          {patient.city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{patient.city}</span>
            </div>
          )}
          {patient.date && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{format(patient.date, "PPP", { locale: lang === "ar" ? ar : undefined })}</span>
            </div>
          )}
          {patient.time && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{t(`time.${patient.time}`)}</span>
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Price breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("price.first_hour")}</span>
          <span className="font-medium">{config.firstHour} {currency}</span>
        </div>
        {patient.hours > 1 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {patient.hours - 1} × {t("price.additional_hour")}
            </span>
            <span className="font-medium">{(patient.hours - 1) * config.additionalHour} {currency}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("price.commission")}</span>
          <span className="font-medium">{pricing.commission} {currency}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="font-bold text-foreground">{t("price.total")}</span>
          <span className="text-lg font-black text-primary">{pricing.total} {currency}</span>
        </div>
        <p className="text-[10px] text-muted-foreground text-center pt-1">{t("price.materials_note")}</p>
      </div>
    </div>
  );
};

export default BookingSummary;
