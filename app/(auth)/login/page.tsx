'use client';

import { useState, useRef, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuthStore } from '@/lib/store/auth.store';
import { api } from '@/lib/api';
import { UserStatus } from '@/lib/types';
import type { LoginPendingResponse, LoginResponse } from '@/lib/types';
import { WIZARD_START_STEP } from '@/lib/registration/stepConfig';

// ─── Error message helpers ────────────────────────────────────────────────────

function friendlyError(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.toLowerCase().includes('invalid credentials'))
    return 'Incorrect email, phone, username or password.';
  if (raw.toLowerCase().includes('suspended'))
    return 'Your account has been suspended. Contact support for help.';
  if (raw.toLowerCase().includes('expired') || raw.toLowerCase().includes('log in again'))
    return 'Login session expired. Please start again.';
  if (raw.toLowerCase().includes('incorrect code'))
    return 'Incorrect code. Check the message and try again.';
  if (raw.toLowerCase().includes('too many'))
    return 'Too many attempts — wait a moment before trying again.';
  if (raw.toLowerCase().includes('no active verification'))
    return 'Code has expired. Go back and log in again to get a new one.';
  if (raw.toLowerCase().includes('network'))
    return 'Could not reach the server. Check your connection and try again.';
  return raw;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

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

// ─── Step 1 — credentials ─────────────────────────────────────────────────────

interface Step1Props {
  onSuccess: (pending: LoginPendingResponse) => void;
}

function Step1({ onSuccess }: Step1Props) {
  const [identifier,  setIdentifier]  = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) { setError('Enter your email, phone number, or username.'); return; }
    if (!password)           { setError('Enter your password.'); return; }

    setSubmitting(true);
    try {
      const data = await api.post<LoginPendingResponse>('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      if (data._dev_code && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('shiftify_dev_login_otp', data._dev_code);
      }

      onSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 4 }}>
        Welcome back
      </h1>
      <p style={{ fontSize: 14, color: 'var(--clr-muted)', marginBottom: 28 }}>
        Log in to your Shiftify account
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
            onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
            style={inputStyle}
          />
        </div>

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
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              style={{ ...inputStyle, paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              tabIndex={-1}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-muted)', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 17 }} />
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', fontWeight: 500 }}>
            {friendlyError(error)}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-shiftify"
          style={{ width: '100%', height: 46, fontSize: 15, fontWeight: 700, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {submitting && <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
          {submitting ? 'Checking…' : 'Continue'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--clr-muted)', marginTop: 24 }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--clr-primary)', fontWeight: 700, textDecoration: 'none' }}>
          Sign up free
        </Link>
      </p>
    </>
  );
}

// ─── Step 2 — OTP entry ────────────────────────────────────────────────────────

interface Step2Props {
  pending:   LoginPendingResponse;
  onBack:    () => void;
  onSuccess: (res: LoginResponse) => void;
}

function Step2({ pending, onBack, onSuccess }: Step2Props) {
  const [code,       setCode]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const channelLabel = pending.channel === 'email' ? 'email' : 'phone';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = code.replace(/\s/g, '');
    if (trimmed.length !== 6) { setError('Enter the 6-digit code.'); return; }

    setSubmitting(true);
    try {
      const data = await api.post<LoginResponse>('/auth/login/verify', {
        pendingToken: pending.pendingToken,
        code: trimmed,
      });
      onSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--clr-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 }}
      >
        <i className="bi bi-arrow-left" /> Back
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 6 }}>
        Check your {channelLabel}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--clr-muted)', marginBottom: 28, lineHeight: 1.5 }}>
        We sent a 6-digit code to{' '}
        <span style={{ fontWeight: 700, color: 'var(--clr-text)' }}>{pending.maskedContact}</span>.
        Enter it below to log in.
      </p>

      {pending._dev_code && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#15803d', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-bug" />
          Dev OTP: <span style={{ letterSpacing: 2 }}>{pending._dev_code}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="otp-code" style={labelStyle}>Verification code</label>
          <input
            ref={inputRef}
            id="otp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
              setCode(val);
              setError(null);
            }}
            autoFocus
            style={{ ...inputStyle, letterSpacing: 6, fontSize: 22, fontWeight: 700, textAlign: 'center' }}
          />
        </div>

        {error && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', fontWeight: 500 }}>
            {friendlyError(error)}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-shiftify"
          style={{ width: '100%', height: 46, fontSize: 15, fontWeight: 700, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {submitting && <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
          {submitting ? 'Verifying…' : 'Log In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--clr-muted)', marginTop: 20 }}>
        Didn&apos;t receive it?{' '}
        <button
          type="button"
          onClick={onBack}
          style={{ color: 'var(--clr-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}
        >
          Go back to resend
        </button>
      </p>
    </>
  );
}

// ─── Page orchestrator ────────────────────────────────────────────────────────

function LoginContent() {
  const router       = useRouter();
  const params       = useSearchParams();
  const setTokens    = useAuthStore(s => s.setTokens);

  const [step,    setStep]    = useState<'credentials' | 'otp'>('credentials');
  const [pending, setPending] = useState<LoginPendingResponse | null>(null);

  function handleStep1Success(data: LoginPendingResponse) {
    setPending(data);
    setStep('otp');
  }

  function handleStep2Success(data: LoginResponse) {
    setTokens(data.accessToken, data.user);
    const next = params.get('next') ?? '/dashboard';

    if (data.user.status === UserStatus.PENDING) {
      router.replace(data.user.phoneVerified ? `/setup/profile/${WIZARD_START_STEP}` : '/setup/verify');
    } else {
      router.replace(next);
    }
  }

  return (
    <AuthLayout mode="login">
      {step === 'credentials' && (
        <Step1 onSuccess={handleStep1Success} />
      )}
      {step === 'otp' && pending && (
        <Step2
          pending={pending}
          onBack={() => { setStep('credentials'); setPending(null); }}
          onSuccess={handleStep2Success}
        />
      )}
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
