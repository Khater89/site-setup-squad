import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/booking/LanguageToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LogOut,
  LayoutDashboard,
  CalendarCheck,
  UserPlus,
  LogIn,
  ChevronDown,
} from "lucide-react";
import mfnLogo from "@/assets/mfn-logo.png";

const AppHeader = () => {
  const { t, isRTL } = useLanguage();
  const { user, profile, isAdmin, isProvider, isCustomer, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.full_name || user?.email || "";

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
      <div className="container max-w-6xl py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src={mfnLogo}
            alt="Medical Field Nation"
            className="h-10 w-10 rounded-xl object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              {t("app.name")}
            </h1>
            <p className="text-[11px] text-muted-foreground">{t("app.tagline")}</p>
          </div>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />

          {loading ? null : user ? (
            /* ---- Logged In ---- */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs sm:text-sm max-w-[180px]">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate hidden sm:inline">{displayName}</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48">
                {/* Admin */}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    لوحة الإدارة
                  </DropdownMenuItem>
                )}

                {/* Provider */}
                {isProvider && (
                  <DropdownMenuItem onClick={() => navigate("/provider")} className="gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    لوحة مقدم الخدمة
                  </DropdownMenuItem>
                )}

                {/* Customer - Profile & Bookings */}
                {isCustomer && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      حسابي
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile?tab=bookings")} className="gap-2 cursor-pointer">
                      <CalendarCheck className="h-4 w-4" />
                      حجوزاتي
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* ---- Not Logged In ---- */
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs sm:text-sm">
                  <LogIn className="h-3.5 w-3.5" />
                  {t("landing.login") || "تسجيل الدخول"}
                </Button>
              </Link>
              <Link to="/provider/register" className="hidden sm:block">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <UserPlus className="h-3.5 w-3.5" />
                  انضم كمزوّد
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
