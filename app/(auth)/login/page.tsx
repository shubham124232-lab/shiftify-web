'use client';

import { useState, useRef, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { peekResumableDraft } from '@/lib/store/guestJobDraft';
import { prepareAccountForDraft } from '@/lib/guestDraftResume';
import { TIER_META } from '@/lib/types/posting';
import LoginShell from '@/components/auth/LoginShell';
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

// ─── Step 1 — credentials ─────────────────────────────────────────────────────

interface Step1Props {
  onSuccess: (data: LoginPendingResponse | LoginResponse) => void;
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
      const data = await api.post<LoginPendingResponse | LoginResponse>('/auth/login', {
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
      <h1>Log in to Shiftify</h1>
      <p className="lg-sub">Continue to your workspace.</p>

      <form onSubmit={handleSubmit}>
        <div className="lg-field">
          <label htmlFor="identifier">Email or username</label>
          <div className="lg-input">
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="Enter your email or username"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
            />
          </div>
        </div>

        <div className="lg-field">
          <label htmlFor="password">Password</label>
          <div className="lg-input">
            <input
              id="password"
              className="has-icon"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
            />
            <button
              type="button"
              className="lg-eye"
              onClick={() => setShowPwd(v => !v)}
              tabIndex={-1}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 17 }} />
            </button>
          </div>
        </div>

        <Link href="/forgot-password" className="lg-forgot">Forgot password?</Link>

        {error && <div className="lg-error">{friendlyError(error)}</div>}

        <button type="submit" disabled={submitting} className="lg-submit">
          {submitting && <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
          {submitting ? 'Checking…' : 'Log in'}
        </button>
      </form>

      <hr className="lg-divider" />
      <p className="lg-new">
        New to Shiftify?
        <Link href="/register">Create an account</Link>
      </p>

      <div className="lg-urgent">
        <i className="bi bi-clock" />
        <div>
          <strong>Need to post urgently?</strong>
          <Link href="/jobs/post">Start a request &rarr;</Link>
          <small>Create a draft. Register before publishing.</small>
        </div>
      </div>
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
      <button type="button" onClick={onBack} className="lg-otp-back">
        <i className="bi bi-arrow-left" /> Back
      </button>

      <h1>Check your {channelLabel}</h1>
      <p className="lg-sub">
        We sent a 6-digit code to{' '}
        <strong style={{ color: '#17181d' }}>{pending.maskedContact}</strong>.
        Enter it below to log in.
      </p>

      {pending._dev_code && (
        <div className="lg-dev">
          <i className="bi bi-bug" /> Dev OTP: <span style={{ letterSpacing: 2 }}>{pending._dev_code}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="lg-field">
          <label htmlFor="otp-code">Verification code</label>
          <div className="lg-input">
            <input
              ref={inputRef}
              id="otp-code"
              className="lg-otp-input"
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
            />
          </div>
        </div>

        {error && <div className="lg-error">{friendlyError(error)}</div>}

        <button type="submit" disabled={submitting} className="lg-submit">
          {submitting && <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
          {submitting ? 'Verifying…' : 'Log in'}
        </button>
      </form>

      <p className="lg-new" style={{ marginTop: 20, marginBottom: 0 }}>
        Didn&apos;t receive it?
        <button type="button" onClick={onBack} style={{ marginLeft: 4, color: '#c91355', fontWeight: 700, background: 'none', border: 0, cursor: 'pointer', fontSize: 12, padding: 0, textDecoration: 'underline' }}>
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

  function handleStep1Success(data: LoginPendingResponse | LoginResponse) {
    if ('pendingToken' in data) {
      // Phone login — show OTP step
      setPending(data);
      setStep('otp');
    } else {
      // Email/username login — direct session, no OTP needed
      handleStep2Success(data);
    }
  }

  async function handleStep2Success(data: LoginResponse) {
    setTokens(data.accessToken, data.user);
    const next = params.get('next') ?? '/dashboard';

    if (data.user.status === UserStatus.PENDING) {
      // Let the dashboard layout determine the correct setup step — it has
      // initialized state (phoneVerified, profileStep) after /users/me loads.
      router.replace('/dashboard');
    } else {
      // Logged in while a request was half-filled as a guest: go back to its review step.
      const draft = params.get('next') ? null : peekResumableDraft(data.user.activeRole);
      // An existing participant who never saved a suburb would otherwise be sent to their profile first.
      if (draft) await prepareAccountForDraft(draft);
      router.replace(draft ? `/jobs/post/${TIER_META[draft.tier].path}` : next);
    }
  }

  return (
    <LoginShell>
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
    </LoginShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginContent />
    </Suspense>
  );
}
