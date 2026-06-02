'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { UserStatus } from '@/lib/types';
import { PLAN_REQUIRED_ROLES } from '@/lib/store/auth.store';

// Map backend error codes to friendly messages
function friendlyError(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.includes('INVALID_CREDENTIALS') || raw.toLowerCase().includes('invalid credentials'))
    return 'Incorrect email, phone, username or password.';
  if (raw.includes('USER_SUSPENDED') || raw.toLowerCase().includes('suspended'))
    return 'Your account has been suspended. Contact support for help.';
  if (raw.includes('USER_PENDING') || raw.toLowerCase().includes('pending'))
    return 'Your account is not yet activated. Complete the setup steps first.';
  if (raw.includes('USER_NOT_FOUND') || raw.toLowerCase().includes('not found'))
    return 'No account found with those details. Check your details or sign up.';
  if (raw.includes('NETWORK_ERROR') || raw.toLowerCase().includes('network'))
    return 'Could not reach the server. Check your connection and try again.';
  return raw;
}

function LoginContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const { login, loading, error, clearError, activatePlan } = useAuth();

  const [identifier,  setIdentifier]  = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [localError,  setLocalError]  = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!identifier.trim()) { setLocalError('Enter your email, phone number, or username.'); return; }
    if (!password)           { setLocalError('Enter your password.'); return; }

    try {
      const res = await login({ identifier: identifier.trim(), password });
      const next = params.get('next') ?? '/dashboard';

      if (res.user.status === UserStatus.PENDING && !res.user.phoneVerified) {
        router.replace('/setup/verify');
      } else if (res.user.status === UserStatus.PENDING && PLAN_REQUIRED_ROLES.has(res.user.activeRole)) {
        router.replace('/setup/plan');
      } else if (res.user.status === UserStatus.PENDING) {
        await activatePlan();
        router.replace('/dashboard');
      } else {
        router.replace(next);
      }
    } catch {
      // error already in store
    }
  }

  const displayError = friendlyError(localError ?? error);

  return (
    <AuthLayout mode="login">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 4 }}>
        Welcome back
      </h1>
      <p style={{ fontSize: 14, color: 'var(--clr-muted)', marginBottom: 28 }}>
        Log in to your Shiftify account
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Identifier */}
        <div>
          <label htmlFor="identifier" style={labelStyle}>
            Email, phone number, or username
          </label>
          <input
            id="identifier"
            type="text"
            autoComplete="username"
            placeholder="you@example.com or +61 4xx xxx xxx"
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setLocalError(null); clearError(); }}
            style={inputStyle}
          />
        </div>

        {/* Password with show/hide */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text)' }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLocalError(null); clearError(); }}
              style={{ ...inputStyle, paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              tabIndex={-1}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--clr-muted)', padding: 0, display: 'flex', alignItems: 'center',
              }}
            >
              <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 17 }} />
            </button>
          </div>
        </div>

        {/* Error */}
        {displayError && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', fontWeight: 500 }}>
            {displayError}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginContent />
    </Suspense>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px',
  borderRadius: 'var(--btn-radius)',
  border: '1.5px solid var(--clr-border)',
  fontSize: 14, outline: 'none', background: '#fff',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--clr-text)', marginBottom: 6,
};
