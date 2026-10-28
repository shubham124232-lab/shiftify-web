// Support Worker journey — progressive profile (Windows 5-14). The option lists below are the doc's own wording.
// Services map onto the existing JobCategory enum so a worker's profile matches request categories without a new
// taxonomy (the posting catalogue and request filters use the same enum values).

import type { MetadataFieldConfig } from "@/components/profile/DocumentUploadField";

export const WINDOWS = [
  { n: 5,  key: "basic",      title: "Basic worker setup" },
  { n: 6,  key: "intro",      title: "Photo and introduction" },
  { n: 7,  key: "services",   title: "Services and tasks" },
  { n: 8,  key: "experience", title: "Experience and participant groups" },
  { n: 9,  key: "documents",  title: "Qualifications, checks and documents" },
  { n: 10, key: "work",       title: "Work and business details" },
  { n: 11, key: "travel",     title: "Transport and travel" },
  { n: 12, key: "rates",      title: "Rates and preferences" },
  { n: 13, key: "boundaries", title: "Boundaries and environment" },
  { n: 14, key: "visibility", title: "Profile preview and visibility" },
] as const;

export type WindowNumber = (typeof WINDOWS)[number]["n"];

export const WORK_SETUP = [
  { value: "CONTRACTOR", label: "Independent worker" },
  { value: "AGENCY", label: "Employed by a provider or agency" },
  { value: "BOTH", label: "Both" },
] as const;

export const RIGHT_TO_WORK = [
  { value: "CITIZEN", label: "Australian citizen or permanent resident" },
  { value: "VISA_HOLDER", label: "Visa holder" },
  { value: "", label: "Provide later" },
] as const;

