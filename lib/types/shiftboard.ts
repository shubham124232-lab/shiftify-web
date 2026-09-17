// Types for the public (no-login) Live Shiftboard — GET /public/shiftboard.
// Kept separate from the authenticated live-dashboard job shape (job-card.tsx)
// since this response is deliberately a smaller, privacy-safe field set.

export type ShiftboardUrgency = "RAPID" | "URGENT" | "LAST_MINUTE" | "ROUTINE";
export type TimeOfDay = "MORNING" | "AFTERNOON" | "EVENING" | "OVERNIGHT";

export interface ShiftboardRequirements {
  driversLicence: boolean;
  vehicle: boolean;
  certIIIOrAbove: boolean;
  restrictivePractices: boolean;
  firstAid: boolean;
  alliedHealth: boolean;
}

export interface ShiftboardJob {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  urgency: ShiftboardUrgency;
  shiftType: string | null;
  isRecurring: boolean;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  totalHours: number | null;
  budgetPerHour: number | null;
  totalBudget: number | null;
  budgetType: string | null;
  fundingType: string | null;
  createdAt: string;
  status: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  requirements: ShiftboardRequirements;
}

export type ShiftboardCounts = Record<"ALL" | ShiftboardUrgency, number>;

export interface ShiftboardResponse {
  jobs: ShiftboardJob[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  counts: ShiftboardCounts;
}

export interface ShiftboardFilters {
  suburb: string;
  radiusKm: number;
  nearLat: number | null;
  nearLng: number | null;
  urgency: ShiftboardUrgency | "";
  category: string;
  shiftType: string;
  startFrom: string;
  startTo: string;
  timeOfDay: TimeOfDay[];
  requirements: Partial<ShiftboardRequirements>;
  sortBy: "newest" | "urgency" | "startDate" | "nearest";
  page: number;
}

export const DEFAULT_SHIFTBOARD_FILTERS: ShiftboardFilters = {
  suburb: "",
  radiusKm: 50,
  nearLat: null,
  nearLng: null,
  urgency: "",
  category: "",
  shiftType: "",
  startFrom: "",
  startTo: "",
  timeOfDay: [],
  requirements: {},
  sortBy: "urgency",
  page: 1,
};
