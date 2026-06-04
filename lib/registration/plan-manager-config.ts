import type { StepConfig } from './types';
import { pmStep1Schema, pmStep2Schema } from '@/lib/schemas/plan-manager-steps';

export const PLAN_MANAGER_STEPS: StepConfig[] = [
  { index: 0, title: 'Business Details',  description: 'Business name, ABN, NDIS status and service areas', icon: 'bi-building-fill',    schema: pmStep1Schema },
  { index: 1, title: 'Availability',      description: 'Client acceptance toggle and platform declaration', icon: 'bi-patch-check-fill', schema: pmStep2Schema, isFinal: true },
];