export const APPROACH = ["Calm", "Friendly", "Patient", "Structured", "Energetic", "Trauma-informed", "Culturally responsive"];
export const INTERESTS = ["Music", "Sport", "Cooking", "Art and craft", "Gardening", "Animals", "Reading", "Gaming", "Movies", "Travel", "Faith and culture"];
export const EXPERIENCE_BUCKETS = [
  { value: "0-1", label: "Less than 1 year" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-10", label: "5+ years" },
] as const;

// Window 7 — the doc's 18 services (§20 catalogue) with their tasks. `category` is the JobCategory enum value stored in
// servicesOffered; tasks are stored in subServices as "Service › Task".
export interface ServiceDef { label: string; category: string; tasks: string[] }
export const SERVICES: ServiceDef[] = [
  { label: "Personal care", category: "PERSONAL_CARE", tasks: ["Showering", "Bathing", "Dressing", "Grooming", "Toileting", "Continence", "Oral care", "Transfers", "Mobility", "Hoist assistance"] },
  { label: "Daily living", category: "COMPANIONSHIP", tasks: ["Morning/evening routine", "Prompting", "Organising tasks", "Household routine", "Skill building"] },
  { label: "Domestic assistance", category: "DOMESTIC_ASSISTANCE", tasks: ["Cleaning", "Laundry", "Linen", "Dishes", "Tidying", "Shopping", "Basic home tasks"] },
  { label: "Meal support", category: "MEAL_PREPARATION", tasks: ["Planning", "Shopping", "Preparation", "Feeding assistance", "Kitchen clean-up"] },
  { label: "Community access", category: "COMMUNITY_ACCESS", tasks: ["Shopping", "Appointments", "Recreation", "Exercise", "Events", "Volunteering", "Education", "Work"] },
  { label: "Social support", category: "SOCIAL_RECREATIONAL", tasks: ["Companionship", "Hobbies", "Outings", "Conversation", "Confidence building"] },
  { label: "Transport", category: "TRANSPORT", tasks: ["Pickup/drop-off", "Appointments", "Community", "School/work travel"] },
  { label: "Appointment support", category: "APPOINTMENT_SUPPORT", tasks: ["Medical", "Allied health", "Government", "Education", "Employment"] },
  { label: "Medication support", category: "MEDICATION_ASSISTANCE", tasks: ["Prompting", "Assistance", "Authorised administration", "Pharmacy pickup"] },
  { label: "Overnight support", category: "OVERNIGHT_SUPPORT", tasks: ["Sleepover", "Active overnight", "Awake support", "Overnight respite"] },
  { label: "Respite", category: "RESPITE", tasks: ["In-home", "Community", "Short-duration replacement", "Overnight"] },
  { label: "Psychosocial support", category: "SOCIAL_RECREATIONAL", tasks: ["Community participation", "Routines", "Appointments", "Recovery-oriented support", "Prompting"] },
  { label: "Behaviour support assistance", category: "BEHAVIOUR_SUPPORT", tasks: ["Implementing an existing plan", "Routine and communication assistance"] },
  { label: "High-intensity support", category: "HIGH_INTENSITY", tasks: ["PEG", "Bowel care", "Catheter", "Diabetes", "Seizure", "Tracheostomy", "Complex medication", "Respiratory"] },
  { label: "SIL or shared living", category: "SIL_SUPPORT", tasks: ["Daily routines", "Household", "Community", "Overnight", "Documentation", "Rostered support"] },
  { label: "Children and young people", category: "OTHER", tasks: ["Personal care", "Routines", "School/community", "Play", "Skill building"] },
  { label: "Nursing or allied-health assistance", category: "NURSING_COMPLEX_CARE", tasks: ["Delegated tasks", "Therapy-assistant tasks within competence and direction"] },
  { label: "Other", category: "OTHER", tasks: [] },
];

export const HIGH_INTENSITY_SKILLS = ["PEG", "Bowel care", "Catheter", "Diabetes", "Seizure", "Tracheostomy", "Complex medication", "Respiratory"];

export const EXPERIENCE_AREAS = ["Autism", "Psychosocial disability", "Physical disability", "Intellectual disability", "ABI", "Dementia", "Sensory impairment", "Epilepsy", "Diabetes", "Complex behaviour"];
export const AGE_GROUPS = ["Children", "Teenagers", "Adults", "Older adults", "No preference"];
export const SETTINGS = ["Participant home", "Community", "SIL or shared living", "Hospital discharge", "School or work", "Provider setting"];
export const LANGUAGES = ["English", "Arabic", "Mandarin", "Cantonese", "Vietnamese", "Greek", "Italian", "Hindi", "Punjabi", "Spanish", "Tagalog", "Korean", "Auslan"];

export const RADIUS = [
  { value: "5", label: "5 km" }, { value: "10", label: "10 km" }, { value: "15", label: "15 km" },
  { value: "25", label: "25 km" }, { value: "50", label: "50 km" },
  { value: "150", label: "Regional" }, { value: "500", label: "No strict limit" },
] as const;
export const TRAVEL_MODES = [
  { value: "OWN_VEHICLE", label: "Own vehicle" }, { value: "PUBLIC_TRANSPORT", label: "Public transport" },
  { value: "BOTH", label: "Both" }, { value: "OTHER", label: "Other" },
] as const;
export const TRANSPORT_PARTICIPANTS = [
  { value: "YES", label: "Yes" }, { value: "NO", label: "No" }, { value: "DISCUSS", label: "Discuss case by case" },
] as const;

export const RATE_MODES = [
  { value: "FIXED", label: "Hourly rate" }, { value: "RANGE", label: "Rate range" },
  { value: "NEGOTIABLE", label: "Discuss per request" }, { value: "NDIS_PRICE_GUIDE", label: "Align to agreed rate" },
] as const;
export const MIN_SHIFT = [
  { value: "NONE", label: "No minimum" }, { value: "2", label: "2 hours" }, { value: "3", label: "3 hours" },
  { value: "4", label: "4 hours" }, { value: "DISCUSS", label: "Discuss" },
] as const;
export const TRAVEL_CHARGES = [
  { value: "INCLUDED", label: "Included" }, { value: "CHARGED_SEPARATELY", label: "Additional" },
  { value: "DISCUSS", label: "Discuss" }, { value: "NONE", label: "Not required nearby" },
] as const;
export const MEET_MODES = [
  { value: "PHONE", label: "Phone" }, { value: "VIDEO", label: "Video" }, { value: "IN_PERSON", label: "In person" },
] as const;

export const ENVIRONMENTS = ["Pets", "Smoking", "Stairs", "Shared homes", "Children present"];
export const SHIFT_BOUNDARIES = ["Overnight", "Split shifts", "Short visits"];
export const TASK_BOUNDARIES = ["Manual handling", "Transport", "High intensity", "Bowel care", "Catheter care"];
export const COMFORT = ["Basic", "Moderate", "Personal care", "Behaviour support", "High intensity", "Paired support"];

export const VISIBLE_TO = [
  { value: "ALL", label: "All eligible users" }, { value: "PARTICIPANTS", label: "Participants" },
  { value: "COORDINATORS", label: "Support Coordinators" }, { value: "PROVIDERS", label: "Providers" },
  { value: "PAUSED", label: "Paused (hidden from searches)" },
] as const;
export const NAME_DISPLAY = [
  { value: "FULL_NAME", label: "Full name" }, { value: "FIRST_NAME_INITIAL", label: "First name and surname initial" },
] as const;
export const LOCATION_DISPLAY = [
  { value: "SUBURB", label: "Suburb" }, { value: "GENERAL_AREA", label: "General area" },
] as const;
export const RATE_DISPLAY = [
  { value: "PUBLIC", label: "Public" }, { value: "AFTER_CONNECT", label: "After Connect" }, { value: "HIDDEN", label: "Hidden" },
] as const;
export const CONTACT = [
  { value: "ALLOW_MESSAGES", label: "Allow invitations and messages" }, { value: "INVITATIONS_ONLY", label: "Invitations only" },
] as const;

// Window 9 — documents. Required-by-Shiftify items are the submission gate (REQUIRED_DOCS_BY_ROLE.SUPPORT_WORKER);
// the rest are optional evidence. Never described as verified.
// Mirrors Backend REQUIRED_DOCS_BY_ROLE.SUPPORT_WORKER — submitting these is needed before a worker can Connect.
export const REQUIRED_TO_CONNECT: string[] = [
  "POLICE_CHECK", "NDIS_SCREENING", "FIRST_AID", "CPR", "MANUAL_HANDLING",
  "DRIVERS_LICENCE", "PUBLIC_LIABILITY_INSURANCE", "PERSONAL_ACCIDENT_INSURANCE",
  "QUALIFICATION_CERTIFICATE",
];
export interface DocRow { docType: string; label: string; fields: MetadataFieldConfig[]; multiple?: boolean }
const NUM: MetadataFieldConfig = { name: "referenceNumber", label: "Number", type: "text" };
const ISSUE: MetadataFieldConfig = { name: "issueDate", label: "Issue date", type: "date" };
const EXPIRY: MetadataFieldConfig = { name: "expiryDate", label: "Expiry date", type: "date" };

export const DOC_GROUPS: { title: string; rows: DocRow[] }[] = [
  { title: "Identity", rows: [{ docType: "PHOTO_ID", label: "Photo identification", fields: [NUM, EXPIRY] }] },
  { title: "Checks", rows: [
    { docType: "NDIS_SCREENING", label: "NDIS Worker Screening", fields: [NUM, ISSUE, EXPIRY] },
    { docType: "POLICE_CHECK", label: "Police check", fields: [NUM, ISSUE, EXPIRY] },
    { docType: "WWCC", label: "Working With Children Check", fields: [NUM, ISSUE, EXPIRY] },
  ] },
  { title: "Certificates", rows: [
    { docType: "FIRST_AID", label: "First Aid", fields: [NUM, ISSUE, EXPIRY] },
    { docType: "CPR", label: "CPR", fields: [NUM, ISSUE, EXPIRY] },
    { docType: "MANUAL_HANDLING", label: "Manual handling", fields: [NUM, ISSUE, EXPIRY] },
    { docType: "INFECTION_CONTROL", label: "Infection control", fields: [NUM, ISSUE, EXPIRY] },
    { docType: "MEDICATION_COMPETENCY", label: "Medication competency", fields: [NUM, ISSUE, EXPIRY] },
  ] },
  { title: "Qualifications", rows: [
    { docType: "QUALIFICATION_CERTIFICATE", label: "Certificate, diploma, degree or registration", fields: [NUM, ISSUE, EXPIRY], multiple: true },
  ] },
];

export const INSURANCE_ROWS: DocRow[] = [
  { docType: "PUBLIC_LIABILITY_INSURANCE", label: "Public liability insurance", fields: [NUM, EXPIRY] },
  { docType: "PERSONAL_ACCIDENT_INSURANCE", label: "Personal accident insurance", fields: [NUM, EXPIRY] },
];
export const LICENCE_ROW: DocRow = { docType: "DRIVERS_LICENCE", label: "Driver licence", fields: [NUM, EXPIRY] };

// Worker-facing status for a submitted document (Window 9). "Submitted" never means checked.
export type DocStatusLabel = "Not added" | "Submitted" | "Current" | "Expiring soon" | "Expired" | "Requires attention";
export function docStatusLabel(doc: { expiryDate?: string | null; status?: string } | undefined | null): DocStatusLabel {
  if (!doc) return "Not added";
  if (doc.status === "REJECTED") return "Requires attention";
  if (doc.expiryDate) {
    const days = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / 86400000);
    if (days < 0) return "Expired";
    if (days <= 30) return "Expiring soon";
    return "Current";
  }
  return "Submitted";
}
