import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import BookingHeader from "@/components/booking/BookingHeader";
import StepIndicator from "@/components/booking/StepIndicator";
import CategoryTabs from "@/components/booking/CategoryTabs";
import ServiceCard from "@/components/booking/ServiceCard";
import PatientForm, { PatientData } from "@/components/booking/PatientForm";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import SuccessView from "@/components/booking/SuccessView";
import { Button } from "@/components/ui/button";
import { MedicalService, ServiceCategory, getServicesByCategory } from "@/lib/services";
import { ArrowRight, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialPatientData: PatientData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  date: undefined,
  time: "",
  notes: "",
};

const BookingPage = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ServiceCategory>("medical");
  const [selectedService, setSelectedService] = useState<MedicalService | null>(null);
  const [patient, setPatient] = useState<PatientData>(initialPatientData);
  const [submitted, setSubmitted] = useState(false);

  const categoryServices = getServicesByCategory(category);

  const canGoNext = () => {
    if (step === 1) return !!selectedService;
    if (step === 2) return patient.name && patient.phone && patient.address && patient.date && patient.time;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    toast({
      title: t("status.success"),
      description: t("status.success.desc"),
    });
    setSubmitted(true);
  };

  const handleReset = () => {
    setStep(1);
    setCategory("medical");
    setSelectedService(null);
    setPatient(initialPatientData);
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
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">{t("booking.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("booking.subtitle")}</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} totalSteps={3} />

        {/* Step Content */}
        <div className="animate-slide-up">
          {step === 1 && (
            <div className="space-y-5">
              <CategoryTabs selected={category} onChange={(c) => { setCategory(c); setSelectedService(null); }} />
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
            </div>
          )}

          {step === 2 && (
            <PatientForm data={patient} onChange={setPatient} />
          )}

          {step === 3 && selectedService && (
            <BookingConfirmation service={selectedService} patient={patient} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2 flex-1"
            >
              <BackIcon className="h-4 w-4" />
              {t("action.back")}
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="gap-2 flex-1"
            >
              {t("action.next")}
              <NextIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="gap-2 flex-1"
            >
              <Send className="h-4 w-4" />
              {t("action.submit")}
            </Button>
          )}
        </div>

        {/* Footer */}
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
