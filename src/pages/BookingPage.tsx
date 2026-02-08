import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { MedicalService, ServiceCategory, getServicesByCategory, calculateHourlyPricing, PeriodType } from "@/lib/services";
import { buildBookingPayload, submitToGoogleSheets } from "@/lib/googleSheets";
import BookingHeader from "@/components/booking/BookingHeader";
import StepIndicator from "@/components/booking/StepIndicator";
import CategoryTabs from "@/components/booking/CategoryTabs";
import ServiceCard from "@/components/booking/ServiceCard";
import PatientForm, { PatientData } from "@/components/booking/PatientForm";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import SuccessView from "@/components/booking/SuccessView";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Send, Loader2 } from "lucide-react";

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

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ServiceCategory>("medical");
  const [selectedService, setSelectedService] = useState<MedicalService | null>(null);
  const [patient, setPatient] = useState<PatientData>(INITIAL_PATIENT);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Platform settings from DB
  const [settings, setSettings] = useState({ platform_fee_percent: 10, deposit_percent: 20 });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("platform_fee_percent, deposit_percent")
        .eq("id", 1)
        .maybeSingle();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const categoryServices = getServicesByCategory(category);

  const handleSelectService = (service: MedicalService) => {
    setSelectedService(service);
  };

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

    // Calculate platform amounts
    const subtotal = pricing.total;
    const platformFee = Math.round(subtotal * (settings.platform_fee_percent / 100) * 100) / 100;
    const providerPayout = subtotal - platformFee;

    // Build scheduled_at from date + time slot
    const scheduledAt = new Date(patient.date!);
    const timeMap: Record<string, number> = { morning: 9, afternoon: 13, evening: 20 };
    scheduledAt.setHours(timeMap[patient.time] || 9, 0, 0, 0);

    // Submit to Supabase
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

    // Also submit to Google Sheets (dual write)
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
    setCategory("medical");
    setSelectedService(null);
    setPatient(INITIAL_PATIENT);
    setSubmitted(false);
  };

  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <BookingHeader />
        <main className="container max-w-xl py-10">
          <SuccessView onReset={handleReset} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BookingHeader />

      <main className="container max-w-xl py-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">{t("booking.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("booking.subtitle")}</p>
        </div>

        <StepIndicator currentStep={step} totalSteps={3} />

        <div className="animate-slide-up">
          {/* Step 1: Select Category & Service */}
          {step === 1 && (
            <div className="space-y-4">
              <CategoryTabs selected={category} onChange={setCategory} />
              <div className="grid gap-3">
                {categoryServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedService?.id === service.id}
                    onSelect={handleSelectService}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Patient Form */}
          {step === 2 && (
            <PatientForm data={patient} onChange={setPatient} />
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && selectedService && (
            <BookingConfirmation service={selectedService} patient={patient} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2 flex-1">
              <BackIcon className="h-4 w-4" />
              {t("action.back")}
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canGoNext()} className="gap-2 flex-1">
              {t("action.next")}
              <NextIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 flex-1">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? t("status.submitting") : t("action.submit")}
            </Button>
          )}
        </div>

        <footer className="pt-4 pb-8 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            {t("app.name")} — {t("app.tagline")}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default BookingPage;
