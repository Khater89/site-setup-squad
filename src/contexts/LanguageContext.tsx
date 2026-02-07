import React, { createContext, useContext, useState, useCallback } from "react";

type Language = "ar" | "en";
type Dir = "rtl" | "ltr";

interface LanguageContextType {
  lang: Language;
  dir: Dir;
  isRTL: boolean;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Header
    "app.name": "طبيبك بالبيت",
    "app.tagline": "خدمات طبية منزلية احترافية",
    
    // Navigation
    "nav.home": "الرئيسية",
    "nav.booking": "حجز خدمة",
    "nav.about": "عن المنصة",
    
    // Booking Form
    "booking.title": "احجز خدمتك الطبية",
    "booking.subtitle": "اختر نوع الخدمة واملأ بياناتك لحجز موعدك",
    "booking.step1": "اختر الخدمة",
    "booking.step2": "بيانات المريض",
    "booking.step3": "تأكيد الحجز",
    
    // Service Categories
    "service.category.medical": "خدمات طبية",
    "service.category.nursing": "خدمات تمريضية",
    "service.category.therapy": "علاج طبيعي",
    "service.category.lab": "تحاليل مخبرية",
    
    // Medical Services
    "service.doctor_visit": "زيارة طبيب منزلية",
    "service.doctor_visit.desc": "كشف طبي عام في المنزل مع تقرير مفصل",
    "service.specialist": "استشارة أخصائي",
    "service.specialist.desc": "استشارة طبية متخصصة في المنزل",
    "service.followup": "متابعة طبية",
    "service.followup.desc": "زيارة متابعة بعد العلاج أو العملية",
    
    // Nursing Services
    "service.injection": "حقن وريدي / عضلي",
    "service.injection.desc": "إعطاء حقن أو محاليل وريدية في المنزل",
    "service.wound_care": "عناية بالجروح",
    "service.wound_care.desc": "تضميد وعناية بالجروح والقروح",
    "service.vital_signs": "قياسات حيوية",
    "service.vital_signs.desc": "قياس ضغط الدم والسكر والحرارة",
    "service.catheter": "قسطرة بولية",
    "service.catheter.desc": "تركيب أو تغيير قسطرة بولية",
    
    // Therapy Services
    "service.physio_session": "جلسة علاج طبيعي",
    "service.physio_session.desc": "جلسة علاج طبيعي متكاملة في المنزل",
    "service.rehab": "تأهيل بعد العمليات",
    "service.rehab.desc": "برنامج تأهيل بعد العمليات الجراحية",
    
    // Lab Services
    "service.blood_test": "سحب عينة دم",
    "service.blood_test.desc": "سحب عينة دم وإرسالها للمختبر",
    "service.full_checkup": "فحص شامل",
    "service.full_checkup.desc": "فحص دم شامل مع تقرير مفصل",
    
    // Patient Form
    "form.patient_name": "اسم المريض",
    "form.patient_name.placeholder": "أدخل الاسم الكامل",
    "form.phone": "رقم الهاتف",
    "form.phone.placeholder": "05XXXXXXXX",
    "form.email": "البريد الإلكتروني (اختياري)",
    "form.email.placeholder": "email@example.com",
    "form.emergency": "هل الحالة طارئة؟",
    "form.emergency.yes": "نعم",
    "form.emergency.no": "لا",
    "form.city": "المنطقة / المدينة",
    "form.city.placeholder": "مثال: عمان، الرياض، جدة",
    "form.address": "العنوان التفصيلي",
    "form.date": "التاريخ المفضل",
    "form.time": "الوقت المفضل",
    "form.notes": "ملاحظات إضافية",
    "form.notes.placeholder": "أي معلومات إضافية تود إخبارنا بها...",
    
    // Time slots
    "time.morning": "صباحاً (8-12)",
    "time.afternoon": "ظهراً (12-4)",
    "time.evening": "مساءً (4-8)",
    
    // Pricing
    "price.base": "سعر الخدمة",
    "price.commission": "رسوم المنصة (10%)",
    "price.total": "الإجمالي",
    "price.currency": "د.أ",
    "price.first_hour": "الساعة الأولى",
    "price.additional_hour": "ساعة إضافية",
    "price.subtotal": "المجموع الفرعي",
    "price.materials_note": "* الأسعار غير شاملة المواد الطبية",
    "price.starts_from": "يبدأ من",
    "price.per_hour": "ساعة",
    "price.period": "فترة الخدمة",
    "price.period.day": "نهاري (6ص - 9م)",
    "price.period.night": "ليلي (9م - 6ص)",
    
    // Hours
    "form.hours": "عدد الساعات",
    "form.hours.single": "ساعة",
    "form.hours.plural": "ساعات",
    
    // Actions
    "action.next": "التالي",
    "action.back": "رجوع",
    "action.confirm": "تأكيد الحجز",
    "action.submit": "إرسال الطلب",
    "action.book_now": "احجز الآن",
    
    // Status
    "status.success": "تم إرسال طلبك بنجاح!",
    "status.success.desc": "سنتواصل معك قريباً لتأكيد الموعد",
    "status.pending": "في انتظار التأكيد",
    "status.submitting": "جارٍ إرسال الطلب...",
    "status.error": "حدث خطأ أثناء الإرسال",
    "status.error.desc": "يرجى المحاولة مرة أخرى",
    
