import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import BookingHeader from "@/components/booking/BookingHeader";
import StepIndicator from "@/components/booking/StepIndicator";
import SuccessView from "@/components/booking/SuccessView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Send, Loader2, CalendarDays, CheckCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"services">;

interface PlatformSettings {
  platform_fee_percent: number;
  deposit_percent: number;
}

const TIME_SLOTS = [
  { value: "08:00", label: "8:00 ص" },
  { value: "09:00", label: "9:00 ص" },
  { value: "10:00", label: "10:00 ص" },
  { value: "11:00", label: "11:00 ص" },
  { value: "12:00", label: "12:00 م" },
  { value: "13:00", label: "1:00 م" },
  { value: "14:00", label: "2:00 م" },
  { value: "15:00", label: "3:00 م" },
  { value: "16:00", label: "4:00 م" },
  { value: "17:00", label: "5:00 م" },
  { value: "18:00", label: "6:00 م" },
  { value: "19:00", label: "7:00 م" },
  { value: "20:00", label: "8:00 م" },
  { value: "21:00", label: "9:00 م" },
];

const BookingPage = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({ platform_fee_percent: 10, deposit_percent: 20 });
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [city, setCity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [servicesRes, settingsRes] = await Promise.all([
        supabase.from("services").select("*").eq("active", true).order("name"),
        supabase.from("platform_settings").select("platform_fee_percent, deposit_percent").eq("id", 1).maybeSingle(),
      ]);
      setServices(servicesRes.data || []);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
      setLoadingData(false);
    };
    fetchData();
  }, []);

  // Filter services by city
  const filteredServices = city.trim()
    ? services.filter((s) => !s.city || s.city.toLowerCase().includes(city.toLowerCase().trim()))
    : services;

  // Calculate amounts
  const subtotal = selectedService?.base_price || 0;
  const platformFee = Math.round(subtotal * (settings.platform_fee_percent / 100) * 100) / 100;
  const providerPayout = subtotal - platformFee;
  const depositAmount = Math.round(subtotal * (settings.deposit_percent / 100) * 100) / 100;
  const remainingCash = subtotal - depositAmount;

  const canGoNext = () => {
    if (step === 1) return !!selectedService;
    if (step === 2) return customerName.trim() && customerPhone.trim() && city.trim() && date && time;
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedService || isSubmitting) return;

    setIsSubmitting(true);

    const scheduledAt = new Date(date!);
    const [hours, minutes] = time.split(":");
    scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const booking = {
      customer_user_id: user?.id || null,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      city: city.trim(),
      service_id: selectedService.id,
      scheduled_at: scheduledAt.toISOString(),
      notes: notes.trim() || null,
      payment_method: paymentMethod,
      subtotal,
      platform_fee: platformFee,
      provider_payout: providerPayout,
      deposit_amount: paymentMethod === "CASH_DEPOSIT" ? depositAmount : 0,
      remaining_cash_amount: paymentMethod === "CASH_DEPOSIT" ? remainingCash : 0,
      deposit_status: paymentMethod === "CASH_DEPOSIT" ? "REQUIRED" : "NONE",
    };

    const { error } = await supabase.from("bookings").insert(booking);
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
    setSelectedService(null);
    setCity("");
    setCustomerName("");
    setCustomerPhone("");
    setDate(undefined);
    setTime("");
    setNotes("");
    setPaymentMethod("CASH");
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

  if (loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <BookingHeader />
        <main className="container max-w-xl py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{t("form.city")} *</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("form.city.placeholder")}
                  className="mt-1"
                />
              </div>

              {services.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center space-y-3">
                    <Package className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">لا توجد خدمات متاحة حالياً</p>
                    <Link to="/" className="text-xs text-primary hover:underline">العودة للرئيسية</Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2">
                  {filteredServices.map((s) => (
                    <Card
                      key={s.id}
                      className={`cursor-pointer transition-all ${
                        selectedService?.id === s.id ? "ring-2 ring-primary card-glow-hover" : "hover:card-glow"
                      }`}
                      onClick={() => setSelectedService(s)}
                    >
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div className="flex items-center gap-3">
                          {selectedService?.id === s.id && <CheckCircle className="h-5 w-5 text-primary" />}
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            {s.city && <p className="text-xs text-muted-foreground">{s.city}</p>}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-primary">{s.base_price} {t("price.currency")}</span>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredServices.length === 0 && city.trim() && (
                    <p className="text-center text-sm text-muted-foreground py-4">لا توجد خدمات في هذه المدينة</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Patient Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{t("form.patient_name")} *</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t("form.patient_name.placeholder")} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">{t("form.phone")} *</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder={t("form.phone.placeholder")} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label className="text-sm font-medium">{t("form.date")} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 mt-1 font-normal">
                      <CalendarDays className="h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm font-medium">{t("form.time")} *</Label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {TIME_SLOTS.map((slot) => (
                    <Button
                      key={slot.value}
                      variant={time === slot.value ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => setTime(slot.value)}
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">{t("form.notes")}</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("form.notes.placeholder")} className="mt-1" rows={3} />
              </div>
            </div>
          )}

          {/* Step 3: Payment & Confirmation */}
          {step === 3 && selectedService && (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardContent className="py-4 space-y-2">
                  <h3 className="font-bold text-sm">ملخص الحجز</h3>
                  <div className="text-xs space-y-1.5 text-muted-foreground">
                    <div className="flex justify-between"><span>الخدمة</span><span className="text-foreground font-medium">{selectedService.name}</span></div>
                    <div className="flex justify-between"><span>المريض</span><span className="text-foreground">{customerName}</span></div>
                    <div className="flex justify-between"><span>الهاتف</span><span className="text-foreground" dir="ltr">{customerPhone}</span></div>
                    <div className="flex justify-between"><span>المدينة</span><span className="text-foreground">{city}</span></div>
                    <div className="flex justify-between"><span>الموعد</span><span className="text-foreground">{date ? format(date, "PPP", { locale: ar }) : ""} - {time}</span></div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardContent className="py-4 space-y-3">
                  <h3 className="font-bold text-sm">طريقة الدفع</h3>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="CASH" id="cash" />
                      <Label htmlFor="cash" className="text-sm cursor-pointer">نقداً عند الزيارة</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="CASH_DEPOSIT" id="deposit" />
                      <Label htmlFor="deposit" className="text-sm cursor-pointer">عربون أونلاين + باقي نقداً</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse opacity-50">
                      <RadioGroupItem value="CARD" id="card" disabled />
                      <Label htmlFor="card" className="text-sm cursor-pointer">بطاقة ائتمان (قريباً)</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Price Summary */}
              <Card className="border-2 border-primary/20">
                <CardContent className="py-4 space-y-2">
                  <h3 className="font-bold text-sm">تفاصيل السعر</h3>
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("price.base")}</span><span>{subtotal} {t("price.currency")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("price.commission")}</span><span>{platformFee} {t("price.currency")}</span></div>
                    {paymentMethod === "CASH_DEPOSIT" && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-primary"><span>العربون ({settings.deposit_percent}%)</span><span className="font-bold">{depositAmount} {t("price.currency")}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">المتبقي نقداً</span><span>{remainingCash} {t("price.currency")}</span></div>
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold"><span>{t("price.total")}</span><span className="text-primary text-lg">{subtotal} {t("price.currency")}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
