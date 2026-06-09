// Plan configuration — only PROVIDER and PLAN_MANAGER require payment on registration.
// Backend plan keys are seeded in Backend/prisma/seed.ts.

import type { UserRole } from '@/lib/types';

export interface PlanConfig {
  id:       string;      // backend plan key e.g. "BASIC"
  label:    string;      // display name
  price:    number;      // AUD cents-free float
  period:   string;
  features: string[];
  popular?: boolean;
}

export const PLANS_BY_ROLE: Partial<Record<UserRole, PlanConfig[]>> = {
  PROVIDER: [
    {
      id:    'BASIC',
      label: 'Provider Essentials',
      price: 99.99,
      period: '/month',
      features: [
        'Up to 20 active job listings',
        'Verified badge on profile',
        'Basic analytics dashboard',
        'Standard support',
      ],
    },
    {
      id:      'GROWTH',
      label:   'Provider Growth',
      price:   39.99,
      period:  '/month',
      popular: true,
      features: [
        'Up to 40 active job listings',
        'Priority in search results',
        'Advanced analytics dashboard',
        'Priority support',
      ],
    },
    {
      id:    'SPEED',
      label: 'Provider Speed',
      price: 29.99,
      period: '/month',
      features: [
        'Up to 10 active job listings',
        'Fast onboarding tools',
        'Standard support',
      ],
    },
  ],
  PLAN_MANAGER: [
    {
      id:    'BASIC',
      label: 'Plan Manager',
      price: 19.99,
      period: '/month',
      features: [
        'Manage up to 50 participant plans',
        'Budget tracking & reporting',
        'Claim submission tools',
        'Priority support',
      ],
    },
  ],
};

export function getPlan(role: UserRole, planId: string): PlanConfig | undefined {
  return PLANS_BY_ROLE[role]?.find((p) => p.id === planId);
}
