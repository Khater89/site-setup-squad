import type { DbService } from "@/hooks/useServices";
import { PeriodType, calculateHourlyPricing } from "./services";

// ============================================================
// Google Sheets Integration via Apps Script Web App
// ============================================================

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzN9ddKCvuDi6mGT8Gop943oPY4hU1YdpHX6rSgVEsrRaMvny22NOS0HA-d_NMShimd/exec";

export interface BookingPayload {
  patientName: string;
  phone: string;
  city: string;
  address: string;
  service: string;
  date: string;
  notes: string;
  time: string;
  hours: number;
  period: string;
  basePrice: number;
  commission: number;
  total: number;
}

export function buildBookingPayload(
  service: DbService,
  patient: {
    name: string;
    phone: string;
    city: string;
    address: string;
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
    phone: patient.phone.trim(),
    city: patient.city.trim(),
    address: patient.address.trim(),
    service: service.name,
    date: patient.date ? patient.date.toISOString().split("T")[0] : "",
    notes: patient.notes.trim(),
    time: timeLabels[lang][patient.time] || patient.time,
    hours: patient.hours,
    period: period === "day" ? "نهاري (6ص - 9م)" : "ليلي (9م - 6ص)",
    basePrice: pricing.basePrice,
    commission: pricing.commission,
    total: pricing.total,
  };
}

/**
 * Submit booking data to Google Sheets via Apps Script Web App.
 */
export async function submitToGoogleSheets(
  payload: BookingPayload
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    console.warn("[GoogleSheets] ⚠️ No Apps Script URL configured.");
    return { success: true };
  }

  try {
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GoogleSheets] Submit failed:", message);
    return { success: false, error: message };
  }
}
