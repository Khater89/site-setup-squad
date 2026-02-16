import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { MailCheck } from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";

const VerifyEmailPage = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <img src={mfnLogo} alt="MFN" className="h-10 mx-auto mb-3" />
          <MailCheck className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle>{t("verify_email.title")}</CardTitle>
          <CardDescription className="mt-2 text-base">
            {t("verify_email.message")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("verify_email.hint")}</p>
        </CardContent>
        <CardFooter className="justify-center gap-4">
          <Link to="/provider/register" className="text-sm text-primary hover:underline font-medium">
            {t("verify_email.login_link")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
