'use client';
// Consolidated: plan selection now lives in one place — /setup/plan. This used
// to render its own plan list from a hardcoded, stale constants file; that
// list has drifted from the live /subscriptions/plans data, so it now just
// redirects to the canonical screen instead of maintaining a second copy.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

export default function PaymentPage() {
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
