'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types';

// ─── Password strength ─────────────────────────────────────────────────────────

function getStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: '', color: 'transparent' };
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum   = /[0-9]/.test(pw);
  const hasSpec  = /[^A-Za-z0-9]/.test(pw);
  const long     = pw.length >= 10;
  const score    = [pw.length >= 8, hasUpper, hasNum, hasSpec, long].filter(Boolean).length;
  if (score <= 2) return { level: 1, label: 'Weak',   color: '#ef4444' };
  if (score <= 3) return { level: 2, label: 'Fair',   color: '#f59e0b' };
  return           { level: 3, label: 'Strong', color: '#22c55e' };
}

// ─── Role cards ───────────────────────────────────────────────────────────────

const ROLE_CARDS: { value: UserRole; label: string; tagline: string; icon: string }[] = [
  { value: UserRole.PARTICIPANT,    label: 'Participant',    tagline: 'I need NDIS support services',              icon: 'bi-person-heart'         },
  { value: UserRole.SUPPORT_WORKER, label: 'Support Worker', tagline: 'I provide direct care & support',           icon: 'bi-hand-thumbs-up-fill'  },
  { value: UserRole.PROVIDER,       label: 'Provider',       tagline: 'Organisation delivering NDIS services',      icon: 'bi-building-fill-check'  },
  { value: UserRole.COORDINATOR,    label: 'Coordinator',    tagline: 'I coordinate support for participants',      icon: 'bi-diagram-3-fill'       },
  { value: UserRole.PLAN_MANAGER,   label: 'Plan Manager',   tagline: 'I manage NDIS funding & budgets',            icon: 'bi-calculator-fill'      },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, loading, error, clearError } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole | null>(null);

  // Step-2 form state
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [showCf,     setShowCf]     = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const strength = getStrength(password);

  // ── Step 1: Role selection ────────────────────────────────────────────────

  function handleRoleNext() {
    if (!role) return;
    clearError();
    setLocalError(null);
    setStep(2);
  }

  // ── Step 2: Registration ──────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!firstName.trim()) { setLocalError('First name is required.');          return; }
    if (!lastName.trim())  { setLocalError('Last name is required.');           return; }
    if (!phone.trim())     { setLocalError('Phone number is required.');        return; }
    if (!password)         { setLocalError('Password is required.');            return; }
    if (password.length < 8) { setLocalError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setLocalError('Passwords do not match.');       return; }

    try {
      const res = await registerUser({
        role:     role!,
        name:     `${firstName.trim()} ${lastName.trim()}`,
        password,
        email:    email || undefined,
        phone:    phone.trim(),
      });

      // Store dev code for OTP page
      if (res._dev_code) {
        sessionStorage.setItem('shiftify_dev_otp', res._dev_code);
      }

      // All new users → verify phone first
      router.replace('/setup/verify');
    } catch {
      // error in store
    }
  }

  const displayError = localError ?? error;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AuthLayout mode="register">

      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        {([1, 2] as const).map((s) => (
          <div
            key={s}
            style={{
              width: s === step ? 28 : 10,
              height: 10,
              borderRadius: 5,
              background: s <= step ? 'var(--clr-primary)' : 'var(--clr-border)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--clr-muted)', fontWeight: 600 }}>
          Step {step} of 2
        </span>
      </div>

      {/* ── STEP 1: Role Picker ── */}
      {step === 1 && (
        <>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, marginBottom: 4 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: 'var(--clr-muted)', marginBottom: 24 }}>
            First, tell us how you&apos;ll use Shiftify
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ROLE_CARDS.map((card) => {
              const selected = role === card.value;
              return (
                <button
                  key={card.value}
                  type="button"
                  onClick={() => setRole(card.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    width: '100%', padding: '14px 16px',
                    borderRadius: 'var(--card-radius)',
                    border: selected ? '2px solid var(--clr-primary)' : '1.5px solid var(--clr-border)',
                    background: selected ? 'rgba(194,24,91,0.04)' : '#fff',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: selected ? 'var(--clr-primary)' : 'var(--clr-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: selected ? '#fff' : 'var(--clr-primary)',
                    transition: 'all 0.18s ease',
                  }}>
                    <i className={`bi ${card.icon}`} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-text)', lineHeight: 1.2 }}>{card.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-muted)', marginTop: 2 }}>{card.tagline}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: selected ? '2px solid var(--clr-primary)' : '2px solid var(--clr-border)',
                    background: selected ? 'var(--clr-primary)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: 11 }} />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!role}
            onClick={handleRoleNext}
            className="btn-shiftify"
            style={{ width: '100%', height: 46, fontSize: 15, fontWeight: 700, marginTop: 20, opacity: role ? 1 : 0.5, cursor: role ? 'pointer' : 'not-allowed' }}
          >
            Continue
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--clr-muted)', marginTop: 20 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--clr-primary)', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
          </p>
        </>
      )}

      {/* ── STEP 2: Registration Form ── */}
      {step === 2 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setStep(1); setLocalError(null); clearError(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary)', padding: 0 }}
              aria-label="Back"
            >
              <i className="bi bi-arrow-left" style={{ fontSize: 18 }} />
            </button>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--clr-text)', letterSpacing: -0.5, margin: 0 }}>
                {ROLE_CARDS.find(r => r.value === role)?.label} Account
              </h1>
              <p style={{ fontSize: 13, color: 'var(--clr-muted)', margin: 0 }}>Fill in your details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="firstName" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 }}>First Name</label>
                <input id="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane"
                  style={inputStyle} autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="lastName" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 }}>Last Name</label>
                <input id="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith"
                  style={inputStyle} autoComplete="family-name" />
              </div>
            </div>

            <div>
              <label htmlFor="phone" style={labelStyle}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+61 4xx xxx xxx" style={inputStyle} autoComplete="tel" />
            </div>

            <div>
              <label htmlFor="email" style={labelStyle}>Email Address <span style={{ fontWeight: 400, color: 'var(--clr-muted)' }}>(optional)</span></label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle} autoComplete="email" />
            </div>

            {/* Password with show/hide + strength */}
            <div>
              <label htmlFor="reg-password" style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input id="reg-password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" style={{ ...inputStyle, paddingRight: 42 }} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-muted)', padding: 0, fontSize: 16 }}>
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {([1, 2, 3] as const).map(l => (
                      <div key={l} style={{ flex: 1, height: 3, borderRadius: 4, background: strength.level >= l ? strength.color : 'var(--clr-border)', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm" style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input id="confirm" type={showCf ? 'text' : 'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" style={{ ...inputStyle, paddingRight: 42 }} autoComplete="new-password" />
                <button type="button" onClick={() => setShowCf(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-muted)', padding: 0, fontSize: 16 }}>
                  <i className={`bi ${showCf ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            {displayError && (
              <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', fontWeight: 500 }}>
                {displayError}
              </div>
            )}

            <p style={{ fontSize: 11, color: 'var(--clr-muted)', lineHeight: 1.5 }}>
              By creating an account you agree to our{' '}
              <Link href="/terms" style={{ color: 'var(--clr-primary)', textDecoration: 'none' }}>Terms</Link> and{' '}
              <Link href="/privacy" style={{ color: 'var(--clr-primary)', textDecoration: 'none' }}>Privacy Policy</Link>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="btn-shiftify"
              style={{ width: '100%', height: 46, fontSize: 15, fontWeight: 700, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────


const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px',
  borderRadius: 'var(--btn-radius)',
  border: '1.5px solid var(--clr-border)',
  fontSize: 14, outline: 'none', background: '#fff',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--clr-text)', marginBottom: 5,
};
