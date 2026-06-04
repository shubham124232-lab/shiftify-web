// Shiftify — profile types for all 5 roles (mirrors backend schema + validators)

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  startTime:  string; // HH:MM
  endTime:    string; // HH:MM
}

export interface UploadedDocument {
  id:              string;
  docType:         string;
  fileName:        string;
  fileKey:         string;
  publicUrl:       string | null;
  sizeBytes:       number;
  mimeType:        string;
  referenceNumber: string | null;
  issueDate:       string | null;
  expiryDate:      string | null;
  status:          'UPLOADED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  createdAt:       string;
}

// ─── Worker ──────────────────────────────────────────────────────────────────

export type RightToWork  = 'CITIZEN' | 'PR' | 'VISA_HOLDER';
export type WorkType     = 'CONTRACTOR' | 'AGENCY';
export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERIENCED' | 'EXPERT';
export type AvailabilityType = 'CASUAL' | 'PART_TIME' | 'FULL_TIME' | 'ON_DEMAND';

export interface VehicleDetails {
  make?:   string;
  model?:  string;
  year?:   number;
  rego?:   string;
  colour?: string;
}

export interface WorkerReference {
  name:          string;
  relationship:  string;
  phone?:        string;
  email?:        string;
}

export interface WorkerProfileData {
  profileStep?:               number;
  dob?:                       string;
  gender?:                    string;
  rightToWork?:               RightToWork;
  visaType?:                  string;
  visaExpiry?:                string;
  workType?:                  WorkType;
  abn?:                       string;
  gstRegistered?:             boolean;
  servicesOffered?:           string[];
  subServices?:               string[];
  highIntensitySkills?:       string[];
  experienceLevel?:           ExperienceLevel;
  disabilityExperience?:      string[];
  availabilityType?:          AvailabilityType;
  emergencyAvailability?:     boolean;
  serviceAreas?:              string[];
  travelRadiusKm?:            number;
  hasVehicle?:                boolean;
  vehicleDetails?:            VehicleDetails;
  insuranceValid?:            boolean;
  publicLiabilityInsurance?:  boolean;
  personalAccidentInsurance?: boolean;
  hourlyRate?:                number;
  bio?:                       string;
  preferences?:               string;
  isAvailableNow?:            boolean;
  references?:                WorkerReference[];
  seekingPlanManager?:        boolean;
  availability?:              AvailabilitySlot[];
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface ProviderProfileData {
  profileStep?:         number;
  businessName?:        string;
  tradingName?:         string;
  legalEntityName?:     string;
  abn?:                 string;
  businessStructure?:   string;
  ndisRegistered?:      boolean;
  ndisProviderNumber?:  string;
  gstRegistered?:       boolean;
  yearsInOperation?:    string;
  primaryContactName?:  string;
  primaryContactRole?:  string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  accountsContactName?: string;
  accountsContactEmail?:string;
  logoUrl?:             string;
  coreServices?:        string[];
  offersSil?:           boolean;
  offersSda?:           boolean;
  silDetails?:          Record<string, unknown>;
  sdaDetails?:          Record<string, unknown>;
  serviceAreas?:        string[];
  serviceMode?:         'IN_PERSON' | 'REMOTE' | 'BOTH';
  workforceSize?:       string;
  participantTypes?:    string[];
  pricingModel?:        string;
  billingMethod?:       string;
  businessDescription?: string;
  websiteUrl?:          string;
  seekingPlanManager?:  boolean;
}

// ─── Coordinator ──────────────────────────────────────────────────────────────

export interface CoordinatorProfileData {
  profileStep?:                       number;
  roleType?:                          'INDEPENDENT' | 'AGENCY_EMPLOYED';
  organisationName?:                  string;
  abn?:                               string;
  ndisRegistered?:                    boolean;
  ndisProviderNumber?:                string;
  yearsExperience?:                   string;
  supportCoordinationLevel?:          string[];
  participantComplexityExperience?:   string[];
  servicesOfferedBeyondCoordination?: string[];
  serviceAreas?:                      string[];
  serviceMode?:                       'IN_PERSON' | 'REMOTE' | 'BOTH';
  currentCapacityStatus?:             string;
  maxParticipantLoad?:                number;
  participantTypesAccepted?:          string[];
  billingMethodPreference?:           string;
  hourlyRate?:                        number;
  bio?:                               string;
  languages?:                         string[];
  fundingTypeCompatibility?:          string[];
  seekingPlanManager?:                boolean;
}

// ─── Participant ──────────────────────────────────────────────────────────────

export interface ParticipantProfileData {
  profileStep?:                  number;
  preferredName?:                string;
  ageGroup?:                     string;
  gender?:                       string;
  ndisNumber?:                   string;
  fundingManagementType?:        'SELF' | 'PLAN' | 'NDIA';
  primaryDisability?:            string;
  mobilitySupportNeeds?:         string[];
  communicationNeeds?:           string[];
  behaviourSensoryNotes?:        string[];
  medicalConsiderations?:        string[];
  riskSafetyNotes?:              string;
  supportPreferences?:           string[];
  emergencyContactName?:         string;
  emergencyContactPhone?:        string;
  emergencyContactRelationship?: string;
  seekingPlanManager?:           boolean;
}

// ─── Plan Manager ─────────────────────────────────────────────────────────────

export interface PlanManagerProfileData {
  profileStep?:      number;
  businessName?:     string;
  abn?:              string;
  ndisRegistered?:   boolean;
  ndisProviderNumber?: string;
  yearsInOperation?: string;
  serviceAreas?:     string[];
  acceptingClients?: boolean;
}
