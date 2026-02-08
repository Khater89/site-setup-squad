import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/booking/LanguageToggle";
import mfnLogo from "@/assets/mfn-logo.png";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const staggerFast = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header / Navbar */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20"
      >
        <div className="container max-w-6xl py-3 flex items-center justify-between">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                {t("landing.login") || "تسجيل الدخول"}
              </Button>
            </Link>
            <Link to="/booking">
              <Button size="sm" className="gap-1.5 text-xs sm:text-sm">
                {t("landing.cta")}
                <ArrowIcon className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute top-20 start-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          className="absolute bottom-10 end-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="container max-w-6xl relative py-16 sm:py-24 text-center space-y-8"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <Phone className="h-4 w-4" />
            {t("landing.feature4")}
          </motion.div>

          <motion.h2 variants={fadeUp} transition={{ duration: 0.6 }} className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight max-w-3xl mx-auto">
            {t("landing.hero")}
          </motion.h2>

          <motion.p variants={fadeUp} transition={{ duration: 0.6 }} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("landing.hero.sub")}
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking">
              <Button size="lg" className="gap-2 text-base px-8 shadow-lg hover:shadow-xl transition-shadow">
                {t("landing.cta")}
                <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={staggerFast}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-8 pt-8"
          >
            {[
              { value: "22+", label: t("landing.stats.services") },
              { value: "24/7", label: t("landing.stats.available") },
              { value: "5+", label: t("landing.stats.cities") },
            ].map((stat, i) => (
              <motion.div key={i} variants={scaleIn} transition={{ duration: 0.5 }} className="text-center">
                <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Why Us Section */}
      <section className="py-16 bg-card/50">
        <div className="container max-w-6xl space-y-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{t("landing.whyus")}</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.whyus.sub")}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all hover:shadow-lg duration-300"
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
                  className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                >
                  <f.icon className="h-6 w-6 text-primary" />
                </motion.div>
                <h4 className="font-bold text-foreground mb-2">{t(f.titleKey)}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container max-w-6xl space-y-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{t("landing.services_title")}</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.services_sub")}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerFast}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {highlightedServices.map((s, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -5, scale: 1.04, transition: { duration: 0.2 } }}
              >
                <Link
                  to="/booking"
                  className="group flex flex-col items-center text-center gap-3 bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-300 h-full"
                >
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{t(s.key)}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Link to="/booking">
              <Button variant="outline" size="lg" className="gap-2">
                {t("landing.cta")}
                <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-card/50">
        <div className="container max-w-4xl space-y-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">{t("landing.pricing_title")}</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.pricing_sub")}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {/* Day Pricing */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-card border border-border rounded-2xl p-6 space-y-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -20, opacity: 0 }}
                  whileInView={{ rotate: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-12 w-12 rounded-xl bg-warning/15 flex items-center justify-center"
                >
                  <Sun className="h-6 w-6 text-warning" />
                </motion.div>
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
            </motion.div>

            {/* Night Pricing */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-card border-2 border-primary/30 rounded-2xl p-6 space-y-5 relative hover:shadow-lg transition-shadow"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3, type: "spring", stiffness: 200 }}
                className="absolute -top-3 start-4"
              >
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  24/7
                </span>
              </motion.div>
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: 20, opacity: 0 }}
                  whileInView={{ rotate: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center"
                >
                  <Moon className="h-6 w-6 text-primary" />
                </motion.div>
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
            </motion.div>
          </motion.div>

          {/* Pricing Notes */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerFast}
            className="flex flex-col items-center gap-2 text-center"
          >
            <motion.div variants={fadeIn} transition={{ duration: 0.4 }} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              {t("landing.pricing.commission_note")}
            </motion.div>
            <motion.div variants={fadeIn} transition={{ duration: 0.4 }} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              {t("landing.pricing.materials_note")}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          className="container max-w-3xl relative text-center space-y-6"
        >
          <motion.h3 variants={fadeUp} transition={{ duration: 0.6 }} className="text-2xl sm:text-4xl font-extrabold text-foreground">
            {t("landing.hero")}
          </motion.h3>
          <motion.p variants={fadeUp} transition={{ duration: 0.6 }} className="text-lg text-muted-foreground">
            {t("landing.hero.sub")}
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <Link to="/booking">
              <Button size="lg" className="gap-2 text-base px-10 shadow-lg">
                {t("landing.cta")}
                <ArrowIcon className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
        className="border-t border-border bg-card/80 py-8"
      >
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
      </motion.footer>

      {/* WhatsApp Floating Button */}
      <motion.a
        href="https://wa.me/962790619770"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 end-6 z-50 h-14 w-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.924 15.924 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.338 22.618c-.394 1.11-1.946 2.032-3.192 2.3-.854.182-1.968.326-5.72-1.23-4.802-1.99-7.892-6.862-8.132-7.18-.23-.318-1.936-2.578-1.936-4.916s1.226-3.49 1.662-3.968c.436-.478.952-.598 1.27-.598.316 0 .632.002.908.016.292.014.684-.11 1.07.816.394.952 1.338 3.27 1.456 3.508.118.238.198.516.04.834-.158.318-.238.516-.476.794-.238.278-.5.62-.714.832-.238.238-.486.496-.208.972.278.476 1.236 2.038 2.654 3.302 1.822 1.624 3.358 2.126 3.834 2.364.476.238.754.198 1.032-.118.278-.318 1.19-1.388 1.508-1.866.318-.476.634-.396 1.07-.238.436.158 2.754 1.298 3.23 1.536.476.238.794.356.912.554.118.198.118 1.15-.276 2.26z" />
        </svg>
      </motion.a>
    </div>
  );
};

export default LandingPage;