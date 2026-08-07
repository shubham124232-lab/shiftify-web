// 18 NDIS service categories. Single source — used in posting flow, filters,
// worker profile setup, participant needs, etc.
// Each category carries a `group` tag (Domestic / Social / Personal Care / Nursing /
// Allied Health / Other) so the same 18 values can be displayed under a 5-category
// taxonomy without changing the underlying JobCategory enum (avoids a migration).
export const CATEGORY_GROUPS = [
  "Domestic Support",
  "Social Support",
  "Personal Care",
  "Nursing",
  "Allied Health",
  "Other / NDIS-Specific",
] as const;

export type CategoryGroup = (typeof CATEGORY_GROUPS)[number];

export const JOB_CATEGORIES = [
  { value: "PERSONAL_CARE", label: "Personal Care", group: "Personal Care" },
  { value: "COMMUNITY_ACCESS", label: "Community Access", group: "Social Support" },
  { value: "DOMESTIC_ASSISTANCE", label: "Domestic Assistance", group: "Domestic Support" },
  { value: "TRANSPORT", label: "Transport Support", group: "Social Support" },
  { value: "SOCIAL_RECREATIONAL", label: "Social / Recreational Support", group: "Social Support" },
  { value: "NURSING_COMPLEX_CARE", label: "Nursing & Complex Care", group: "Nursing" },
  { value: "THERAPY_ASSISTANCE", label: "Therapy Assistance", group: "Allied Health" },
  { value: "OVERNIGHT_SUPPORT", label: "Overnight Support", group: "Other / NDIS-Specific" },
  { value: "BEHAVIOUR_SUPPORT", label: "Behaviour Support Related Assistance", group: "Allied Health" },
  { value: "HIGH_INTENSITY", label: "High Intensity Daily Personal Activities", group: "Personal Care" },
  { value: "SIL_SUPPORT", label: "Supported Independent Living Related Support", group: "Other / NDIS-Specific" },
  { value: "RESPITE", label: "Respite Support", group: "Nursing" },
  { value: "COMPANIONSHIP", label: "Companionship / Routine Support", group: "Social Support" },
  { value: "MEDICATION_ASSISTANCE", label: "Medication Prompting / Assistance", group: "Nursing" },
  { value: "MEAL_PREPARATION", label: "Meal Preparation Support", group: "Domestic Support" },
  { value: "SHOPPING_ERRANDS", label: "Shopping / Errands Support", group: "Domestic Support" },
  { value: "APPOINTMENT_SUPPORT", label: "Appointment Support", group: "Social Support" },
  { value: "OTHER", label: "Other", group: "Other / NDIS-Specific" },
] as const;

export type JobCategoryValue = (typeof JOB_CATEGORIES)[number]["value"];
