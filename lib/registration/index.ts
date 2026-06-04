// Central export — maps UserRole to its step config array.

import { UserRole } from '@/lib/types';
import { WORKER_STEPS }       from './worker-config';
import { PROVIDER_STEPS }     from './provider-config';
import { COORDINATOR_STEPS }  from './coordinator-config';
import { PARTICIPANT_STEPS }  from './participant-config';
import { PLAN_MANAGER_STEPS } from './plan-manager-config';
import type { StepConfig }    from './types';

export type { StepConfig };

export function getStepsForRole(role: UserRole): StepConfig[] {
  switch (role) {
    case UserRole.SUPPORT_WORKER: return WORKER_STEPS;
    case UserRole.PROVIDER:       return PROVIDER_STEPS;
    case UserRole.COORDINATOR:    return COORDINATOR_STEPS;
    case UserRole.PARTICIPANT:    return PARTICIPANT_STEPS;
    case UserRole.PLAN_MANAGER:   return PLAN_MANAGER_STEPS;
    default:                      return [];
  }
}
