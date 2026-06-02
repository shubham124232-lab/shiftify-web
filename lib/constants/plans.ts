// Plan configuration — mirrors the backend PLAN_AMOUNTS table in subscription.service.ts.
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
  SUPPORT_WORKER: [
    {
      id:    'WORKER_BASIC',
      label: 'Support Worker Basic',
      price: 49.99,
      period: '/month',
      features: [
        'Unlimited job applications',
        'Messaging with participants and providers',
        'General availability on profile',
        'Full marketplace visibility',
      ],
      popular: true,
    },
  ],
  COORDINATOR: [
    {
      id:    'COORDINATOR_BASIC',
      label: 'Support Coordinator Basic',
      price: 49.99,
      period: '/month',
      features: [
        'Unlimited participant job posting',
        'Manage participant profiles',
        'Receive worker and provider applications',
        'Full messaging access',
      ],
      popular: true,
    },
  ],
  PROVIDER: [
    {
      id:    'PROVIDER_BASIC',
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
      id:      'PROVIDER_PRO',
      label:   'Provider Pro',
      price:   179.99,
      period:  '/month',
      popular: true,
      features: [
        'Up to 60 active job listings',
        'Priority in search results',
        'Team roster management',
        'Dedicated account manager',
      ],
    },
  ],
  PLAN_MANAGER: [
    {
      id:    'PLAN_MANAGER_BASIC',
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
