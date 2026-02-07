import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const LanguageToggle = () => {
  const { lang, toggleLang } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLang}
      className="gap-2 font-medium"
    >
      <Globe className="h-4 w-4" />
      {lang === "ar" ? "EN" : "عربي"}
    </Button>
  );
};

export default LanguageToggle;
