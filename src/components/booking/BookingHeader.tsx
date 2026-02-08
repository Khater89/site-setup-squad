import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";
import mfnLogo from "@/assets/mfn-logo.png";

const BookingHeader = () => {
  const { t } = useLanguage();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
      <div className="container max-w-4xl py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={mfnLogo} alt="Medical Field Nation" className="h-10 w-10 rounded-xl object-contain" />
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {t("app.name")}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {t("app.tagline")}
            </p>
          </div>
        </Link>
        <LanguageToggle />
      </div>
    </header>
  );
};

export default BookingHeader;
