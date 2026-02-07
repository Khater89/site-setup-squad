import { MedicalService, calculatePricing } from "./services";

// ============================================================
// Google Sheets Integration via Apps Script
// ============================================================
// 1. Create a Google Sheet with these columns:
//    Timestamp | Service | Category | Patient | Phone | Email |
//    Address | Date | Time | Notes | BasePrice | Commission | Total | Status
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
//     data.service,              // Service name
//     data.category,             // Category
//     data.patientName,          // Patient name
//     data.phone,                // Phone
//     data.email || "",          // Email
//     data.address,              // Address
//     data.date,                 // Preferred date
//     data.time,                 // Preferred time
//     data.notes || "",          // Notes
//     data.basePrice,            // Base price
//     data.commission,           // Commission (10%)
//     data.total,                // Total
//     "جديد"                    // Status = "New"
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
  service: string;
  category: string;
  patientName: string;
  phone: string;
  email: string;
  address: string;
  date: string;
  time: string;
  notes: string;
  basePrice: number;
  commission: number;
  total: number;
}

export function buildBookingPayload(
  service: MedicalService,
  patient: {
    name: string;
    phone: string;
    email: string;
    address: string;
    date: Date | undefined;
    time: string;
    notes: string;
  },
  lang: "ar" | "en"
): BookingPayload {
  const pricing = calculatePricing(service.basePrice);

  return {
    service: service.nameKey, // translation key – the sheet can store the key or resolved name
    category: service.category,
    patientName: patient.name.trim(),
    phone: patient.phone.trim(),
    email: patient.email.trim(),
    address: patient.address.trim(),
    date: patient.date ? patient.date.toISOString().split("T")[0] : "",
    time: patient.time,
    notes: patient.notes.trim(),
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
      headers: { "Content-Type": "text/plain" }, // Apps Script prefers text/plain to avoid CORS preflight
      body: JSON.stringify(payload),
      mode: "no-cors", // Apps Script doesn't return CORS headers
    });

    // With no-cors mode, we can't read the response body,
    // so we assume success if no network error was thrown.
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error submitting to Google Sheets";
    console.error("[GoogleSheets] Submission failed:", message);
    return { success: false, error: message };
  }
}
