'use client';
// Consolidated: plan selection now lives in one place — /setup/plan.
// This route is kept only because app/(dashboard)/profile-setup/[step]/page.tsx
// still links here at the end of the dashboard "complete your profile" wizard.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardProfileSetupPlanPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/setup/plan');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
      <Spinner />
    </div>
  );
}
