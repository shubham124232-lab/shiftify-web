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
  SUPPORT_WORKER: [
    {
      id:    'FREE',
      label: 'Worker Free',
      price: 0,
      period: '/month',
      features: [
        'Basic profile listing',
        'Apply to open shifts',
        'Standard support',
      ],
    },
    {
      id:    'BASIC',
      label: 'Worker Basic',
      price: 49.99,
      period: '/month',
      features: [
        'Priority profile placement',
        'Unlimited shift applications',
        'Priority support',
      ],
    },
    {
      id:      'AVAILABLE_NOW',
      label:   'Available Now',
      price:   24.99,
      period:  '/month (add-on)',
      features: [
        '"Available Now" badge on profile',
        'Boosted visibility in urgent searches',
      ],
    },
  ],
  COORDINATOR: [
    {
      id:    'FREE',
      label: 'Coordinator Free',
      price: 0,
      period: '/month',
      features: [
        'Basic profile listing',
        'Standard support',
      ],
    },
    {
      id:    'BASIC',
      label: 'Coordinator Basic',
      price: 49.99,
      period: '/month',
      features: [
        'Priority profile placement',
        'Priority support',
      ],
    },
    {
      id:      'GROWTH',
      label:   'Growth Add-on',
      price:   29.99,
      period:  '/month (add-on)',
      features: [
        'Direct Invite',
        'Expanded professional network access',
        'Enhanced profile visibility',
      ],
    },
    {
      id:      'SPEED',
      label:   'Speed Add-on',
      price:   19.99,
      period:  '/month (add-on)',
      features: [
        'Available Now worker filter',
        'Fast replacement tools',
        'Priority urgent workflow',
      ],
    },
  ],
  PROVIDER: [
    {
      id:    'ORG_STARTER',
      label: 'Provider Organisation — Starter',
      price: 99.99,
      period: '/month',
      features: [
        '2 Administrators',
        '10 Team Members',
        '2 Branches',
      ],
    },
    {
      id:      'ORG_TEAM',
      label:   'Provider Organisation — Team',
      price:   199.99,
      period:  '/month',
      features: [
        '5 Administrators',
        '25 Team Members',
        '5 Branches',
      ],
    },
    {
      id:      'ORG_GROWTH',
      label:   'Provider Organisation — Growth',
      price:   499.99,
      period:  '/month',
      popular: true,
      features: [
        '7 Administrators',
        '50 Team Members',
        '7 Branches',
      ],
    },
    {
      id:    'ORG_SCALE',
      label: 'Provider Organisation — Scale',
      price: 799.99,
      period: '/month',
      features: [
        '10 Administrators',
        '100 Team Members',
        '10 Branches',
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