    // Landing
    "landing.hero": "خدمات طبية منزلية موثوقة",
    "landing.hero.sub": "أطباء وممرضين معتمدين يصلون إلى باب منزلك",
    "landing.cta": "احجز موعدك الآن",
    "landing.feature1": "أطباء معتمدون",
    "landing.feature1.desc": "فريق طبي مرخص وذو خبرة عالية",
    "landing.feature2": "خدمة سريعة",
    "landing.feature2.desc": "نصل إليك خلال ساعات من الحجز",
    "landing.feature3": "أسعار شفافة",
    "landing.feature3.desc": "أسعار واضحة بدون رسوم خفية",
    "landing.feature4": "متاح 24/7",
    "landing.feature4.desc": "خدمة متوفرة على مدار الساعة",
  },
  en: {
    // Header
    "app.name": "TabibBelBeit",
    "app.tagline": "Professional Home Medical Services",
    
    // Navigation
    "nav.home": "Home",
    "nav.booking": "Book Service",
    "nav.about": "About",
    
    // Booking Form
    "booking.title": "Book Your Medical Service",
    "booking.subtitle": "Choose your service type and fill in your details",
    "booking.step1": "Select Service",
    "booking.step2": "Patient Info",
    "booking.step3": "Confirm Booking",
    
    // Service Categories
    "service.category.medical": "Medical Services",
    "service.category.nursing": "Nursing Services",
    "service.category.therapy": "Physical Therapy",
    "service.category.lab": "Lab Tests",
    
    // Medical Services
    "service.doctor_visit": "Home Doctor Visit",
    "service.doctor_visit.desc": "General medical checkup at home with detailed report",
    "service.specialist": "Specialist Consultation",
    "service.specialist.desc": "Specialized medical consultation at home",
    "service.followup": "Follow-up Visit",
    "service.followup.desc": "Follow-up visit after treatment or surgery",
    
    // Nursing Services
    "service.injection": "IV / IM Injection",
    "service.injection.desc": "Administer injections or IV fluids at home",
    "service.wound_care": "Wound Care",
    "service.wound_care.desc": "Wound dressing and care for injuries",
    "service.vital_signs": "Vital Signs Check",
    "service.vital_signs.desc": "Blood pressure, sugar, and temperature monitoring",
    "service.catheter": "Urinary Catheter",
    "service.catheter.desc": "Insert or change urinary catheter",
    
    // Therapy Services
    "service.physio_session": "Physiotherapy Session",
    "service.physio_session.desc": "Complete physiotherapy session at home",
    "service.rehab": "Post-Surgery Rehab",
    "service.rehab.desc": "Rehabilitation program after surgery",
    
    // Lab Services
    "service.blood_test": "Blood Sample Collection",
    "service.blood_test.desc": "Blood sample collection and lab delivery",
    "service.full_checkup": "Full Blood Panel",
    "service.full_checkup.desc": "Comprehensive blood test with detailed report",
    
    // Patient Form
    "form.patient_name": "Patient Name",
    "form.patient_name.placeholder": "Enter full name",
    "form.phone": "Phone Number",
    "form.phone.placeholder": "05XXXXXXXX",
    "form.email": "Email (Optional)",
    "form.email.placeholder": "email@example.com",
    "form.emergency": "Is it an emergency?",
    "form.emergency.yes": "Yes",
    "form.emergency.no": "No",
    "form.city": "Area / City",
    "form.city.placeholder": "e.g. Amman, Riyadh, Jeddah",
    "form.address": "Detailed Address",
    "form.address.placeholder": "City, district, street, building number",
    "form.date": "Preferred Date",
    "form.time": "Preferred Time",
    "form.notes": "Additional Notes",
    "form.notes.placeholder": "Any additional information you'd like to share...",
    
    // Time slots
    "time.morning": "Morning (8-12)",
    "time.afternoon": "Afternoon (12-4)",
    "time.evening": "Evening (4-8)",
    
    // Pricing
    "price.base": "Service Price",
    "price.commission": "Platform Fee (10%)",
    "price.total": "Total",
    "price.currency": "JOD",
    "price.first_hour": "First Hour",
    "price.additional_hour": "Additional Hour",
    "price.subtotal": "Subtotal",
    "price.materials_note": "* Prices do not include medical materials",
    "price.starts_from": "From",
    "price.per_hour": "hr",
    "price.period": "Service Period",
    "price.period.day": "Day (6AM - 9PM)",
    "price.period.night": "Night (9PM - 6AM)",
    
    // Hours
    "form.hours": "Number of Hours",
    "form.hours.single": "hour",
    "form.hours.plural": "hours",
    
    // Actions
    "action.next": "Next",
    "action.back": "Back",
    "action.confirm": "Confirm Booking",
    "action.submit": "Submit Request",
    "action.book_now": "Book Now",
    
    // Status
    "status.success": "Your request has been submitted!",
    "status.success.desc": "We'll contact you shortly to confirm the appointment",
    "status.pending": "Pending Confirmation",
    "status.submitting": "Submitting your request...",
    "status.error": "Submission failed",
    "status.error.desc": "Please try again",
    
    // Landing
    "landing.hero": "Trusted Home Medical Services",
    "landing.hero.sub": "Licensed doctors and nurses at your doorstep",
    "landing.cta": "Book Your Appointment",
    "landing.feature1": "Licensed Doctors",
    "landing.feature1.desc": "Experienced and certified medical team",
    "landing.feature2": "Fast Service",
    "landing.feature2.desc": "We reach you within hours of booking",
    "landing.feature3": "Transparent Pricing",
    "landing.feature3.desc": "Clear prices with no hidden fees",
    "landing.feature4": "Available 24/7",
    "landing.feature4.desc": "Service available around the clock",
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("ar");

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  }, []);

  const t = useCallback(
    (key: string) => translations[lang][key] || key,
    [lang]
  );

  const dir: Dir = lang === "ar" ? "rtl" : "ltr";
  const isRTL = lang === "ar";

  return (
    <LanguageContext.Provider value={{ lang, dir, isRTL, toggleLang, t }}>
      <div dir={dir} className={lang === "ar" ? "font-arabic" : "font-sans"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
