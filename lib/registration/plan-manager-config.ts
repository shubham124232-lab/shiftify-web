import type { StepConfig } from './types';
import {
  pmStep1Schema,
  pmStep2Schema,
  pmStep3Schema,
  pmStep4Schema,
  pmStep5Schema,
  pmStep6Schema,
  pmStep7Schema,
  pmStep8Schema,
  pmStep9Schema,
  pmStep10Schema,
  pmStep11Schema,
  pmStep12Schema,
  pmStep13Schema,
  pmStep14Schema,
} from '@/lib/schemas/plan-manager-steps';

export const PLAN_MANAGER_STEPS: StepConfig[] = [
  { index: 0,  title: 'Business Details',       description: 'Legal identity, address and contact information',        icon: 'bi-building-fill',           schema: pmStep1Schema  },
  { index: 1,  title: 'NDIS Registration',      description: 'NDIS status, provider number and registration groups',  icon: 'bi-patch-check-fill',        schema: pmStep2Schema  },
  { index: 2,  title: 'Capability',             description: 'Services provided and invoice management capabilities',  icon: 'bi-gear-fill',               schema: pmStep3Schema  },
  { index: 3,  title: 'Participant Scope',       description: 'Participant types and complexity experience',           icon: 'bi-people-fill',             schema: pmStep4Schema  },
  { index: 4,  title: 'Service Coverage',        description: 'Geographic coverage, operating hours and turnaround',  icon: 'bi-map-fill',                schema: pmStep5Schema  },
  { index: 5,  title: 'Payment Operations',      description: 'Invoice intake, contacts and processing rules',        icon: 'bi-receipt',                 schema: pmStep6Schema  },
  { index: 6,  title: 'Compliance',              description: 'Compliance declarations and key contacts',             icon: 'bi-shield-check-fill',       schema: pmStep7Schema  },
  { index: 7,  title: 'Staff Model',             description: 'Organisation structure and user seat requirements',    icon: 'bi-person-badge-fill',       schema: pmStep8Schema  },
  { index: 8,  title: 'Participant Linking',     description: 'How participants are connected and service agreements', icon: 'bi-link-45deg',             schema: pmStep9Schema  },
  { index: 9,  title: 'Provider Interaction',    description: 'Invoice acceptance rules and provider communication',  icon: 'bi-chat-dots-fill',          schema: pmStep10Schema },
  { index: 10, title: 'Documents',               description: 'Insurance and compliance document uploads',            icon: 'bi-file-earmark-check-fill', schema: pmStep11Schema },
  { index: 11, title: 'Communication',           description: 'Notification emails and alert preferences',            icon: 'bi-bell-fill',               schema: pmStep12Schema },
  { index: 12, title: 'Commercial',              description: 'Subscription plan and billing details',               icon: 'bi-credit-card-fill',        schema: pmStep13Schema },
  { index: 13, title: 'Terms & Declarations',    description: 'Final declarations and client acceptance status',      icon: 'bi-pen-fill',                schema: pmStep14Schema, isFinal: true },
];
