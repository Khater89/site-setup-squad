import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

interface SmartDobPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SmartDobPicker = ({ value, onChange }: SmartDobPickerProps) => {
  const { isRTL } = useLanguage();
  const months = isRTL ? MONTHS_AR : MONTHS_EN;

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 70 }, (_, i) => currentYear - 18 - i),
    [currentYear]
  );

  const [y = "", m = "", d = ""] = value ? value.split("-") : [];

  const daysInMonth = useMemo(() => {
    if (!y || !m) return 31;
    return new Date(parseInt(y), parseInt(m), 0).getDate();
  }, [y, m]);

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const handleChange = (newY: string, newM: string, newD: string) => {
    if (newY && newM && newD) {
      onChange(`${newY}-${newM.padStart(2, "0")}-${newD.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select value={y} onValueChange={(v) => handleChange(v, m, d)}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder={isRTL ? "السنة" : "Year"} />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={m} onValueChange={(v) => handleChange(y, v, d)}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder={isRTL ? "الشهر" : "Month"} />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {months.map((mn, idx) => (
            <SelectItem key={idx} value={String(idx + 1).padStart(2, "0")}>
              {mn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={d} onValueChange={(v) => handleChange(y, m, v)}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder={isRTL ? "اليوم" : "Day"} />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {days.map((day) => (
            <SelectItem key={day} value={String(day).padStart(2, "0")}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SmartDobPicker;
