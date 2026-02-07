export type ServiceCategory = "medical" | "nursing" | "therapy" | "lab";

export interface MedicalService {
  id: string;
  nameKey: string;
  descKey: string;
  category: ServiceCategory;
  icon: string; // lucide icon name
}

export const COMMISSION_RATE = 0.1; // 10%

// Hourly pricing config
export const HOURLY_PRICING = {
  day: { firstHour: 50, additionalHour: 20, label: "6:00 AM – 9:00 PM" },
  night: { firstHour: 70, additionalHour: 20, label: "9:00 PM – 6:00 AM" },
} as const;

export type PeriodType = "day" | "night";

export function calculateHourlyPricing(period: PeriodType, hours: number) {
  const config = HOURLY_PRICING[period];
  if (hours <= 0) return { basePrice: 0, commission: 0, total: 0 };

  const basePrice = config.firstHour + Math.max(0, hours - 1) * config.additionalHour;
  const commission = Math.round(basePrice * COMMISSION_RATE);
  const total = basePrice + commission;
  return { basePrice, commission, total };
}

export const services: MedicalService[] = [
  // Medical Services
  {
    id: "doctor_visit",
    nameKey: "service.doctor_visit",
    descKey: "service.doctor_visit.desc",
    category: "medical",
    icon: "Stethoscope",
  },
  {
    id: "specialist",
    nameKey: "service.specialist",
    descKey: "service.specialist.desc",
    category: "medical",
    icon: "UserRound",
  },
  {
    id: "followup",
    nameKey: "service.followup",
    descKey: "service.followup.desc",
    category: "medical",
    icon: "ClipboardCheck",
  },

  // Nursing Services
  {
    id: "injection",
    nameKey: "service.injection",
    descKey: "service.injection.desc",
    category: "nursing",
    icon: "Syringe",
  },
  {
    id: "wound_care",
    nameKey: "service.wound_care",
    descKey: "service.wound_care.desc",
    category: "nursing",
    icon: "HeartPulse",
  },
  {
    id: "vital_signs",
    nameKey: "service.vital_signs",
    descKey: "service.vital_signs.desc",
    category: "nursing",
    icon: "Activity",
  },
  {
    id: "catheter",
    nameKey: "service.catheter",
    descKey: "service.catheter.desc",
    category: "nursing",
    icon: "CircleDot",
  },

  // Physical Therapy
  {
    id: "physio_session",
    nameKey: "service.physio_session",
    descKey: "service.physio_session.desc",
    category: "therapy",
    icon: "Dumbbell",
  },
  {
    id: "rehab",
    nameKey: "service.rehab",
    descKey: "service.rehab.desc",
    category: "therapy",
    icon: "Accessibility",
  },

  // Lab Services
  {
    id: "blood_test",
    nameKey: "service.blood_test",
    descKey: "service.blood_test.desc",
    category: "lab",
    icon: "TestTube",
  },
  {
    id: "full_checkup",
    nameKey: "service.full_checkup",
    descKey: "service.full_checkup.desc",
    category: "lab",
    icon: "FlaskConical",
  },
];

export const categoryConfig: Record<
  ServiceCategory,
  { labelKey: string; icon: string; color: string }
> = {
  medical: {
    labelKey: "service.category.medical",
    icon: "Stethoscope",
    color: "primary",
  },
  nursing: {
    labelKey: "service.category.nursing",
    icon: "HeartPulse",
    color: "info",
  },
  therapy: {
    labelKey: "service.category.therapy",
    icon: "Dumbbell",
    color: "success",
  },
  lab: {
    labelKey: "service.category.lab",
    icon: "TestTube",
    color: "accent",
  },
};

export function getServicesByCategory(category: ServiceCategory) {
  return services.filter((s) => s.category === category);
}
