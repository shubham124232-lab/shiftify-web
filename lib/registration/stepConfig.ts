// Wizard step configuration.
// Steps 1 + 2 (role select + account creation) are handled by /register.
// The profile wizard starts at step 3 (WIZARD_START_STEP).

export const TOTAL_STEPS: Record<string, number> = {
  PARTICIPANT:    4,
  SUPPORT_WORKER: 11,
  PROVIDER:       14,
  COORDINATOR:    10,
  PLAN_MANAGER:   15,
};

/** First step of the role-specific wizard (steps 1+2 belong to /register). */
export const WIZARD_START_STEP = 3;

export const ROLE_LABELS: Record<string, string> = {
  PARTICIPANT:    'Participant',
  SUPPORT_WORKER: 'Support Worker',
  PROVIDER:       'Provider',
  COORDINATOR:    'Support Coordinator',
  PLAN_MANAGER:   'Plan Manager',
};
