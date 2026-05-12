'use client';
// src/app/register/page.jsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

/* ── Role options ── */
const ROLES = [
  {
    id: 'participant',
    label: 'Participant',
    icon: 'bi-person-heart',
    desc: 'Find support workers & manage your NDIS plan',
    color: '#C2185B',
    bg: '#FFF0F5',
  },
  {
    id: 'support_worker',
    label: 'Support Worker',
    icon: 'bi-people-fill',
    desc: 'Find shifts and connect with participants',
    color: '#0288D1',
    bg: '#E1F5FE',
  },
  {
    id: 'provider',
    label: 'Provider',
    icon: 'bi-building-fill',
    desc: 'Manage your team and grow your NDIS business',
    color: '#388E3C',
    bg: '#E8F5E9',
  },
  {
    id: 'support_coordinator',
    label: 'Support Coordinator',
    icon: 'bi-diagram-3-fill',
    desc: 'Coordinate support for participants in your care',
    color: '#7B1FA2',
    bg: '#F3E5F5',
  },
  {
    id: 'plan_manager',
    label: 'Plan Manager',
    icon: 'bi-clipboard2-data-fill',
    desc: 'Manage budgets, invoices and NDIS funds',
    color: '#E64A19',
    bg: '#FBE9E7',
  },
];

/* ── Password strength ── */
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: 'Too short',  color: '#EF4444' },
    { label: 'Weak',       color: '#F97316' },
    { label: 'Fair',       color: '#EAB308' },
    { label: 'Good',       color: '#22C55E' },
    { label: 'Strong',     color: '#10B981' },
  ];
  return { score, ...map[score] };
}

