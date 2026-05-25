'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, UserStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const ROLES: { value: UserRole; label: string }[] = [
  { value: UserRole.PARTICIPANT,    label: 'Participant'    },
  { value: UserRole.SUPPORT_WORKER, label: 'Support Worker' },
  { value: UserRole.PROVIDER,       label: 'Provider'       },
  { value: UserRole.COORDINATOR,    label: 'Coordinator'    },
  { value: UserRole.PLAN_MANAGER,   label: 'Plan Manager'   },
];

export default function LoginPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { login, loading, error, clearError } = useAuth();

  const [identifier,   setIdentifier]   = useState('');
  const [password,     setPassword]     = useState('');
  const [activeRole,   setActiveRole]   = useState<UserRole | null>(null);
  const [devCode,      setDevCode]      = useState<string | null>(null);
  const [localError,   setLocalError]   = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!identifier.trim()) { setLocalError('Enter your email, phone, or username.'); return; }
    if (!password)           { setLocalError('Enter your password.');                  return; }

    try {
      const res = await login({
        identifier: identifier.trim(),
        password,
        ...(activeRole ? { activeRole } : {}),
      });

      if (res._dev_code) setDevCode(res._dev_code);

      const next = params.get('next') ?? '/dashboard';
      // PROVIDER / PLAN_MANAGER with PENDING status → payment
      if (
        res.user.status === UserStatus.PENDING &&
        (res.user.activeRole === UserRole.PROVIDER || res.user.activeRole === UserRole.PLAN_MANAGER)
      ) {
        router.replace('/payment');
      } else {
        router.replace(next);
      }
    } catch {
      // error already in store
    }
  }

  const displayError = localError ?? error;

  return (
    <AuthLayout mode="login">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 4 }}>
        Welcome back
      </h1>
      <p style={{ fontSize: 14, color: 'var(--clr-muted)', marginBottom: 28 }}>
        Log in to your Shiftify account
      </p>

      {/* Role hint (optional) */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--clr-muted)', marginBottom: 8 }}>I am a</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setActiveRole(prev => prev === r.value ? null : r.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                activeRole === r.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-[var(--clr-border)] bg-white text-[var(--clr-muted)] hover:border-primary hover:text-primary',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 6 }}>
          Optional — your role is verified by your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <label htmlFor="identifier" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 6 }}>
            Email, phone, or username
          </label>
          <input
            id="identifier"
            type="text"
            autoComplete="username"
            placeholder="you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          />
        </div>

        {displayError && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', fontWeight: 500 }}>
            {displayError}
          </div>
        )}

        {devCode && (
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2E7D32' }}>
            <span style={{ fontWeight: 700 }}>Dev OTP: </span>{devCode}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-shiftify"
          style={{ width: '100%', height: 46, fontSize: 15, fontWeight: 700, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--clr-muted)', marginTop: 24 }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--clr-primary)', fontWeight: 700, textDecoration: 'none' }}>
          Sign up free
        </Link>
      </p>
    </AuthLayout>
  );
}
