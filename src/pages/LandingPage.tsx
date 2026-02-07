import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/booking/LanguageToggle";
import mfnLogo from "@/assets/mfn-logo.png";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Zap,
  DollarSign,
  Clock,
  Stethoscope,
  HeartPulse,
  Syringe,
  Activity,
  Bone,
  Ambulance,
  ArrowLeft,
  ArrowRight,
  Phone,
  Sun,
  Moon,
  Star,
  MapPin,
  CheckCircle,
} from "lucide-react";

const LandingPage = () => {
  const { t, isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const features = [
    { icon: ShieldCheck, titleKey: "landing.feature1", descKey: "landing.feature1.desc" },
    { icon: Zap, titleKey: "landing.feature2", descKey: "landing.feature2.desc" },
    { icon: DollarSign, titleKey: "landing.feature3", descKey: "landing.feature3.desc" },
    { icon: Clock, titleKey: "landing.feature4", descKey: "landing.feature4.desc" },
  ];

  const highlightedServices = [
    { icon: Stethoscope, key: "service.general_medicine" },
    { icon: HeartPulse, key: "service.home_nursing" },
    { icon: Syringe, key: "service.injections" },
    { icon: Activity, key: "service.vital_signs" },
    { icon: Bone, key: "service.fracture_treatment" },
    { icon: Ambulance, key: "service.patient_transport" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="container max-w-6xl py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={mfnLogo} alt="Medical Field Nation" className="h-10 w-10 rounded-xl object-contain" />
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                {t("app.name")}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {t("app.tagline")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link to="/booking">
              <Button size="sm" className="gap-1.5 hidden sm:flex">
                {t("landing.cta")}
                <ArrowIcon className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="absolute top-20 start-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 end-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

        <div className="container max-w-6xl relative py-16 sm:py-24 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <Phone className="h-4 w-4" />
            {t("landing.feature4")}
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight max-w-3xl mx-auto">
            {t("landing.hero")}
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("landing.hero.sub")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking">
              <Button size="lg" className="gap-2 text-base px-8 shadow-lg hover:shadow-xl transition-shadow">
                {t("landing.cta")}
                <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 pt-8">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-primary">22+</p>
              <p className="text-sm text-muted-foreground">{t("landing.stats.services")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-primary">24/7</p>
              <p className="text-sm text-muted-foreground">{t("landing.stats.available")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-primary">5+</p>
              <p className="text-sm text-muted-foreground">{t("landing.stats.cities")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-16 bg-card/50">
        <div className="container max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{t("landing.whyus")}</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.whyus.sub")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all hover:shadow-lg hover:-translate-y-1 duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold text-foreground mb-2">{t(f.titleKey)}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{t("landing.services_title")}</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.services_sub")}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {highlightedServices.map((s, i) => (
              <Link
                key={i}
                to="/booking"
                className="group flex flex-col items-center text-center gap-3 bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all hover:-translate-y-1 duration-300"
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug">{t(s.key)}</p>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link to="/booking">
              <Button variant="outline" size="lg" className="gap-2">
                {t("landing.cta")}
                <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-card/50">
        <div className="container max-w-4xl space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{t("landing.pricing_title")}</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.pricing_sub")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Day Pricing */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-warning/15 flex items-center justify-center">
                  <Sun className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t("landing.pricing.day_label")}</h4>
                  <p className="text-xs text-muted-foreground">{t("landing.pricing.day_time")}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">{t("landing.pricing.first_hour")}</span>
                  <span className="text-xl font-bold text-foreground">50 <span className="text-sm font-normal text-muted-foreground">{t("price.currency")}</span></span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">{t("landing.pricing.extra_hour")}</span>
                  <span className="text-xl font-bold text-foreground">20 <span className="text-sm font-normal text-muted-foreground">{t("price.currency")}</span></span>
                </div>
              </div>
              <Link to="/booking" className="block">
                <Button className="w-full gap-2">
                  {t("action.book_now")}
                  <ArrowIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Night Pricing */}
            <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-5 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-3 start-4">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  24/7
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Moon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t("landing.pricing.night_label")}</h4>
                  <p className="text-xs text-muted-foreground">{t("landing.pricing.night_time")}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">{t("landing.pricing.first_hour")}</span>
                  <span className="text-xl font-bold text-foreground">70 <span className="text-sm font-normal text-muted-foreground">{t("price.currency")}</span></span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">{t("landing.pricing.extra_hour")}</span>
                  <span className="text-xl font-bold text-foreground">20 <span className="text-sm font-normal text-muted-foreground">{t("price.currency")}</span></span>
                </div>
              </div>
              <Link to="/booking" className="block">
                <Button className="w-full gap-2">
                  {t("action.book_now")}
                  <ArrowIcon className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Pricing Notes */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              {t("landing.pricing.commission_note")}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              {t("landing.pricing.materials_note")}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container max-w-3xl relative text-center space-y-6">
          <h3 className="text-2xl sm:text-4xl font-extrabold text-foreground">
            {t("landing.hero")}
          </h3>
          <p className="text-lg text-muted-foreground">{t("landing.hero.sub")}</p>
          <Link to="/booking">
            <Button size="lg" className="gap-2 text-base px-10 shadow-lg">
              {t("landing.cta")}
              <ArrowIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/80 py-8">
        <div className="container max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={mfnLogo} alt="MFN" className="h-8 w-8 rounded-lg object-contain" />
              <div>
                <p className="font-bold text-foreground text-sm">{t("app.name")}</p>
                <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>© 2025 {t("app.name")}. {t("landing.footer.rights")}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;