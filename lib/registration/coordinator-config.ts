import type { StepConfig } from './types';
import {
  coordStep1Schema, coordStep2Schema, coordStep3Schema,
  coordStep4Schema, coordStep5Schema, coordStep6Schema,
  coordStep7Schema, coordStep8Schema, coordStep9Schema,
} from '@/lib/schemas/coordinator-steps';

export const COORDINATOR_STEPS: StepConfig[] = [
  { index: 0, title: 'Professional Identity',     description: 'Role type, ABN, NDIS status and years of experience',        icon: 'bi-diagram-3-fill',         schema: coordStep1Schema },
  { index: 1, title: 'Qualification & Compliance', description: 'Qualifications, screening checks and insurance documents',   icon: 'bi-shield-fill-check',      schema: coordStep2Schema },
  { index: 2, title: 'Service Capability',         description: 'Coordination levels, complexity experience and services',    icon: 'bi-award-fill',             schema: coordStep3Schema },
  { index: 3, title: 'Service Coverage',           description: 'Service areas and delivery mode',                           icon: 'bi-map-fill',               schema: coordStep4Schema },
  { index: 4, title: 'Availability & Capacity',    description: 'Current capacity status and availability type',             icon: 'bi-calendar-check-fill',    schema: coordStep5Schema },
  { index: 5, title: 'Plan Management Handling',   description: 'Participant types and billing method preference',           icon: 'bi-people-fill',            schema: coordStep6Schema },
  { index: 6, title: 'Rates & Commercials',        description: 'Hourly rate and travel charge policy',                     icon: 'bi-cash-stack',             schema: coordStep7Schema },
  { index: 7, title: 'Profile & Trust Layer',      description: 'Bio, languages, gender and profile photo',                 icon: 'bi-person-fill',            schema: coordStep8Schema },
  { index: 8, title: 'Platform Rules & Compliance', description: 'Agree to platform terms and NDIS code of conduct',        icon: 'bi-patch-check-fill',       schema: coordStep9Schema, isFinal: true },
];
