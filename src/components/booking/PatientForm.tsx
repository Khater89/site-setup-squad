import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon, User, Phone, MapPin, Clock, Minus, Plus,
  Navigation, Home,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PeriodType, HOURLY_PRICING, calculateHourlyPricing } from "@/lib/services";

export interface PatientData {
  name: string;
  phone: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  date: Date | undefined;
  time: string;
  hours: number;
  notes: string;
}

interface PatientFormProps {
  data: PatientData;
  onChange: (data: PatientData) => void;
}

const PatientForm = ({ data, onChange }: PatientFormProps) => {
  const { t, lang } = useLanguage();
  const [locating, setLocating] = useState(false);

  const update = (field: keyof PatientData, value: string | number | Date | undefined | null) => {
    onChange({ ...data, [field]: value });
  };

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ ...data, lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const timeSlots = [
    { value: "morning", label: t("time.morning") },
    { value: "afternoon", label: t("time.afternoon") },
    { value: "evening", label: t("time.evening") },
  ];

  const period: PeriodType = data.time === "evening" ? "night" : "day";
  const pricing = calculateHourlyPricing(period, data.hours);
  const config = HOURLY_PRICING[period];

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

      {/* City */}
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

      {/* Address */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Home className="h-4 w-4 text-primary" />
          {t("form.address")}
        </Label>
        <Input
          value={data.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder={t("form.address.placeholder")}
          className="h-11"
        />
      </div>

      {/* Get Location */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Navigation className="h-4 w-4 text-primary" />
            {t("form.get_location")}
          </Label>
          {data.lat != null && data.lng != null && (
            <span className="text-xs text-success font-medium">{t("form.location_detected")} ✓</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 gap-2"
          onClick={getLocation}
          disabled={locating}
        >
          <Navigation className={cn("h-4 w-4", locating && "animate-pulse")} />
          {locating
            ? "..."
            : data.lat != null
            ? `${data.lat.toFixed(4)}, ${data.lng?.toFixed(4)}`
            : t("form.get_location")}
        </Button>
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
              className={cn("p-3 pointer-events-auto")}
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

      {/* Hours Selector */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-primary" />
          {t("form.hours")}
        </Label>
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => update("hours", Math.max(1, data.hours - 1))}
            disabled={data.hours <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[80px]">
            <span className="text-3xl font-bold text-primary">{data.hours}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {data.hours === 1 ? t("form.hours.single") : t("form.hours.plural")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => update("hours", Math.min(12, data.hours + 1))}
            disabled={data.hours >= 12}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Live Price Preview */}
        {data.time && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("price.first_hour")}</span>
              <span className="font-medium">{config.firstHour} {t("price.currency")}</span>
            </div>
            {data.hours > 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {data.hours - 1} × {t("price.additional_hour")}
                </span>
                <span className="font-medium">
                  {(data.hours - 1) * config.additionalHour} {t("price.currency")}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-border">
              <span className="font-semibold text-foreground">{t("price.subtotal")}</span>
              <span className="font-bold text-primary">{pricing.basePrice} {t("price.currency")}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("price.materials_note")}</p>
          </div>
        )}
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
