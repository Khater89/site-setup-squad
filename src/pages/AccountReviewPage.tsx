import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ShieldX, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import mfnLogo from "@/assets/mfn-logo.png";

const AccountReviewPage = () => {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const status = profile?.provider_status || "pending";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <img src={mfnLogo} alt="MFN" className="h-12 mx-auto" />

          {status === "pending" ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-foreground">{t("review.pending_title")}</h1>
                <p className="text-sm text-muted-foreground">{t("review.pending_message")}</p>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldX className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-foreground">{t("review.rejected_title")}</h1>
                <p className="text-sm text-muted-foreground">{t("review.rejected_message")}</p>
              </div>
            </>
          )}

          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            {t("action.logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountReviewPage;
