// Master support-service catalogue shared by all four participant posting
// journeys (Rapid/Urgent/Last-Minute/Routine). Category ids map onto the
// EXISTING Backend JobCategory enum (Backend/prisma/schema.prisma) — no new
// category values were added; a few of the doc's 13 categories intentionally
// collapse onto one existing enum value (e.g. "Transport and appointment
// support" -> TRANSPORT) and a few existing enum values (SIL_SUPPORT,
// COMPANIONSHIP, SHOPPING_ERRANDS, APPOINTMENT_SUPPORT, SOCIAL_RECREATIONAL)
// are simply not offered as a top-level tile in this new wizard.

import type { JobCategoryValue } from "./categories";

export type CatalogueQuestionType = "select" | "yesno" | "text";

export interface CatalogueQuestion {
  id: string;
  label: string;
  type: CatalogueQuestionType;
  options?: string[];
}

export interface CatalogueCategory {
  id: JobCategoryValue;
  label: string;
  tasks: string[];
  questions: CatalogueQuestion[];
  note?: string;
}

export const SERVICE_CATALOGUE: CatalogueCategory[] = [
  {
    id: "PERSONAL_CARE",
    label: "Personal care and daily activities",
    tasks: [
      "Showering/bathing", "Dressing/grooming", "Toileting/continence",
      "Transfers and positioning", "Mobility assistance", "Morning routine",
      "Evening/bedtime routine", "Personal hygiene", "Other personal care",
    ],
    questions: [
      { id: "assistanceLevel", label: "Level of assistance", type: "select", options: ["Prompting/supervision", "Some physical assistance", "Full assistance"] },
      { id: "transferSupport", label: "Transfer support", type: "select", options: ["None", "One-person", "Two-person", "Hoist/equipment"] },
      { id: "genderRequirement", label: "Any personal-care gender requirement?", type: "yesno" },
      { id: "continenceInstructions", label: "Any continence or personal-care instructions to share after confirmation?", type: "yesno" },
    ],
  },
  {
    id: "DOMESTIC_ASSISTANCE",
    label: "Household tasks and daily living",
    tasks: [
      "Cleaning", "Laundry", "Changing bed linen", "Dishwashing/kitchen tidy",
      "Shopping/errands", "Meal preparation", "Home organisation",
      "Light gardening/yard task", "Skill-building for household tasks", "Other",
    ],
    questions: [
      { id: "roomsOrTasks", label: "Which rooms/tasks?", type: "text" },
      { id: "participationLevel", label: "Participant joins the task, needs prompting, or needs task completed?", type: "select", options: ["Joins the task", "Needs prompting", "Needs task completed"] },
      { id: "productsSupplied", label: "Any products/equipment supplied at the home?", type: "yesno" },
      { id: "accessIssues", label: "Any stairs, pets, smoking or access issue?", type: "text" },
    ],
  },
  {
    id: "COMMUNITY_ACCESS",
    label: "Community access and social participation",
    tasks: [
      "Social outing", "Shopping", "Sport/recreation", "Hobby/group activity",
      "Day program", "Religious/cultural activity", "Visit family/friends",
      "Build travel/community skills", "Event", "Other",
    ],
    questions: [
      { id: "destination", label: "Activity/destination", type: "text" },
      { id: "meetingPoint", label: "Meet at home, venue or another point?", type: "select", options: ["Home", "Venue", "Another point"] },
      { id: "transportNeeded", label: "Transport needed?", type: "yesno" },
      { id: "supportLevel", label: "Support level", type: "select", options: ["Companion/prompting", "Mobility assistance", "Personal care during outing", "Behavioural/communication support"] },
      { id: "ticketCost", label: "Entry/ticket cost arrangement (optional)", type: "text" },
    ],
  },
  {
    id: "TRANSPORT",
    label: "Transport and appointment support",
    tasks: [
      "Medical/allied-health appointment", "Work or study", "Community activity",
      "Shopping/errands", "Airport/station", "School/day program",
      "One-way transport", "Return trip", "Waiting support", "Other",
    ],
    questions: [
      { id: "pickupDestination", label: "Pick-up location and destination", type: "text" },
      { id: "tripType", label: "One-way, return, or multiple stops?", type: "select", options: ["One-way", "Return", "Multiple stops"] },
      { id: "vehicleType", label: "Worker vehicle, participant vehicle, public transport or rideshare?", type: "select", options: ["Worker vehicle", "Participant vehicle", "Public transport", "Rideshare"] },
      { id: "wheelchairVehicle", label: "Wheelchair-accessible vehicle required?", type: "yesno" },
      { id: "workerWaits", label: "Will the worker attend/wait at the appointment?", type: "yesno" },
      { id: "estimatedKm", label: "Estimated kilometres (optional)", type: "text" },
    ],
  },
  {
    id: "MEAL_PREPARATION",
    label: "Meal preparation and mealtime support",
    tasks: [
      "Plan a meal", "Prepare/cook meal", "Serve/set up meal",
      "Eating/drinking assistance", "Mealtime prompting/supervision",
      "Modified food/fluid preparation", "Grocery shopping", "Kitchen clean-up", "Other",
    ],
    questions: [
      { id: "dietaryNeeds", label: "Dietary preference/allergy indicator", type: "text" },
      { id: "mealtimePlan", label: "Mealtime management plan?", type: "yesno" },
      { id: "swallowingDifficulty", label: "Swallowing difficulty or modified texture/fluid?", type: "yesno" },
      { id: "assistanceLevel", label: "Assistance level", type: "select", options: ["Preparation only", "Prompting/supervision", "Physical assistance"] },
    ],
    note: "Relevant plan shared after shortlist/confirmation.",
  },
  {
    id: "MEDICATION_ASSISTANCE",
    label: "Medication support",
    tasks: [
      "Medication reminder", "Prompting/supervision", "Assistance with self-administration",
      "Medication administration by authorised/qualified person", "Medication collection",
      "Recording/documentation", "Other",
    ],
    questions: [
      { id: "supportType", label: "Type of support required", type: "select", options: ["Reminder", "Prompting/supervision", "Assistance with self-administration", "Administration by authorised person", "Collection", "Recording/documentation"] },
      { id: "authorisationRequired", label: "Specific qualification/authorisation required?", type: "yesno" },
      { id: "timeCritical", label: "Time-critical medication?", type: "yesno" },
      { id: "healthPlanAvailable", label: "Health plan/instructions available?", type: "yesno" },
    ],
    note: "Do not place medicine names/doses in the public request.",
  },
  {
    id: "OVERNIGHT_SUPPORT",
    label: "Overnight support",
    tasks: [
      "Sleepover", "Active overnight", "Evening-to-morning support",
      "Overnight personal care", "Overnight monitoring/checks", "Bedtime/morning routines", "Other",
    ],
    questions: [
      { id: "overnightType", label: "Sleepover or active overnight?", type: "select", options: ["Sleepover", "Active overnight"] },
      { id: "checkFrequency", label: "Expected frequency of assistance/checks", type: "text" },
      { id: "overnightNeeds", label: "Personal care, transfers, medication, behaviour or health support overnight?", type: "text" },
      { id: "sleepingSpaceAvailable", label: "Suitable sleeping space available for sleepover?", type: "yesno" },
    ],
  },
  {
    id: "HIGH_INTENSITY",
    label: "High-intensity personal support",
    tasks: [
      "Complex bowel care", "Enteral feeding support", "Severe dysphagia management",
      "Tracheostomy support", "Urinary catheter support", "Ventilator support",
      "Subcutaneous injection", "Complex wound support", "Other high-intensity support",
    ],
    questions: [
      { id: "exactSupport", label: "Select exact support", type: "text" },
      { id: "trainedWorkerRequired", label: "Registered provider required / participant-specific trained worker required?", type: "yesno" },
      { id: "planAvailable", label: "Current support plan/instructions available?", type: "yesno" },
      { id: "twoWorkersRequired", label: "Two workers required?", type: "yesno" },
    ],
    note: "Relevant clinical instructions shared privately after eligibility/selection.",
  },
  {
    id: "BEHAVIOUR_SUPPORT",
    label: "Behaviour support plan assistance",
    tasks: [
      "Routine implementation support", "Positive behaviour support strategies",
      "Community support with known triggers", "De-escalation support",
      "Data/incident recording", "Regulated restrictive practice may be involved", "Other",
    ],
    questions: [
      { id: "planAvailable", label: "Behaviour support plan available?", type: "yesno" },
      { id: "restrictivePractice", label: "Is a regulated restrictive practice involved?", type: "select", options: ["Yes", "No", "Not sure"] },
      { id: "providerRequirements", label: "Implementing-provider requirements or participant-specific training required?", type: "text" },
      { id: "triggerSummary", label: "Known essential trigger/communication information (short private summary)", type: "text" },
    ],
    note: "Full plans are not displayed publicly.",
  },
  {
    id: "NURSING_COMPLEX_CARE",
    label: "Nursing support",
    tasks: [
      "Health assessment/monitoring", "Wound care", "Continence assessment/support",
      "Diabetes-related nursing", "Medication-related nursing", "Post-hospital support",
      "Other disability-related nursing",
    ],
    questions: [
      { id: "nurseType", label: "Registered nurse or enrolled nurse required?", type: "select", options: ["Registered nurse", "Enrolled nurse", "Either"] },
      { id: "exactTask", label: "Exact nursing task", type: "text" },
      { id: "frequency", label: "Frequency/duration", type: "text" },
      { id: "clinicalPlanAvailable", label: "Clinical plan/referral/instructions available?", type: "yesno" },
    ],
    note: "Relevant clinical information shared privately.",
  },
  {
    id: "THERAPY_ASSISTANCE",
    label: "Therapy-assistant support",
    tasks: [
      "Physiotherapy program assistance", "Occupational therapy program assistance",
      "Speech pathology program assistance", "Exercise/skill practice",
      "Communication program practice", "Other delegated therapy task",
    ],
    questions: [
      { id: "discipline", label: "Therapy discipline", type: "text" },
      { id: "programAvailable", label: "Therapist-designed program available?", type: "yesno" },
      { id: "delegationRequired", label: "Therapist delegation/supervision required?", type: "yesno" },
      { id: "assistantLevel", label: "Therapy assistant level/experience (if known)", type: "text" },
    ],
    note: "This is assistance with an established program, not independent therapy.",
  },
  {
    id: "RESPITE",
    label: "Short-term respite support",
    tasks: [
      "In-home respite", "Overnight respite", "Day respite",
      "Community-based respite", "Short stay with support", "Other",
    ],
    questions: [
      { id: "datesAndDuration", label: "Dates and number of nights/hours", type: "text" },
      { id: "location", label: "Location", type: "select", options: ["Participant home", "Provider setting", "Other"] },
      { id: "needs", label: "Daily support, personal care, medication, overnight and community needs", type: "text" },
      { id: "accessibilityNeeds", label: "Accessibility/accommodation requirements", type: "text" },
    ],
    note: "Informal-support contact and handover details after confirmation.",
  },
  {
    id: "OTHER",
    label: "Other support",
    tasks: ["Other disability-related support not listed"],
    questions: [
      { id: "nearestCategory", label: "Choose the nearest main service category where possible", type: "text" },
      { id: "description", label: "Short description of the essential task", type: "text" },
    ],
    note: "Date/time, duration, location, worker requirements and safety information still apply.",
  },
];

export function getCatalogueCategory(id: string): CatalogueCategory | undefined {
  return SERVICE_CATALOGUE.find((c) => c.id === id);
}
