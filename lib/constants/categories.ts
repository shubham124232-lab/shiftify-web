// 18 NDIS service categories. Single source — used in posting flow, filters,
// worker profile setup, etc.
export const JOB_CATEGORIES = [
  { value: "PERSONAL_CARE", label: "Personal Care" },
  { value: "COMMUNITY_ACCESS", label: "Community Access" },
  { value: "DOMESTIC_ASSISTANCE", label: "Domestic Assistance" },
  { value: "TRANSPORT", label: "Transport Support" },
  { value: "SOCIAL_RECREATIONAL", label: "Social / Recreational Support" },
  { value: "NURSING_COMPLEX_CARE", label: "Nursing & Complex Care" },
  { value: "THERAPY_ASSISTANCE", label: "Therapy Assistance" },
  { value: "OVERNIGHT_SUPPORT", label: "Overnight Support" },
  { value: "BEHAVIOUR_SUPPORT", label: "Behaviour Support Related Assistance" },
  { value: "HIGH_INTENSITY", label: "High Intensity Daily Personal Activities" },
  { value: "SIL_SUPPORT", label: "Supported Independent Living Related Support" },
  { value: "RESPITE", label: "Respite Support" },
  { value: "COMPANIONSHIP", label: "Companionship / Routine Support" },
  { value: "MEDICATION_ASSISTANCE", label: "Medication Prompting / Assistance" },
  { value: "MEAL_PREPARATION", label: "Meal Preparation Support" },
  { value: "SHOPPING_ERRANDS", label: "Shopping / Errands Support" },
  { value: "APPOINTMENT_SUPPORT", label: "Appointment Support" },
  { value: "OTHER", label: "Other" },
] as const;

export type JobCategoryValue = (typeof JOB_CATEGORIES)[number]["value"];
