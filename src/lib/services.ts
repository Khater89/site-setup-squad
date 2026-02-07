export type ServiceCategory = "medical" | "nursing";

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
    id: "general_medicine",
    nameKey: "service.general_medicine",
    descKey: "service.general_medicine.desc",
    category: "medical",
    icon: "Stethoscope",
  },
  {
    id: "emergency",
    nameKey: "service.emergency",
    descKey: "service.emergency.desc",
    category: "medical",
    icon: "Siren",
  },
  {
    id: "fracture_treatment",
    nameKey: "service.fracture_treatment",
    descKey: "service.fracture_treatment.desc",
    category: "medical",
    icon: "Bone",
  },
  {
    id: "wound_suturing",
    nameKey: "service.wound_suturing",
    descKey: "service.wound_suturing.desc",
    category: "medical",
    icon: "Scissors",
  },

  // Nursing Services
  {
    id: "home_nursing",
    nameKey: "service.home_nursing",
    descKey: "service.home_nursing.desc",
    category: "nursing",
    icon: "HeartPulse",
  },
  {
    id: "elderly_care",
    nameKey: "service.elderly_care",
    descKey: "service.elderly_care.desc",
    category: "nursing",
    icon: "UserRound",
  },
  {
    id: "patient_companion",
    nameKey: "service.patient_companion",
    descKey: "service.patient_companion.desc",
    category: "nursing",
    icon: "Clock",
  },
  {
    id: "home_physiotherapy",
    nameKey: "service.home_physiotherapy",
    descKey: "service.home_physiotherapy.desc",
    category: "nursing",
    icon: "Dumbbell",
  },
  {
    id: "home_xray",
    nameKey: "service.home_xray",
    descKey: "service.home_xray.desc",
    category: "nursing",
    icon: "ScanLine",
  },
  {
    id: "patient_transport",
    nameKey: "service.patient_transport",
    descKey: "service.patient_transport.desc",
    category: "nursing",
    icon: "Ambulance",
  },
  {
    id: "medical_equipment",
    nameKey: "service.medical_equipment",
    descKey: "service.medical_equipment.desc",
    category: "nursing",
    icon: "Package",
  },
  {
    id: "iv_fluids",
    nameKey: "service.iv_fluids",
    descKey: "service.iv_fluids.desc",
    category: "nursing",
    icon: "Droplets",
  },
  {
    id: "injections",
    nameKey: "service.injections",
    descKey: "service.injections.desc",
    category: "nursing",
    icon: "Syringe",
  },
  {
    id: "vital_signs",
    nameKey: "service.vital_signs",
    descKey: "service.vital_signs.desc",
    category: "nursing",
    icon: "Activity",
  },
  {
    id: "blood_sugar",
    nameKey: "service.blood_sugar",
    descKey: "service.blood_sugar.desc",
    category: "nursing",
    icon: "Droplet",
  },
  {
    id: "diabetic_foot_care",
    nameKey: "service.diabetic_foot_care",
    descKey: "service.diabetic_foot_care.desc",
    category: "nursing",
    icon: "Footprints",
  },
  {
    id: "wound_dressing",
    nameKey: "service.wound_dressing",
    descKey: "service.wound_dressing.desc",
    category: "nursing",
    icon: "BandageIcon",
  },
  {
    id: "post_surgery_care",
    nameKey: "service.post_surgery_care",
    descKey: "service.post_surgery_care.desc",
    category: "nursing",
    icon: "ShieldCheck",
  },
  {
    id: "urinary_catheter",
    nameKey: "service.urinary_catheter",
    descKey: "service.urinary_catheter.desc",
    category: "nursing",
    icon: "CircleDot",
  },
  {
    id: "ng_tube",
    nameKey: "service.ng_tube",
    descKey: "service.ng_tube.desc",
    category: "nursing",
    icon: "Pipette",
  },
  {
    id: "home_samples",
    nameKey: "service.home_samples",
    descKey: "service.home_samples.desc",
    category: "nursing",
    icon: "TestTube",
  },
  {
    id: "home_enema",
    nameKey: "service.home_enema",
    descKey: "service.home_enema.desc",
    category: "nursing",
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
};

export function getServicesByCategory(category: ServiceCategory) {
  return services.filter((s) => s.category === category);
}
