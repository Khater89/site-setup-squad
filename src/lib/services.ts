export type ServiceCategory = "medical" | "nursing" | "therapy" | "lab";

export interface MedicalService {
  id: string;
  nameKey: string;
  descKey: string;
  category: ServiceCategory;
  basePrice: number;
  icon: string; // lucide icon name
}

export const COMMISSION_RATE = 0.1; // 10%

export const services: MedicalService[] = [
  // Medical Services (Higher pricing)
  {
    id: "doctor_visit",
    nameKey: "service.doctor_visit",
    descKey: "service.doctor_visit.desc",
    category: "medical",
    basePrice: 300,
    icon: "Stethoscope",
  },
  {
    id: "specialist",
    nameKey: "service.specialist",
    descKey: "service.specialist.desc",
    category: "medical",
    basePrice: 500,
    icon: "UserRound",
  },
  {
    id: "followup",
    nameKey: "service.followup",
    descKey: "service.followup.desc",
    category: "medical",
    basePrice: 200,
    icon: "ClipboardCheck",
  },

  // Nursing Services (Different/Lower pricing)
  {
    id: "injection",
    nameKey: "service.injection",
    descKey: "service.injection.desc",
    category: "nursing",
    basePrice: 100,
    icon: "Syringe",
  },
  {
    id: "wound_care",
    nameKey: "service.wound_care",
    descKey: "service.wound_care.desc",
    category: "nursing",
    basePrice: 120,
    icon: "HeartPulse",
  },
  {
    id: "vital_signs",
    nameKey: "service.vital_signs",
    descKey: "service.vital_signs.desc",
    category: "nursing",
    basePrice: 80,
    icon: "Activity",
  },
  {
    id: "catheter",
    nameKey: "service.catheter",
    descKey: "service.catheter.desc",
    category: "nursing",
    basePrice: 150,
    icon: "CircleDot",
  },

  // Physical Therapy
  {
    id: "physio_session",
    nameKey: "service.physio_session",
    descKey: "service.physio_session.desc",
    category: "therapy",
    basePrice: 250,
    icon: "Dumbbell",
  },
  {
    id: "rehab",
    nameKey: "service.rehab",
    descKey: "service.rehab.desc",
    category: "therapy",
    basePrice: 350,
    icon: "Accessibility",
  },

  // Lab Services
  {
    id: "blood_test",
    nameKey: "service.blood_test",
    descKey: "service.blood_test.desc",
    category: "lab",
    basePrice: 70,
    icon: "TestTube",
  },
  {
    id: "full_checkup",
    nameKey: "service.full_checkup",
    descKey: "service.full_checkup.desc",
    category: "lab",
    basePrice: 180,
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

export function calculatePricing(basePrice: number) {
  const commission = Math.round(basePrice * COMMISSION_RATE);
  const total = basePrice + commission;
  return { basePrice, commission, total };
}

export function getServicesByCategory(category: ServiceCategory) {
  return services.filter((s) => s.category === category);
}
