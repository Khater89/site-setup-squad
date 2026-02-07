import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, User, Phone, Mail, MapPin, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface PatientData {
  name: string;
  isEmergency: boolean;
  phone: string;
  email: string;
  city: string;
  date: Date | undefined;
  time: string;
  notes: string;
}

interface PatientFormProps {
  data: PatientData;
  onChange: (data: PatientData) => void;
}

const PatientForm = ({ data, onChange }: PatientFormProps) => {
  const { t, lang, isRTL } = useLanguage();

  const update = (field: keyof PatientData, value: string | boolean | Date | undefined) => {
    if (field === "isEmergency") {
      onChange({ ...data, isEmergency: value === "yes" || value === true });
    } else {
      onChange({ ...data, [field]: value });
    }
  };

  const timeSlots = [
    { value: "morning", label: t("time.morning") },
    { value: "afternoon", label: t("time.afternoon") },
    { value: "evening", label: t("time.evening") },
  ];

  return (
    <div className="space-y-5">
      {/* Patient Name */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4 text-primary" />
          {t("form.patient_name")}
        </Label>
        <Input
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder={t("form.patient_name.placeholder")}
          className="h-11"
        />
      </div>

      {/* Emergency Toggle */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          {t("form.emergency")}
        </Label>
        <RadioGroup
          value={data.isEmergency ? "yes" : "no"}
          onValueChange={(v) => update("isEmergency", v === "yes" ? "yes" : "")}
          className="grid grid-cols-2 gap-2"
        >
          {[
            { value: "no", label: t("form.emergency.no") },
            { value: "yes", label: t("form.emergency.yes") },
          ].map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-center",
                (data.isEmergency ? "yes" : "no") === opt.value
                  ? opt.value === "yes"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <RadioGroupItem value={opt.value} className="sr-only" />
              <span className="text-xs font-medium">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Phone className="h-4 w-4 text-primary" />
          {t("form.phone")}
        </Label>
        <Input
          value={data.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder={t("form.phone.placeholder")}
          type="tel"
          dir="ltr"
          className="h-11"
        />
      </div>

      {/* City / Area */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-primary" />
          {t("form.city")}
        </Label>
        <Input
          value={data.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder={t("form.city.placeholder")}
          className="h-11"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-primary" />
          {t("form.email")}
        </Label>
        <Input
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder={t("form.email.placeholder")}
          type="email"
          dir="ltr"
          className="h-11"
        />
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <CalendarIcon className="h-4 w-4 text-primary" />
          {t("form.date")}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-11 justify-start text-start font-normal",
                !data.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="me-2 h-4 w-4" />
              {data.date
                ? format(data.date, "PPP", { locale: lang === "ar" ? ar : undefined })
                : t("form.date")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.date}
              onSelect={(d) => update("date", d)}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slot */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("form.time")}</Label>
        <RadioGroup
          value={data.time}
          onValueChange={(v) => update("time", v)}
          className="grid grid-cols-3 gap-2"
        >
          {timeSlots.map((slot) => (
            <label
              key={slot.value}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-center",
                data.time === slot.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <RadioGroupItem value={slot.value} className="sr-only" />
              <span className="text-xs font-medium">{slot.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("form.notes")}</Label>
        <Textarea
          value={data.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder={t("form.notes.placeholder")}
          rows={3}
        />
      </div>
    </div>
  );
};

export default PatientForm;
