import { MedicalService, PeriodType, calculateHourlyPricing } from "./services";

// ============================================================
// Google Sheets Integration via Apps Script
// ============================================================
// 1. Use the existing Google Sheet (MFN.xlsx columns).
//
// 2. Open Extensions → Apps Script and paste the code from
//    the APPS_SCRIPT_CODE comment below.
//
// 3. Deploy → New Deployment → Web App → Execute as "Me",
//    Who has access "Anyone" → Deploy → Copy the URL.
//
// 4. Paste the URL below in GOOGLE_SHEETS_URL.
// ============================================================

/**
 * Replace this with your deployed Apps Script Web App URL.
 * Example: "https://script.google.com/macros/s/AKfycb.../exec"
 */
const GOOGLE_SHEETS_URL = "";

// ---------- Apps Script Code (copy into your Google Sheet) ----------
// function doPost(e) {
//   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//   var data = JSON.parse(e.postData.contents);
//
//   sheet.appendRow([
//     new Date(),                // Timestamp
//     data.patientName,          // الاسم الكامل
//     data.isEmergency,          // هل الحالة طارئة؟
//     data.phone,                // رقم الهاتف
//     data.city,                 // المنطقة / المدينة
//     data.service,              // نوع الخدمة المطلوبة
//     data.date,                 // الوقت أو التاريخ المفضل للخدمة
//     data.notes || "",          // ملاحظات إضافية
//     "",                        // Column 8 (فارغ)
//     data.time,                 // الوقت المفضل للخدمة
//     data.email || ""           // Email Address
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
// -------------------------------------------------------------------

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
    isEmergency: patient.isEmergency
      ? lang === "ar" ? "نعم" : "Yes"
      : lang === "ar" ? "لا" : "No",
    phone: patient.phone.trim(),
    city: patient.city.trim(),
    service: service.nameKey,
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

export async function submitToGoogleSheets(
  payload: BookingPayload
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SHEETS_URL) {
    console.warn(
      "[GoogleSheets] No URL configured. Set GOOGLE_SHEETS_URL in src/lib/googleSheets.ts"
    );
    // Return success anyway so the UI flow works during development
    return { success: true };
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error submitting to Google Sheets";
    console.error("[GoogleSheets] Submission failed:", message);
    return { success: false, error: message };
  }
}
