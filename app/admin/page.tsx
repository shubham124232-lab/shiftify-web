'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { user, isAuth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuth || !user) { router.replace('/login'); return; }
    // Non-admin users should not be here
    if (!user.adminTier) { router.replace('/dashboard'); }
  }, [loading, isAuth, user, router]);

  if (loading || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="bi bi-shield-lock-fill" style={{ color: '#fff', fontSize: 22 }} />
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--clr-text)', margin: 0 }}>
        Admin Area
      </h1>
      <p style={{ fontSize: 14, color: 'var(--clr-muted)', margin: 0 }}>
        Welcome, {user.name}. The admin dashboard is coming soon.
      </p>
    </div>
  );
}
