import { MedicalService, PeriodType, calculateHourlyPricing } from "./services";

// ============================================================
// Google Sheets Integration via Apps Script Web App
// ============================================================
//
// الخطوات لإعداد الربط:
//
// 1. افتح Google Sheets جديد أو الموجود
//
// 2. أضف هذه العناوين في الصف الأول (Row 1):
//    A: Timestamp | B: الاسم | C: طوارئ | D: الهاتف | E: المدينة
//    F: الخدمة | G: التاريخ | H: الوقت | I: الساعات | J: الفترة
//    K: السعر الأساسي | L: العمولة | M: الإجمالي | N: ملاحظات | O: البريد
//
// 3. افتح Extensions → Apps Script
//
// 4. الصق الكود التالي (انسخه من الأسفل)
//
// 5. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
//    → Deploy → انسخ الرابط
//
// 6. الصق الرابط في GOOGLE_APPS_SCRIPT_URL أدناه
//
// ============================================================

/**
 * ⬇️ الصق رابط Apps Script Web App هنا ⬇️
 * مثال: "https://script.google.com/macros/s/AKfycb.../exec"
 */
const GOOGLE_APPS_SCRIPT_URL = "";

// ============================================================
// 📋 كود Apps Script — انسخه والصقه في Google Apps Script
// ============================================================
//
// function doPost(e) {
//   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//   var data = JSON.parse(e.postData.contents);
//
//   sheet.appendRow([
//     new Date(),              // A: Timestamp
//     data.patientName,        // B: الاسم
//     data.isEmergency,        // C: طوارئ
//     data.phone,              // D: الهاتف
//     data.city,               // E: المدينة
//     data.service,            // F: الخدمة
//     data.date,               // G: التاريخ
//     data.time,               // H: الوقت
//     data.hours,              // I: الساعات
//     data.period,             // J: الفترة
//     data.basePrice,          // K: السعر الأساسي
//     data.commission,         // L: العمولة
//     data.total,              // M: الإجمالي
//     data.notes || "",        // N: ملاحظات
//     data.email || ""         // O: البريد
//   ]);
//
//   return ContentService
//     .createTextOutput(JSON.stringify({ result: "success" }))
//     .setMimeType(ContentService.MimeType.JSON);
// }
//
// function doGet() {
//   return ContentService
//     .createTextOutput(JSON.stringify({ result: "ok" }))
//     .setMimeType(ContentService.MimeType.JSON);
// }
//
// ============================================================

export interface BookingPayload {
  patientName: string;
  isEmergency: string;
  phone: string;
  city: string;
  service: string;
  date: string;
  notes: string;
  time: string;
  email: string;
  hours: number;
  period: string;
  basePrice: number;
  commission: number;
  total: number;
}

// Map our service IDs to Arabic labels for the sheet
const SERVICE_LABELS: Record<string, string> = {
  // Medical
  general_medicine: "طب عام وتشخيص",
  emergency: "خدمات الطوارئ",
  fracture_treatment: "علاج الكسور",
  wound_suturing: "تخييط الجروح",
  // Nursing
  home_nursing: "تمريض منزلي",
  elderly_care: "رعاية كبار السن",
  patient_companion: "مرافق/ة مريض (24 ساعة)",
  home_physiotherapy: "علاج طبيعي منزلي",
  home_xray: "تصوير أشعة منزلي",
  patient_transport: "نقل مرضى",
  medical_equipment: "توفير أجهزة ومستلزمات طبية",
  iv_fluids: "محاليل وريدية (IV Fluids)",
  injections: "حقن وإبر (عضلي/وريدي/فيتامينات)",
  vital_signs: "قياس العلامات الحيوية",
  blood_sugar: "قياس سكر الدم + متابعة سكري",
  diabetic_foot_care: "عناية قدم سكري + عناية جلد",
  wound_dressing: "غيارات جروح / تضميد",
  post_surgery_care: "رعاية ما بعد العمليات الجراحية",
  urinary_catheter: "قسطرة بولية (تركيب/تغيير/عناية)",
  ng_tube: "أنبوب أنفي معدي NG (تركيب/تغيير/عناية)",
  home_samples: "سحب عينات منزلية (دم/جروح/زراعة)",
  home_enema: "حقنة شرجية منزلية",
};

export function buildBookingPayload(
  service: MedicalService,
  patient: {
    name: string;
    isEmergency: boolean;
    phone: string;
    email: string;
    city: string;
    date: Date | undefined;
    time: string;
    hours: number;
    notes: string;
  },
  lang: "ar" | "en"
): BookingPayload {
  const timeLabels: Record<string, Record<string, string>> = {
    ar: { morning: "صباحاً", afternoon: "ظهراً", evening: "مساءً" },
    en: { morning: "Morning", afternoon: "Afternoon", evening: "Evening" },
  };

  const period: PeriodType = patient.time === "evening" ? "night" : "day";
  const pricing = calculateHourlyPricing(period, patient.hours);

  return {
    patientName: patient.name.trim(),
    isEmergency: patient.isEmergency ? "نعم" : "لا",
    phone: patient.phone.trim(),
    city: patient.city.trim(),
    service: SERVICE_LABELS[service.id] || service.id,
    date: patient.date ? patient.date.toISOString().split("T")[0] : "",
    notes: patient.notes.trim(),
    time: timeLabels[lang][patient.time] || patient.time,
    email: patient.email.trim(),
    hours: patient.hours,
    period: period === "day" ? "نهاري (6ص - 9م)" : "ليلي (9م - 6ص)",
    basePrice: pricing.basePrice,
    commission: pricing.commission,
    total: pricing.total,
  };
}

/**
 * Submit booking data to Google Sheets via Apps Script Web App.
 * Falls back to success in dev mode if no URL is configured.
 */
export async function submitToGoogleSheets(
  payload: BookingPayload
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn(
      "[GoogleSheets] ⚠️ لم يتم إعداد رابط Apps Script بعد.\n" +
      "الصق الرابط في GOOGLE_APPS_SCRIPT_URL داخل src/lib/googleSheets.ts\n" +
      "البيانات المرسلة:",
      payload
    );
    // Return success so the UI flow works during development
    return { success: true };
  }

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "خطأ غير معروف أثناء الإرسال";
    console.error("[GoogleSheets] فشل الإرسال:", message);
    return { success: false, error: message };
  }
}
