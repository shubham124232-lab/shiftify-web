'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { forgotPassword, loading, error, clearError } = useAuth();

  const [identifier,  setIdentifier]  = useState('');
  const [sent,        setSent]        = useState(false);
  const [devCode,     setDevCode]     = useState<string | null>(null);
  const [localError,  setLocalError]  = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!identifier.trim()) {
      setLocalError('Enter your email or phone number.');
      return;
    }

    try {
      const res = await forgotPassword({ identifier: identifier.trim() });
      setSent(true);
      if (res._dev_code) setDevCode(res._dev_code);
    } catch {
      // error in store
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
        <i className="bi bi-envelope-open-fill" style={{ fontSize: 22, color: 'var(--clr-primary)' }} />
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 6 }}>
        Reset your password
      </h1>
      <p style={{ fontSize: 14, color: 'var(--clr-muted)', marginBottom: 28, lineHeight: 1.6 }}>
        Enter the email or phone linked to your account. We&apos;ll send a reset link.
      </p>

      {!sent ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="identifier" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 6 }}>
              Email or phone
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or +61 4xx xxx xxx"
              autoComplete="email"
              style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--clr-border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>

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
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: 28, color: '#388E3C' }} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--clr-text)', fontWeight: 600 }}>Reset link sent!</p>
          <p style={{ fontSize: 13, color: 'var(--clr-muted)', lineHeight: 1.6 }}>
            Check your inbox (and spam). The link expires in 30 minutes.
          </p>

          {devCode && (
            <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2E7D32', fontWeight: 500, width: '100%' }}>
              <span style={{ fontWeight: 700 }}>Dev reset code: </span>{devCode}
            </div>
          )}

          <button
            type="button"
            onClick={() => { setSent(false); setDevCode(null); }}
            style={{ fontSize: 13, color: 'var(--clr-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Resend or try a different address
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
