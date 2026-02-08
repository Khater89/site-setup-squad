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
    "app.name": "Medical Field Nation",
    "app.tagline": "خدمات طبية ميدانية احترافية",

    // Navigation
    "nav.home": "الرئيسية",
    "nav.booking": "حجز خدمة",
    "nav.about": "عن المنصة",
    "nav.services": "الخدمات",

    // Booking Form
    "booking.title": "احجز خدمتك الطبية",
    "booking.subtitle": "اختر نوع الخدمة واملأ بياناتك لحجز موعدك",
    "booking.step1": "اختر الخدمة",
    "booking.step2": "بيانات المريض",
    "booking.step3": "تأكيد الحجز",
    "booking.summary": "ملخص الحجز",

    // Service Categories
    "service.category.medical": "خدمات طبية",
    "service.category.nursing": "تمريض منزلي",

    // Medical Services
    "service.general_medicine": "طب عام وتشخيص",
    "service.general_medicine.desc": "كشف طبي عام وتشخيص في المنزل",
    "service.emergency": "خدمات الطوارئ",
    "service.emergency.desc": "خدمات طبية طارئة في المنزل",
    "service.fracture_treatment": "علاج الكسور",
    "service.fracture_treatment.desc": "تشخيص وعلاج الكسور منزلياً",
    "service.wound_suturing": "تخييط الجروح",
    "service.wound_suturing.desc": "خياطة وإغلاق الجروح منزلياً",

    // Nursing Services
    "service.home_nursing": "تمريض منزلي",
    "service.home_nursing.desc": "خدمات تمريضية شاملة في المنزل",
    "service.elderly_care": "رعاية كبار السن",
    "service.elderly_care.desc": "رعاية متخصصة لكبار السن في المنزل",
    "service.patient_companion": "مرافق/ة مريض (24 ساعة)",
    "service.patient_companion.desc": "مرافقة المريض على مدار الساعة",
    "service.home_physiotherapy": "علاج طبيعي منزلي",
    "service.home_physiotherapy.desc": "جلسات علاج طبيعي متكاملة في المنزل",
    "service.home_xray": "تصوير أشعة منزلي",
    "service.home_xray.desc": "تصوير أشعة في المنزل بأجهزة محمولة",
    "service.patient_transport": "نقل مرضى",
    "service.patient_transport.desc": "خدمة نقل المرضى بأمان وراحة",
    "service.medical_equipment": "توفير أجهزة ومستلزمات طبية",
    "service.medical_equipment.desc": "توفير وتأجير الأجهزة والمستلزمات الطبية",
    "service.iv_fluids": "محاليل وريدية (IV Fluids)",
    "service.iv_fluids.desc": "إعطاء محاليل وريدية في المنزل",
    "service.injections": "حقن وإبر (عضلي/وريدي/فيتامينات)",
    "service.injections.desc": "إعطاء حقن عضلية ووريدية وفيتامينات",
    "service.vital_signs": "قياس العلامات الحيوية",
    "service.vital_signs.desc": "قياس ضغط الدم والنبض والحرارة والأكسجين",
    "service.blood_sugar": "قياس سكر الدم + متابعة سكري",
    "service.blood_sugar.desc": "فحص سكر الدم ومتابعة مرضى السكري",
    "service.diabetic_foot_care": "عناية قدم سكري + عناية جلد",
    "service.diabetic_foot_care.desc": "عناية متخصصة بقدم السكري والجلد",
    "service.wound_dressing": "غيارات جروح / تضميد",
    "service.wound_dressing.desc": "تغيير ضمادات الجروح والعناية بها",
    "service.post_surgery_care": "رعاية ما بعد العمليات الجراحية",
    "service.post_surgery_care.desc": "رعاية تمريضية بعد العمليات الجراحية",
    "service.urinary_catheter": "قسطرة بولية (تركيب/تغيير/عناية)",
    "service.urinary_catheter.desc": "تركيب أو تغيير أو عناية بالقسطرة البولية",
    "service.ng_tube": "أنبوب أنفي معدي NG (تركيب/تغيير/عناية)",
    "service.ng_tube.desc": "تركيب أو تغيير أو عناية بالأنبوب الأنفي المعدي",
    "service.home_samples": "سحب عينات منزلية (دم/جروح/زراعة)",
    "service.home_samples.desc": "سحب عينات دم وجروح وزراعة في المنزل",
    "service.home_enema": "حقنة شرجية منزلية",
    "service.home_enema.desc": "إعطاء حقنة شرجية في المنزل",

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
    "landing.hero.sub": "أطباء وممرضون معتمدون يصلون إلى باب منزلك في أي وقت",
    "landing.cta": "احجز موعدك الآن",
    "landing.login": "تسجيل الدخول",
    "landing.feature1": "أطباء معتمدون",
    "landing.feature1.desc": "فريق طبي مرخص وذو خبرة عالية في تقديم الرعاية المنزلية",
    "landing.feature2": "خدمة سريعة",
    "landing.feature2.desc": "نصل إليك خلال ساعات من الحجز أينما كنت",
    "landing.feature3": "أسعار شفافة",
    "landing.feature3.desc": "أسعار واضحة بدون رسوم خفية مع تفصيل كامل",
    "landing.feature4": "متاح 24/7",
    "landing.feature4.desc": "خدمة متوفرة على مدار الساعة طوال أيام الأسبوع",
    "landing.services_title": "خدماتنا",
    "landing.services_sub": "نقدم مجموعة شاملة من الخدمات الطبية والتمريضية في منزلك",
    "landing.pricing_title": "الأسعار",
    "landing.pricing_sub": "أسعار تنافسية وشفافة لجميع خدماتنا",
    "landing.pricing.day_label": "الفترة النهارية",
    "landing.pricing.day_time": "6:00 ص - 9:00 م",
    "landing.pricing.night_label": "الفترة الليلية",
    "landing.pricing.night_time": "9:00 م - 6:00 ص",
    "landing.pricing.first_hour": "الساعة الأولى",
    "landing.pricing.extra_hour": "كل ساعة إضافية",
    "landing.pricing.commission_note": "تُضاف عمولة منصة 10% على إجمالي الخدمة",
    "landing.pricing.materials_note": "الأسعار لا تشمل المواد والمستهلكات الطبية",
    "landing.stats.services": "خدمة طبية",
    "landing.stats.available": "متاح دائماً",
    "landing.stats.cities": "مدن مغطاة",
    "landing.footer.rights": "جميع الحقوق محفوظة",
    "landing.footer.quickLinks": "روابط سريعة",
    "landing.footer.contact": "تواصل معنا",
    "landing.whyus": "لماذا نحن؟",
    "landing.whyus.sub": "نلتزم بتقديم أعلى مستويات الرعاية الطبية في راحة منزلك",

    // How it works
    "landing.howItWorks": "كيف يعمل؟",
    "landing.step1.title": "اختر خدمتك",
    "landing.step1.desc": "تصفح قائمة الخدمات الطبية واختر ما يناسب حالتك",
    "landing.step2.title": "حدد موعدك",
    "landing.step2.desc": "اختر التاريخ والوقت والمكان المناسب لك",
    "landing.step3.title": "نصلك فوراً",
    "landing.step3.desc": "فريقنا الطبي المعتمد يصل إلى باب منزلك",
  },
  en: {
    // Header
    "app.name": "Medical Field Nation",
    "app.tagline": "Professional Field Medical Services",

    // Navigation
    "nav.home": "Home",
    "nav.booking": "Book Service",
    "nav.about": "About",
    "nav.services": "Services",

    // Booking Form
    "booking.title": "Book Your Medical Service",
    "booking.subtitle": "Choose your service type and fill in your details",
    "booking.step1": "Select Service",
    "booking.step2": "Patient Info",
    "booking.step3": "Confirm Booking",
    "booking.summary": "Booking Summary",

    // Service Categories
    "service.category.medical": "Medical Services",
    "service.category.nursing": "Home Nursing",

    // Medical Services
    "service.general_medicine": "General Medicine & Diagnosis",
    "service.general_medicine.desc": "General medical checkup and diagnosis at home",
    "service.emergency": "Emergency Services",
    "service.emergency.desc": "Emergency medical services at home",
    "service.fracture_treatment": "Fracture Treatment",
    "service.fracture_treatment.desc": "Fracture diagnosis and treatment at home",
    "service.wound_suturing": "Wound Suturing",
    "service.wound_suturing.desc": "Wound stitching and closure at home",

    // Nursing Services
    "service.home_nursing": "Home Nursing",
    "service.home_nursing.desc": "Comprehensive nursing services at home",
    "service.elderly_care": "Elderly Care",
    "service.elderly_care.desc": "Specialized elderly care at home",
    "service.patient_companion": "Patient Companion (24h)",
    "service.patient_companion.desc": "Around-the-clock patient companionship",
    "service.home_physiotherapy": "Home Physiotherapy",
    "service.home_physiotherapy.desc": "Complete physiotherapy sessions at home",
    "service.home_xray": "Home X-ray Imaging",
    "service.home_xray.desc": "Portable X-ray imaging at home",
    "service.patient_transport": "Patient Transport",
    "service.patient_transport.desc": "Safe and comfortable patient transport",
    "service.medical_equipment": "Medical Equipment & Supplies",
    "service.medical_equipment.desc": "Medical equipment and supplies provision & rental",
    "service.iv_fluids": "IV Fluids",
    "service.iv_fluids.desc": "Intravenous fluid administration at home",
    "service.injections": "Injections (IM/IV/Vitamins)",
    "service.injections.desc": "Intramuscular, intravenous, and vitamin injections",
    "service.vital_signs": "Vital Signs Monitoring",
    "service.vital_signs.desc": "Blood pressure, pulse, temperature, and oxygen monitoring",
    "service.blood_sugar": "Blood Sugar + Diabetes Follow-up",
    "service.blood_sugar.desc": "Blood sugar testing and diabetes management",
    "service.diabetic_foot_care": "Diabetic Foot + Skin Care",
    "service.diabetic_foot_care.desc": "Specialized diabetic foot and skin care",
    "service.wound_dressing": "Wound Dressing",
    "service.wound_dressing.desc": "Wound bandage changing and care",
    "service.post_surgery_care": "Post-Surgery Care",
    "service.post_surgery_care.desc": "Post-operative nursing care",
    "service.urinary_catheter": "Urinary Catheter (Insert/Change/Care)",
    "service.urinary_catheter.desc": "Urinary catheter insertion, change, or care",
    "service.ng_tube": "NG Tube (Insert/Change/Care)",
    "service.ng_tube.desc": "Nasogastric tube insertion, change, or care",
    "service.home_samples": "Home Sample Collection (Blood/Wound/Culture)",
    "service.home_samples.desc": "Blood, wound, and culture sample collection at home",
    "service.home_enema": "Home Enema",
    "service.home_enema.desc": "Enema administration at home",

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
    "landing.hero.sub": "Licensed doctors and nurses arriving at your doorstep anytime you need",
    "landing.cta": "Book Your Appointment",
    "landing.login": "Login",
    "landing.feature1": "Licensed Doctors",
    "landing.feature1.desc": "Experienced and certified medical team specialized in home care",
    "landing.feature2": "Fast Service",
    "landing.feature2.desc": "We reach you within hours of booking wherever you are",
    "landing.feature3": "Transparent Pricing",
    "landing.feature3.desc": "Clear prices with no hidden fees and full breakdown",
    "landing.feature4": "Available 24/7",
    "landing.feature4.desc": "Service available around the clock, every day of the week",
    "landing.services_title": "Our Services",
    "landing.services_sub": "A comprehensive range of medical and nursing services at your home",
    "landing.pricing_title": "Pricing",
    "landing.pricing_sub": "Competitive and transparent pricing for all our services",
    "landing.pricing.day_label": "Daytime",
    "landing.pricing.day_time": "6:00 AM - 9:00 PM",
    "landing.pricing.night_label": "Nighttime",
    "landing.pricing.night_time": "9:00 PM - 6:00 AM",
    "landing.pricing.first_hour": "First Hour",
    "landing.pricing.extra_hour": "Each Additional Hour",
    "landing.pricing.commission_note": "A 10% platform fee is added to the service total",
    "landing.pricing.materials_note": "Prices do not include medical materials and supplies",
    "landing.stats.services": "Medical Services",
    "landing.stats.available": "Always Available",
    "landing.stats.cities": "Cities Covered",
    "landing.footer.rights": "All rights reserved",
    "landing.footer.quickLinks": "Quick Links",
    "landing.footer.contact": "Contact Us",
    "landing.whyus": "Why Choose Us?",
    "landing.whyus.sub": "We're committed to delivering the highest quality medical care in the comfort of your home",

    // How it works
    "landing.howItWorks": "How It Works",
    "landing.step1.title": "Choose Your Service",
    "landing.step1.desc": "Browse our medical services and select what fits your needs",
    "landing.step2.title": "Schedule Your Visit",
    "landing.step2.desc": "Pick your preferred date, time, and location",
    "landing.step3.title": "We Come to You",
    "landing.step3.desc": "Our certified medical team arrives at your doorstep",
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
