import type { StepConfig } from './types';
import {
  coordStep1Schema, coordStep2Schema, coordStep3Schema,
  coordStep4Schema, coordStep5Schema, coordStep6Schema,
  coordStep7Schema, coordStep8Schema, coordStep9Schema,
} from '@/lib/schemas/coordinator-steps';

export const COORDINATOR_STEPS: StepConfig[] = [
  { index: 0, title: 'Role & Organisation',   description: 'Your coordinator role type and organisation',              icon: 'bi-diagram-3-fill',         schema: coordStep1Schema },
  { index: 1, title: 'NDIS Registration',     description: 'NDIS registration status and provider number',            icon: 'bi-file-earmark-text-fill', schema: coordStep2Schema },
  { index: 2, title: 'Experience',            description: 'Years of experience, coordination level and specialisms', icon: 'bi-award-fill',             schema: coordStep3Schema },
  { index: 3, title: 'Service Coverage',      description: 'Areas covered, delivery mode and languages spoken',       icon: 'bi-map-fill',               schema: coordStep4Schema },
  { index: 4, title: 'Capacity',              description: 'Current capacity, caseload and participant types',        icon: 'bi-people-fill',            schema: coordStep5Schema },
  { index: 5, title: 'Billing & Rates',       description: 'Preferred billing method and hourly rate',               icon: 'bi-cash-stack',             schema: coordStep6Schema },
  { index: 6, title: 'Bio',                   description: 'Professional bio and plan manager preferences',          icon: 'bi-person-fill',            schema: coordStep7Schema },
  { index: 7, title: 'Compliance Documents',  description: 'Professional indemnity and public liability insurance',  icon: 'bi-shield-fill-check',      schema: coordStep8Schema },
  { index: 8, title: 'Declaration',           description: 'Agree to platform terms and NDIS code of conduct',      icon: 'bi-patch-check-fill',       schema: coordStep9Schema, isFinal: true },
];
