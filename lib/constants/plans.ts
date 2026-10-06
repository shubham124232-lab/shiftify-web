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
        'Profile, visibility and shift browsing',
        '10 once-only introductory Connect actions (no expiry)',
        'Receive invitations and message existing connections',
      ],
    },
    {
      id:    'BASIC',
      label: 'Shiftify Basic',
      price: 49.99,
      period: '/month',
      features: [
        'Unlimited eligible Connect actions',
        'Messaging and general availability',
        'Eligible invitation responses',
        'Direct Connect access',
      ],
    },
    {
      id:      'AVAILABLE_NOW',
      label:   'Available Now add-on',
      price:   24.99,
      period:  '/month (add-on)',
      features: [
        'Available Now status',
        'Increased urgent visibility',
        'Relevant Rapid, Urgent, Last-Minute and replacement alerts',
        'Requires Shiftify Basic',
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
        'Professional profile and platform visibility',
        '10 once-only introductory actions (no expiry)',
        'Receive participant enquiries',
      ],
    },
    {
      id:    'BASIC',
      label: 'Shiftify Pro',
      price: 49.99,
      period: '/month',
      features: [
        'Unlimited support-request posts',
        'Multiple-participant workspace',
        'Request and response management',
        'Messaging and core business tools',
      ],
    },
    {
      id:      'GROWTH',
      label:   'Growth add-on',
      price:   29.99,
      period:  '/month (add-on)',
      features: [
        'Direct Invite',
        'Expanded professional network access',
        'Enhanced profile visibility',
        'Requires Shiftify Pro',
      ],
    },
    {
      id:      'SPEED',
      label:   'Speed add-on',
      price:   19.99,
      period:  '/month (add-on)',
      features: [
        'Available Now worker filter',
        'Fast replacement tools',
        'Priority urgent workflow',
        'Requires Shiftify Pro',
      ],
    },
  ],
  PROVIDER: [
    {
      id:    'FREE',
      label: 'Provider Free',
      price: 0,
      period: '/month',
      features: [
        '10 once-only introductory Provider actions (no expiry)',
        'Provider profile, notifications and history',
      ],
    },
    {
      id:    'ORG_STARTER',
      label: 'Starter',
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
      label:   'Team',
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
      label:   'Growth',
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
      label: 'Scale',
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