/* ── Step indicator ── */
function StepDots({ step }) {
  return (
    <div className="step-dots" aria-label={`Step ${step} of 3`}>
      {[1, 2, 3].map(s => (
        <div
          key={s}
          className={`step-dot${s === step ? ' active' : s < step ? ' done' : ''}`}
          aria-current={s === step ? 'step' : undefined}
        >
          {s < step && <i className="bi bi-check" aria-hidden="true" />}
        </div>
      ))}
      <style jsx>{`
        .step-dots {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 28px;
        }
        .step-dot {
          width: 10px; height: 10px;
          border-radius: 100px;
          background: var(--clr-border);
          transition: all 0.3s;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; color: #fff;
        }
        .step-dot.active  { width: 32px; background: var(--clr-primary); }
        .step-dot.done    { background: #10B981; width: 18px; height: 18px; }
      `}</style>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep]         = useState(1);
  const [role, setRole]         = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [agree, setAgree]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});

  const strength = getStrength(password);
  const selectedRole = ROLES.find(r => r.id === role);

  // ── Step 1 validation ──
  function validateStep1() {
    if (!role) return { role: 'Please select your role to continue.' };
    return {};
  }
  // ── Step 2 validation ──
  function validateStep2() {
    const e = {};
    if (!firstName.trim()) e.firstName = 'First name is required.';
    if (!lastName.trim())  e.lastName  = 'Last name is required.';
    if (!phone.trim())     e.phone     = 'Phone number is required.';
    else if (!/^[\d\s\+\-\(\)]{8,15}$/.test(phone)) e.phone = 'Enter a valid phone number.';
    if (!email.trim())                     e.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address.';
    return e;
  }
  // ── Step 3 validation ──
  function validateStep3() {
    const e = {};
    if (!password)          e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (password !== confirm) e.confirm = 'Passwords do not match.';
    if (!agree) e.agree = 'You must accept the terms to continue.';
    return e;
  }

  function nextStep() {
    const validators = [null, validateStep1, validateStep2, validateStep3];
    const v = validators[step]();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setStep(s => s + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validateStep3();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setLoading(true);
    // TODO: Replace with real API call
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    setStep(4); // success screen
  }

  // ── SUCCESS SCREEN ──
  if (step === 4) {
    return (
      <>
        <Head>
          <title>Account Created — Shiftify</title>
        </Head>
        <AuthLayout mode="register">
          <div className="auth-card success-card">
            <div className="success-icon" aria-hidden="true">
              <i className="bi bi-check-circle-fill" />
            </div>
            <h1 className="success-title">You&apos;re all set!</h1>
            <p className="success-sub">
              Welcome to Shiftify, <strong>{firstName}</strong>. Your account has been created.
              {selectedRole && ` You're registered as a ${selectedRole.label}.`}
            </p>
            <Link href="/login" className="btn-submit" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
              Go to Login <i className="bi bi-arrow-right ms-2" />
            </Link>
          </div>
          <style jsx>{`
            .auth-card {
              background: #fff;
              border-radius: 24px;
              box-shadow: var(--shadow-lg);
              padding: 56px 44px;
              border: 1px solid var(--clr-border);
              text-align: center;
              animation: cardIn 0.45s cubic-bezier(0.4,0,0.2,1) both;
            }
            @keyframes cardIn {
              from { opacity: 0; transform: scale(0.96); }
              to   { opacity: 1; transform: scale(1); }
            }
            .success-icon { font-size: 56px; color: #10B981; margin-bottom: 20px; }
            .success-title {
              font-family: var(--font-display);
              font-size: 28px; font-weight: 800;
              color: var(--clr-text); margin-bottom: 12px;
            }
            .success-sub {
              font-size: 15px; color: var(--clr-muted);
              line-height: 1.7; margin-bottom: 32px;
            }
            .btn-submit {
              width: 100%; padding: 14px 28px;
              background: var(--clr-primary); color: #fff;
              border: none; border-radius: 12px;
              font-family: var(--font-body);
              font-size: 15px; font-weight: 800;
              cursor: pointer;
              display: flex; align-items: center; justify-content: center; gap: 8px;
              transition: all var(--transition);
            }
            .btn-submit:hover {
              background: var(--clr-primary-dark);
              transform: translateY(-2px);
              box-shadow: 0 8px 24px rgba(194,24,91,0.38);
            }
          `}</style>
        </AuthLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Create Account — Shiftify</title>
        <meta name="description" content="Join Shiftify — Australia's trusted NDIS marketplace for participants and support workers." />
      </Head>

      <AuthLayout mode="register">
        <div className="auth-card">

          {/* Step dots */}
          <StepDots step={step} />

          {/* ════════════════════════════ STEP 1 — Role ════════════════════════════ */}
          {step === 1 && (
            <div>
              <h1 className="auth-card-title">Create your account</h1>
              <p className="auth-card-sub">First, tell us how you&apos;ll use Shiftify</p>

              <div className="role-grid">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`role-card${role === r.id ? ' active' : ''}`}
                    onClick={() => { setRole(r.id); setErrors({}); }}
                    aria-pressed={role === r.id}
                    style={role === r.id ? {
                      borderColor: r.color,
                      background: r.bg,
                    } : {}}
                  >
                    <div className="role-card-icon" style={{ background: r.bg, color: r.color }}>
                      <i className={`bi ${r.icon}`} aria-hidden="true" />
                    </div>
                    <div className="role-card-text">
                      <div className="role-card-name">{r.label}</div>
                      <div className="role-card-desc">{r.desc}</div>
                    </div>
                    {role === r.id && (
                      <i className="bi bi-check-circle-fill role-check" style={{ color: r.color }} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>

              {errors.role && (
                <p role="alert" className="field-error mb-3">
                  <i className="bi bi-exclamation-circle me-1" />
                  {errors.role}
                </p>
              )}

              <button type="button" className="btn-submit" onClick={nextStep}>
                Continue
                <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
              </button>

              <p className="auth-card-footer">
                Already have an account? <Link href="/login" className="auth-link">Log in</Link>
              </p>
            </div>
          )}

          {/* ════════════════════════════ STEP 2 — Personal Info ═══════════════════ */}
          {step === 2 && (
            <div>
              <button type="button" className="back-btn" onClick={() => { setStep(1); setErrors({}); }}>
                <i className="bi bi-arrow-left me-1" aria-hidden="true" />
                Back
              </button>
              <h1 className="auth-card-title">Your details</h1>
              {selectedRole && (
                <div className="role-pill" style={{ background: selectedRole.bg, color: selectedRole.color, borderColor: selectedRole.color + '40' }}>
                  <i className={`bi ${selectedRole.icon}`} aria-hidden="true" />
                  {selectedRole.label}
                </div>
              )}
              <p className="auth-card-sub" style={{ marginTop: 8 }}>Tell us a bit about yourself</p>

              <form noValidate aria-label="Personal information">

                {/* Name row */}
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label htmlFor="reg-first" className="form-lbl">First name</label>
                    <input
                      id="reg-first" type="text"
                      className={`form-input${errors.firstName ? ' input-error' : ''}`}
                      placeholder="Jane"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      aria-describedby={errors.firstName ? 'fn-err' : undefined}
                    />
                    {errors.firstName && <p id="fn-err" role="alert" className="field-error">{errors.firstName}</p>}
                  </div>
                  <div className="col-6">
                    <label htmlFor="reg-last" className="form-lbl">Last name</label>
                    <input
                      id="reg-last" type="text"
                      className={`form-input${errors.lastName ? ' input-error' : ''}`}
                      placeholder="Smith"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      autoComplete="family-name"
                      aria-describedby={errors.lastName ? 'ln-err' : undefined}
                    />
                    {errors.lastName && <p id="ln-err" role="alert" className="field-error">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Phone */}
                <div className="form-field">
                  <label htmlFor="reg-phone" className="form-lbl">Phone number</label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-telephone input-icon" aria-hidden="true" />
                    <input
                      id="reg-phone" type="tel"
                      className={`form-input${errors.phone ? ' input-error' : ''}`}
                      placeholder="+61 4xx xxx xxx"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      autoComplete="tel"
                      aria-describedby={errors.phone ? 'ph-err' : undefined}
                    />
                  </div>
                  {errors.phone && <p id="ph-err" role="alert" className="field-error">{errors.phone}</p>}
                </div>

                {/* Email */}
                <div className="form-field">
                  <label htmlFor="reg-email" className="form-lbl">Email address</label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-envelope input-icon" aria-hidden="true" />
                    <input
                      id="reg-email" type="email"
                      className={`form-input${errors.email ? ' input-error' : ''}`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      aria-describedby={errors.email ? 'em-err' : undefined}
                    />
                  </div>
                  {errors.email && <p id="em-err" role="alert" className="field-error">{errors.email}</p>}
                </div>

                <button type="button" className="btn-submit" onClick={nextStep}>
                  Continue
                  <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </button>
              </form>
            </div>
          )}

          {/* ════════════════════════════ STEP 3 — Password + Terms ════════════════ */}
          {step === 3 && (
            <div>
              <button type="button" className="back-btn" onClick={() => { setStep(2); setErrors({}); }}>
                <i className="bi bi-arrow-left me-1" aria-hidden="true" />
                Back
              </button>
              <h1 className="auth-card-title">Secure your account</h1>
              <p className="auth-card-sub">Create a strong password to protect your account</p>

              <form onSubmit={handleSubmit} noValidate aria-label="Password and terms">

                {/* Password */}
                <div className="form-field">
                  <label htmlFor="reg-password" className="form-lbl">Password</label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-lock input-icon" aria-hidden="true" />
                    <input
                      id="reg-password"
                      type={showPass ? 'text' : 'password'}
                      className={`form-input input-with-action${errors.password ? ' input-error' : ''}`}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      aria-describedby="pw-strength"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => setShowPass(v => !v)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                  {errors.password && <p role="alert" className="field-error">{errors.password}</p>}

                  {/* Strength meter */}
                  {password && (
                    <div id="pw-strength" className="strength-wrap" aria-live="polite">
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className="strength-bar"
                            style={{ background: i <= strength.score ? strength.color : 'var(--clr-border)' }}
                          />
                        ))}
                      </div>
                      <span className="strength-label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}

                  <ul className="pw-hints" aria-label="Password requirements">
                    <li className={password.length >= 8 ? 'hint-ok' : ''}>
                      <i className={`bi ${password.length >= 8 ? 'bi-check-circle-fill' : 'bi-circle'}`} aria-hidden="true" />
                      At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'hint-ok' : ''}>
                      <i className={`bi ${/[A-Z]/.test(password) ? 'bi-check-circle-fill' : 'bi-circle'}`} aria-hidden="true" />
                      One uppercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? 'hint-ok' : ''}>
                      <i className={`bi ${/[0-9]/.test(password) ? 'bi-check-circle-fill' : 'bi-circle'}`} aria-hidden="true" />
                      One number
                    </li>
                  </ul>
                </div>

                {/* Confirm password */}
                <div className="form-field">
                  <label htmlFor="reg-confirm" className="form-lbl">Confirm password</label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-lock-fill input-icon" aria-hidden="true" />
                    <input
                      id="reg-confirm"
                      type={showConf ? 'text' : 'password'}
                      className={`form-input input-with-action${errors.confirm ? ' input-error' : confirm && password === confirm ? ' input-ok' : ''}`}
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      aria-describedby={errors.confirm ? 'conf-err' : undefined}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => setShowConf(v => !v)}
                      aria-label={showConf ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      <i className={`bi ${showConf ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                  {errors.confirm && <p id="conf-err" role="alert" className="field-error">{errors.confirm}</p>}
                  {confirm && password === confirm && !errors.confirm && (
                    <p className="field-ok">
                      <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div className="terms-row">
                  <label className="custom-checkbox" htmlFor="reg-agree">
                    <input
                      id="reg-agree" type="checkbox"
                      checked={agree}
                      onChange={e => setAgree(e.target.checked)}
                      disabled={loading}
                      aria-describedby={errors.agree ? 'agree-err' : undefined}
                    />
                    <span className="checkbox-box" aria-hidden="true" />
                    <span>
                      I agree to the{' '}
                      <Link href="/terms" className="auth-link">Terms of Service</Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="auth-link">Privacy Policy</Link>
                    </span>
                  </label>
                  {errors.agree && <p id="agree-err" role="alert" className="field-error mt-1">{errors.agree}</p>}
                </div>

                {/* NDIS compliance note */}
                <div className="ndis-note">
                  <i className="bi bi-shield-fill-check" aria-hidden="true" />
                  <span>Shiftify is NDIS registered and compliant. Your data is secure and private.</span>
                </div>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                    </>
                  )}
                </button>

              </form>
            </div>
          )}

        </div>

        {/* ─── Scoped Styles ─── */}
        <style jsx>{`
          /* Card */
          .auth-card {
            background: #fff;
            border-radius: 24px;
            box-shadow: var(--shadow-lg);
            padding: 40px 44px 36px;
            border: 1px solid var(--clr-border);
            animation: cardIn 0.45s cubic-bezier(0.4,0,0.2,1) both;
          }
          @keyframes cardIn {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .auth-card-title {
            font-family: var(--font-display);
            font-size: 24px; font-weight: 800;
            color: var(--clr-text); margin: 0 0 6px;
            letter-spacing: -0.5px;
          }
          .auth-card-sub {
            font-size: 14px; color: var(--clr-muted); margin: 0 0 24px; font-weight: 500;
          }

          /* Back button */
          .back-btn {
            background: none; border: none; padding: 0;
            font-family: var(--font-body);
            font-size: 13px; font-weight: 700;
            color: var(--clr-muted); cursor: pointer;
            display: inline-flex; align-items: center;
            margin-bottom: 16px;
            transition: color var(--transition);
          }
          .back-btn:hover { color: var(--clr-primary); }

          /* Role pill (step 2 indicator) */
          .role-pill {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 5px 12px;
            border-radius: 100px;
            border: 1.5px solid;
            font-size: 12px; font-weight: 700;
            margin-bottom: 4px;
          }

          /* Role selection cards (step 1) */
          .role-grid {
            display: flex; flex-direction: column; gap: 10px;
            margin-bottom: 24px;
          }
          .role-card {
            width: 100%;
            display: flex; align-items: center; gap: 14px;
            padding: 14px 16px;
            border: 1.5px solid var(--clr-border);
            border-radius: 14px;
            background: #fff;
            cursor: pointer;
            transition: all var(--transition);
            text-align: left;
            position: relative;
          }
          .role-card:hover {
            border-color: var(--clr-primary-light);
            background: var(--clr-primary-xlight);
          }
          .role-card.active {
            box-shadow: var(--shadow-sm);
          }
          .role-card-icon {
            width: 42px; height: 42px;
            border-radius: 11px;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px; flex-shrink: 0;
          }
          .role-card-text { flex: 1; }
          .role-card-name {
            font-size: 14px; font-weight: 800; color: var(--clr-text); line-height: 1.2;
          }
          .role-card-desc {
            font-size: 12px; color: var(--clr-muted); margin-top: 2px; line-height: 1.45;
          }
          .role-check { font-size: 18px; flex-shrink: 0; }

          /* Form fields */
          .form-field { margin-bottom: 16px; }
          .form-lbl {
            display: block;
            font-size: 13px; font-weight: 700;
            color: var(--clr-text); margin-bottom: 6px;
          }
          .input-icon-wrap { position: relative; }
          .input-icon {
            position: absolute; left: 14px; top: 50%;
            transform: translateY(-50%);
            color: var(--clr-muted); font-size: 15px;
            pointer-events: none;
          }
          .form-input {
            width: 100%;
            padding: 12px 14px;
            border: 1.5px solid var(--clr-border);
            border-radius: 12px;
            font-family: var(--font-body);
            font-size: 14px; font-weight: 500;
            color: var(--clr-text);
            background: #fff;
            transition: border-color var(--transition), box-shadow var(--transition);
            outline: none;
          }
          /* When inside input-icon-wrap */
          .input-icon-wrap .form-input { padding-left: 40px; }
          .form-input:focus {
            border-color: var(--clr-primary);
            box-shadow: 0 0 0 3px rgba(194,24,91,0.12);
          }
          .form-input.input-error { border-color: #EF4444; }
          .form-input.input-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
          .form-input.input-ok  { border-color: #10B981; }
          .form-input.input-ok:focus  { box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
          .form-input.input-with-action { padding-right: 44px; }
          .form-input:disabled { background: var(--clr-surface); opacity: 0.7; cursor: not-allowed; }

          .input-action-btn {
            position: absolute; right: 12px; top: 50%;
            transform: translateY(-50%);
            background: none; border: none; padding: 4px;
            color: var(--clr-muted); cursor: pointer;
            font-size: 16px; border-radius: 6px;
            transition: color var(--transition);
          }
          .input-action-btn:hover { color: var(--clr-primary); }

          .field-error {
            display: flex; align-items: center; gap: 4px;
            margin: 5px 0 0;
            font-size: 12px; font-weight: 600; color: #EF4444;
          }
          .field-ok {
            display: flex; align-items: center; gap: 4px;
            margin: 5px 0 0;
            font-size: 12px; font-weight: 600; color: #10B981;
          }

          /* Strength meter */
          .strength-wrap {
            display: flex; align-items: center; gap: 8px; margin-top: 8px;
          }
          .strength-bars {
            display: flex; gap: 4px; flex: 1;
          }
          .strength-bar {
            height: 4px; flex: 1; border-radius: 4px;
            transition: background 0.3s;
          }
          .strength-label {
            font-size: 11px; font-weight: 800; white-space: nowrap;
          }

          /* Password hints */
          .pw-hints {
            list-style: none; padding: 0; margin: 10px 0 0;
            display: flex; flex-direction: column; gap: 5px;
          }
          .pw-hints li {
            display: flex; align-items: center; gap: 7px;
            font-size: 12px; font-weight: 600; color: var(--clr-muted);
            transition: color 0.2s;
          }
          .pw-hints li i { font-size: 12px; }
          .pw-hints li.hint-ok { color: #10B981; }
          .pw-hints li.hint-ok i { color: #10B981; }

          /* Checkbox */
          .terms-row { margin-bottom: 14px; }
          .custom-checkbox {
            display: inline-flex; align-items: flex-start; gap: 10px;
            font-size: 13px; font-weight: 500; color: var(--clr-text);
            cursor: pointer; user-select: none; line-height: 1.5;
          }
          .custom-checkbox input[type="checkbox"] {
            position: absolute; opacity: 0; width: 0; height: 0;
          }
          .checkbox-box {
            width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;
            border: 1.5px solid var(--clr-border);
            border-radius: 5px; background: #fff;
            display: flex; align-items: center; justify-content: center;
            transition: all var(--transition);
          }
          .custom-checkbox input:checked ~ .checkbox-box {
            background: var(--clr-primary); border-color: var(--clr-primary);
          }
          .custom-checkbox input:checked ~ .checkbox-box::after {
            content: '';
            width: 5px; height: 9px;
            border: 2px solid #fff;
            border-top: none; border-left: none;
            transform: rotate(45deg) translateY(-1px);
            display: block;
          }
          .custom-checkbox:focus-within .checkbox-box {
            outline: 3px solid rgba(194,24,91,0.25); outline-offset: 2px;
          }

          /* NDIS note */
          .ndis-note {
            display: flex; align-items: center; gap: 8px;
            background: var(--clr-primary-xlight);
            border: 1px solid var(--clr-primary-light);
            border-radius: 10px;
            padding: 10px 14px;
            font-size: 12px; font-weight: 600; color: var(--clr-primary);
            margin-bottom: 20px;
          }
          .ndis-note i { font-size: 15px; flex-shrink: 0; }

          /* Submit button */
          .btn-submit {
            width: 100%;
            padding: 14px 28px;
            background: var(--clr-primary);
            color: #fff;
            border: none;
            border-radius: 12px;
            font-family: var(--font-body);
            font-size: 15px; font-weight: 800;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: all var(--transition);
            margin-bottom: 20px;
          }
          .btn-submit:hover:not(:disabled) {
            background: var(--clr-primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(194,24,91,0.38);
          }
          .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

          .spinner {
            width: 16px; height: 16px;
            border: 2px solid rgba(255,255,255,0.35);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          /* Footer text */
          .auth-card-footer {
            text-align: center;
            font-size: 13px; color: var(--clr-muted); font-weight: 500; margin: 0;
          }
          .auth-link { color: var(--clr-primary); font-weight: 700; text-decoration: none; }
          .auth-link:hover { text-decoration: underline; }

          @media (max-width: 575px) {
            .auth-card { padding: 32px 20px 28px; border-radius: 20px; }
            .auth-card-title { font-size: 20px; }
          }
        `}</style>

      </AuthLayout>
    </>
  );
}
