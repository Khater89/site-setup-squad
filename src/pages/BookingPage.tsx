import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useServices, DbService } from "@/hooks/useServices";
import { calculateHourlyPricing, PeriodType } from "@/lib/services";
import { buildBookingPayload, submitToGoogleSheets } from "@/lib/googleSheets";
import BookingHeader from "@/components/booking/BookingHeader";
import AppFooter from "@/components/AppFooter";
import StepIndicator from "@/components/booking/StepIndicator";
import CategoryTabs from "@/components/booking/CategoryTabs";
import ServiceCard from "@/components/booking/ServiceCard";
import PatientForm, { PatientData } from "@/components/booking/PatientForm";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import BookingSummary from "@/components/booking/BookingSummary";
import SuccessView from "@/components/booking/SuccessView";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_PATIENT: PatientData = {
  name: "",
  isEmergency: false,
  phone: "",
  email: "",
  city: "",
  date: undefined,
  time: "",
  hours: 1,
  notes: "",
};

const BookingPage = () => {
  const { t, lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const { services, categories, loading: servicesLoading } = useServices(true);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<DbService | null>(null);
  const [patient, setPatient] = useState<PatientData>(INITIAL_PATIENT);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [settings, setSettings] = useState({ platform_fee_percent: 10, deposit_percent: 20 });

  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("platform_fee_percent, deposit_percent")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => { if (data) setSettings(data); });
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const categoryServices = services.filter((s) => s.category === category);

  const canGoNext = () => {
    if (step === 1) return !!selectedService;
    if (step === 2) {
      return (
        patient.name.trim() &&
        patient.phone.trim() &&
        patient.city.trim() &&
        patient.date &&
        patient.time &&
        patient.hours >= 1
      );
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedService || isSubmitting) return;
    setIsSubmitting(true);

    const period: PeriodType = patient.time === "evening" ? "night" : "day";
    const pricing = calculateHourlyPricing(period, patient.hours);

    const subtotal = pricing.total;
    const platformFee = Math.round(subtotal * (settings.platform_fee_percent / 100) * 100) / 100;
    const providerPayout = subtotal - platformFee;

    const scheduledAt = new Date(patient.date!);
    const timeMap: Record<string, number> = { morning: 9, afternoon: 13, evening: 20 };
    scheduledAt.setHours(timeMap[patient.time] || 9, 0, 0, 0);

    const booking = {
      customer_user_id: user?.id || null,
      customer_name: patient.name.trim(),
      customer_phone: patient.phone.trim(),
      city: patient.city.trim(),
      service_id: selectedService.id,
      scheduled_at: scheduledAt.toISOString(),
      notes: patient.notes.trim() || null,
      payment_method: "CASH",
      subtotal,
      platform_fee: platformFee,
      provider_payout: providerPayout,
    };

    const { error } = await supabase.from("bookings").insert(booking);

    const payload = buildBookingPayload(selectedService, patient, lang);
    await submitToGoogleSheets(payload);

    setIsSubmitting(false);

    if (error) {
      toast({ title: t("status.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("status.success"), description: t("status.success.desc") });
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setStep(1);
    setCategory(categories[0] || "");
    setSelectedService(null);
    setPatient(INITIAL_PATIENT);
    setSubmitted(false);
  };

  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <BookingHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="container max-w-xl py-10">
            <SuccessView onReset={handleReset} />
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BookingHeader />

      <main className="flex-1 container max-w-5xl py-8 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">{t("booking.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("booking.subtitle")}</p>
        </div>

        <StepIndicator currentStep={step} totalSteps={3} />

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* Wizard */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {/* Step 1 */}
                {step === 1 && (
                  <div className="space-y-4">
                    {servicesLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        <CategoryTabs
                          selected={category}
                          categories={categories}
                          onChange={(c) => { setCategory(c); setSelectedService(null); }}
                        />
                        <div className="grid gap-3">
                          {categoryServices.map((service) => (
                            <ServiceCard
                              key={service.id}
                              service={service}
                              isSelected={selectedService?.id === service.id}
                              onSelect={setSelectedService}
                            />
                          ))}
                        </div>
                        {categoryServices.length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-6">
                            لا توجد خدمات متاحة في هذا التصنيف
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && <PatientForm data={patient} onChange={setPatient} />}

                {/* Step 3 */}
                {step === 3 && selectedService && (
                  <BookingConfirmation service={selectedService} patient={patient} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="gap-2 flex-1 rounded-xl h-11 font-semibold"
                >
                  <BackIcon className="h-4 w-4" />
                  {t("action.back")}
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canGoNext()}
                  className="gap-2 flex-1 rounded-xl h-11 font-semibold"
                >
                  {t("action.next")}
                  <NextIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2 flex-1 rounded-xl h-11 font-semibold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isSubmitting ? t("status.submitting") : t("action.submit")}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar Summary */}
          {selectedService && (
            <div className="hidden lg:block lg:sticky lg:top-24">
              <BookingSummary service={selectedService} patient={patient} step={step} />
            </div>
          )}
        </div>

        {/* Mobile Summary (below wizard) */}
        {selectedService && (
          <div className="lg:hidden">
            <BookingSummary service={selectedService} patient={patient} step={step} />
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
};

export default BookingPage;
