import { useLanguage } from "@/contexts/LanguageContext";
import { ServiceCategory, categoryConfig } from "@/lib/services";
import { cn } from "@/lib/utils";
import {
  Stethoscope,
  HeartPulse,
  Dumbbell,
  TestTube,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Stethoscope,
  HeartPulse,
  Dumbbell,
  TestTube,
};

interface CategoryTabsProps {
  selected: ServiceCategory;
  onChange: (cat: ServiceCategory) => void;
}

const categories: ServiceCategory[] = ["medical", "nursing", "therapy", "lab"];

const CategoryTabs = ({ selected, onChange }: CategoryTabsProps) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {categories.map((cat) => {
        const config = categoryConfig[cat];
        const Icon = iconMap[config.icon];
        const isActive = selected === cat;

        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
              isActive
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
            )}
          >
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
            </div>
            <span
              className={cn(
                "text-xs font-semibold text-center leading-tight",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {t(config.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
