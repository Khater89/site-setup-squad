import { useLanguage } from "@/contexts/LanguageContext";
import { MedicalService } from "@/lib/services";
import { PatientData } from "./PatientForm";
import PriceSummary from "./PriceSummary";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { User, Phone, Mail, MapPin, CalendarIcon, Clock, FileText } from "lucide-react";

interface BookingConfirmationProps {
  service: MedicalService;
  patient: PatientData;
}

const BookingConfirmation = ({ service, patient }: BookingConfirmationProps) => {
  const { t, lang } = useLanguage();

  const timeLabels: Record<string, string> = {
    morning: t("time.morning"),
    afternoon: t("time.afternoon"),
    evening: t("time.evening"),
  };

  const infoRows = [
    { icon: User, label: t("form.patient_name"), value: patient.name },
    { icon: Phone, label: t("form.phone"), value: patient.phone },
    ...(patient.email ? [{ icon: Mail, label: t("form.email"), value: patient.email }] : []),
    { icon: MapPin, label: t("form.address"), value: patient.address },
    {
      icon: CalendarIcon,
      label: t("form.date"),
      value: patient.date
        ? format(patient.date, "PPP", { locale: lang === "ar" ? ar : undefined })
        : "—",
    },
    { icon: Clock, label: t("form.time"), value: timeLabels[patient.time] || "—" },
    ...(patient.notes ? [{ icon: FileText, label: t("form.notes"), value: patient.notes }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Patient Summary */}
      <div className="rounded-xl border-2 border-border bg-card p-5 space-y-3">
        {infoRows.map((row, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <row.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-muted-foreground">{row.label}: </span>
              <span className="font-medium text-foreground">{row.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Price Summary */}
      <PriceSummary service={service} />
    </div>
  );
};

export default BookingConfirmation;
