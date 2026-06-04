import type { StepConfig } from './types';
import {
  participantStep1Schema, participantStep2Schema, participantStep3Schema,
  participantStep4Schema, participantStep5Schema,
} from '@/lib/schemas/participant-steps';

export const PARTICIPANT_STEPS: StepConfig[] = [
  { index: 0, title: 'Personal Details',  description: 'Your preferred name, age group and gender',           icon: 'bi-person-heart',          schema: participantStep1Schema },
  { index: 1, title: 'NDIS Information',  description: 'NDIS number and funding management type',             icon: 'bi-file-earmark-text-fill', schema: participantStep2Schema },
  { index: 2, title: 'Support Needs',     description: 'Disability, mobility, communication and medical needs', icon: 'bi-heart-pulse-fill',     schema: participantStep3Schema },
  { index: 3, title: 'Emergency Contact', description: 'A person to contact in case of emergency',            icon: 'bi-telephone-fill',        schema: participantStep4Schema },
  { index: 4, title: 'Documents',         description: 'Optional document uploads and platform declaration',  icon: 'bi-patch-check-fill',      schema: participantStep5Schema, isFinal: true },
];
