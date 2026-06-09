'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
export default function VerifyPage() {
  const router = useRouter();
  const { user, activeRole, silentInit } = useAuth();

  const [code,      setCode]      = useState(['', '', '', '', '', '']);
  const [devCode,   setDevCode]   = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [resent,    setResent]    = useState(false);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Load dev OTP from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('shiftify_dev_otp');
    if (stored) setDevCode(stored);
  }, []);

  // Handle per-digit input
  function handleDigit(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      setCode(digits.split(''));
      inputs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) { setError('Enter the 6-digit code.'); return; }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/verify/confirm', { channel: 'phone', code: fullCode });
      sessionStorage.removeItem('shiftify_dev_otp');
      await silentInit(); // refresh user state
      // All roles go to the profile wizard — participants activate after wizard completion
      router.replace('/setup/profile/3');
    } catch (err: any) {
      setError(err?.message ?? 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResent(false);
    setError(null);
    try {
      await api.post('/auth/verify/resend', { channel: 'phone' });
      setResent(true);
    } catch {
      setError('Could not resend code. Please try again.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--clr-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>

      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-heart-pulse-fill" style={{ color: '#fff', fontSize: 18 }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--clr-primary)', letterSpacing: -0.5 }}>Shiftify</span>
      </Link>

      <div className="card-shiftify" style={{ maxWidth: 420, width: '100%', padding: '36px 32px' }}>

        {/* Icon */}
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(194,24,91,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <i className="bi bi-phone-fill" style={{ color: 'var(--clr-primary)', fontSize: 24 }} />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--clr-text)', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 }}>
          Verify your phone
        </h1>
        <p style={{ fontSize: 14, color: 'var(--clr-muted)', textAlign: 'center', lineHeight: 1.5, marginBottom: 28 }}>
          We sent a 6-digit code to your mobile.
          {user?.phone ? ` (${user.phone.slice(0, 4)}•••${user.phone.slice(-3)})` : ''}
        </p>

        {/* Dev code hint */}
        {devCode && (
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2E7D32', marginBottom: 20, textAlign: 'center' }}>
            <span style={{ fontWeight: 700 }}>Dev OTP: </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}>{devCode}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 6-digit boxes */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 48, height: 56, textAlign: 'center',
                  fontSize: 22, fontWeight: 700, fontFamily: 'monospace',
                  borderRadius: 12,
                  border: digit ? '2px solid var(--clr-primary)' : '1.5px solid var(--clr-border)',
                  outline: 'none', background: '#fff',
                  color: 'var(--clr-text)',
                  transition: 'border 0.15s',
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', fontWeight: 500, marginBottom: 16, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {resent && (
            <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2E7D32', marginBottom: 16, textAlign: 'center' }}>
              Code resent! Check your phone.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.join('').length < 6}
            className="btn-shiftify"
            style={{ width: '100%', height: 46, fontSize: 15, fontWeight: 700, opacity: (loading || code.join('').length < 6) ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Verifying…' : 'Verify Phone'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--clr-muted)' }}>
          Didn&apos;t receive it?{' '}
          <button
            type="button"
            onClick={handleResend}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)', fontWeight: 700, fontSize: 13, padding: 0 }}
          >
            Resend code
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
          <Link href="/login" style={{ color: 'var(--clr-muted)', textDecoration: 'none' }}>
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
