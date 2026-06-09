'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';

function ResetPasswordContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const { resetPassword, loading, error, clearError } = useAuth();

  // The backend sends a token in the reset link: /reset-password?token=xxx
  const tokenFromUrl = params.get('token') ?? '';

  const [token,       setToken]       = useState(tokenFromUrl);
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [done,        setDone]        = useState(false);
  const [localError,  setLocalError]  = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!token.trim())       { setLocalError('Reset token is missing.');                   return; }
    if (!password)           { setLocalError('Enter a new password.');                     return; }
    if (password.length < 8) { setLocalError('Password must be at least 8 characters.');  return; }
    if (password !== confirm) { setLocalError('Passwords do not match.');                  return; }

    setSubmitting(true);
    try {
      await resetPassword({ token: token.trim(), newPassword: password });
      setDone(true);
    } catch {
      // error in store
    } finally {
      setSubmitting(false);
    }
  }

  const displayError = localError ?? error;

  return (
    <AuthLayout mode="login">
      <div style={{ marginBottom: 8 }}>
        <Link
          href="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}
        >
          <i className="bi bi-arrow-left" /> Back to login
        </Link>
      </div>

      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(194,24,91,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: 16 }}>
        <i className="bi bi-shield-lock-fill" style={{ fontSize: 22, color: 'var(--clr-primary)' }} />
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 6 }}>
        Set a new password
      </h1>
      <p style={{ fontSize: 14, color: 'var(--clr-muted)', marginBottom: 28 }}>
        Your new password must be at least 8 characters.
      </p>

      {!done ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Show token field only if not in URL */}
          {!tokenFromUrl && (
            <div>
              <label htmlFor="token" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 6 }}>
                Reset Code
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the code from your email"
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label htmlFor="new-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 6 }}>
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 6 }}>
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          {displayError && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', fontWeight: 500 }}>
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-shiftify"
            style={{ width: '100%', height: 46, fontSize: 15, fontWeight: 700, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: 28, color: '#388E3C' }} />
          </div>
          <p style={{ fontSize: 15, color: 'var(--clr-text)', fontWeight: 700 }}>Password updated!</p>
          <p style={{ fontSize: 13, color: 'var(--clr-muted)' }}>
            You can now log in with your new password.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="btn-shiftify"
            style={{ width: '100%', height: 44, fontSize: 14, fontWeight: 700 }}
          >
            Go to Login
          </button>
        </div>
      )}
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px',
  borderRadius: 'var(--btn-radius)',
  border: '1.5px solid var(--clr-border)',
  fontSize: 14, outline: 'none', background: '#fff',
  boxSizing: 'border-box',
};
