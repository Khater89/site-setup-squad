import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "./LanguageToggle";
import { Cross, Plus } from "lucide-react";

const BookingHeader = () => {
  const { t } = useLanguage();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
      <div className="container max-w-4xl py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <Plus className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {t("app.name")}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {t("app.tagline")}
            </p>
          </div>
        </div>
        <LanguageToggle />
      </div>
    </header>
  );
};

export default BookingHeader;
