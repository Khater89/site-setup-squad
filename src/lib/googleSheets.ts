import { MedicalService, PeriodType, calculateHourlyPricing } from "./services";

// ============================================================
// Google Forms Integration
// ============================================================
// Form: نموذج حجز خدمات تمريض منزلي – Medical Field Nation
// Submissions are sent directly to the Google Form's formResponse endpoint.
// ============================================================

const GOOGLE_FORM_ACTION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScVOTnLKji97e5gOUz8FSOg9DPXlC912AHeC0Yug5DwfYeOwA/formResponse";

// Google Form entry IDs (extracted from form HTML)
const FORM_ENTRIES = {
  email: "emailAddress",          // Email (built-in)
  fullName: "entry.74523402",     // الاسم الكامل
  emergency: "entry.2118343810",  // هل الحالة طارئة؟
  phone: "entry.1437637396",      // رقم الهاتف (يفضل واتساب)
  city: "entry.1094225640",       // المنطقة / المدينة
  service: "entry.1984300273",    // نوع الخدمة المطلوبة
  date: "entry.1115209118",       // الوقت أو التاريخ المفضل للخدمة (date)
  time: "entry.2088069351",       // الوقت المفضل للخدمة (time)
  notes: "entry.357922041",       // ملاحظات إضافية
} as const;

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

// Map our service IDs to the Google Form dropdown options
const SERVICE_FORM_LABELS: Record<string, string> = {
  home_nursing: "تمريض منزلي",
  elderly_care: "رعاية كبار السن",
  patient_companion: "مرافق مريض",
  home_physiotherapy: "علاج طبيعي منزلي",
  wound_dressing: "غيارات جروح",
  iv_fluids: "محاليل / إبر",
  injections: "محاليل / إبر",
  home_xray: "تصوير أشعة منزلي",
  patient_transport: "نقل مرضى",
  // All other services map to "اخرى"
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

  // Resolve to the Google Form dropdown label
  const formServiceLabel =
    SERVICE_FORM_LABELS[service.id] ||
    "اخرى : نرجو التوضيح  في  حقل  الملاحظات";

  return {
    patientName: patient.name.trim(),
    isEmergency: patient.isEmergency
      ? lang === "ar" ? "نعم" : "Yes"
      : lang === "ar" ? "لا" : "No",
    phone: patient.phone.trim(),
    city: patient.city.trim(),
    service: formServiceLabel,
    date: patient.date ? patient.date.toISOString().split("T")[0] : "",
    notes: patient.notes.trim(),
    time: timeLabels[lang][patient.time] || patient.time,
    email: patient.email.trim(),
    hours: patient.hours,
    period: lang === "ar" ? (period === "day" ? "نهاري" : "ليلي") : period,
    basePrice: pricing.basePrice,
    commission: pricing.commission,
    total: pricing.total,
  };
}

/**
 * Submit booking data to Google Form.
 * Uses no-cors mode since we can't read the response from Google Forms,
 * but the data will be submitted successfully.
 */
export async function submitToGoogleSheets(
  payload: BookingPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new URLSearchParams();

    // Map payload to Google Form entry IDs
    if (payload.email) {
      formData.append(FORM_ENTRIES.email, payload.email);
    }
    formData.append(FORM_ENTRIES.fullName, payload.patientName);
    formData.append(FORM_ENTRIES.emergency, payload.isEmergency);
    formData.append(FORM_ENTRIES.phone, payload.phone);
    formData.append(FORM_ENTRIES.city, payload.city);
    formData.append(FORM_ENTRIES.service, payload.service);
    formData.append(FORM_ENTRIES.notes, buildNotesString(payload));

    // Date field: Google Forms date uses _year, _month, _day suffixes
    if (payload.date) {
      const [year, month, day] = payload.date.split("-");
      formData.append(`${FORM_ENTRIES.date}_year`, year);
      formData.append(`${FORM_ENTRIES.date}_month`, month);
      formData.append(`${FORM_ENTRIES.date}_day`, day);
    }

    // Time field: Google Forms time uses _hour, _minute suffixes
    // Map our time slots to approximate hours
    const timeMapping: Record<string, { hour: string; minute: string }> = {
      "صباحاً": { hour: "09", minute: "00" },
      "ظهراً": { hour: "13", minute: "00" },
      "مساءً": { hour: "17", minute: "00" },
      "Morning": { hour: "09", minute: "00" },
      "Afternoon": { hour: "13", minute: "00" },
      "Evening": { hour: "17", minute: "00" },
    };
    const timeParts = timeMapping[payload.time] || { hour: "09", minute: "00" };
    formData.append(`${FORM_ENTRIES.time}_hour`, timeParts.hour);
    formData.append(`${FORM_ENTRIES.time}_minute`, timeParts.minute);

    await fetch(GOOGLE_FORM_ACTION_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    // With no-cors we can't read the response, but the data is submitted
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error submitting to Google Form";
    console.error("[GoogleForm] Submission failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Build a rich notes string that includes pricing info and hours.
 */
function buildNotesString(payload: BookingPayload): string {
  const parts: string[] = [];

  if (payload.notes) {
    parts.push(payload.notes);
  }

  parts.push(`عدد الساعات: ${payload.hours}`);
  parts.push(`الفترة: ${payload.period}`);
  parts.push(`السعر: ${payload.total} د.أ (الأساس: ${payload.basePrice} + عمولة: ${payload.commission})`);

  return parts.join(" | ");
}
