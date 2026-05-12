'use client';
// src/app/login/page.jsx
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

const ROLES = [
  { id: 'participant',        label: 'Participant',         icon: 'bi-person-heart' },
  { id: 'support_worker',     label: 'Support Worker',      icon: 'bi-people-fill' },
  { id: 'provider',           label: 'Provider',            icon: 'bi-building-fill' },
  { id: 'support_coordinator',label: 'Support Coordinator', icon: 'bi-diagram-3-fill' },
  { id: 'plan_manager',       label: 'Plan Manager',        icon: 'bi-clipboard2-data-fill' },
];

export default function LoginPage() {
  const [role, setRole]         = useState('participant');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  // --- Validation ---
  function validate() {
    const e = {};
    if (!email.trim())                      e.email    = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email))  e.email    = 'Enter a valid email address.';
    if (!password)                          e.password = 'Password is required.';
    else if (password.length < 6)          e.password = 'Password must be at least 6 characters.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setLoading(true);
    // TODO: Replace with real API call e.g. await signIn(email, password, role)
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    // Redirect after login
    // router.push('/dashboard');
  }

  return (
    <>
      <Head>
        <title>Log In — Shiftify</title>
        <meta name="description" content="Log in to your Shiftify account and connect with trusted NDIS support." />
      </Head>

      <AuthLayout mode="login">

        {/* ─── Card ─── */}
        <div className="auth-card">

          {/* Header */}
          <div className="auth-card-header">
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-sub">Log in to your Shiftify account</p>
          </div>

          {/* Role Selector */}
          <div className="role-group" role="group" aria-label="Select your role">
            <div className="role-group-label">I am a</div>
            <div className="role-chips">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`role-chip${role === r.id ? ' active' : ''}`}
                  onClick={() => setRole(r.id)}
                  aria-pressed={role === r.id}
                >
                  <i className={`bi ${r.icon}`} aria-hidden="true" />
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="auth-divider"><span>or continue with email</span></div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate aria-label="Login form">

            {/* Email */}
            <div className="form-field">
              <label htmlFor="login-email" className="form-lbl">
                Email address
              </label>
              <div className="input-icon-wrap">
                <i className="bi bi-envelope input-icon" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  className={`form-input${errors.email ? ' input-error' : ''}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-describedby={errors.email ? 'login-email-err' : undefined}
                  aria-invalid={!!errors.email}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p id="login-email-err" role="alert" className="field-error">
                  <i className="bi bi-exclamation-circle me-1" aria-hidden="true" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="form-field">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label htmlFor="login-password" className="form-lbl mb-0">
                  Password
                </label>
                <Link href="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>
              <div className="input-icon-wrap">
                <i className="bi bi-lock input-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className={`form-input input-with-action${errors.password ? ' input-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  aria-describedby={errors.password ? 'login-pw-err' : undefined}
                  aria-invalid={!!errors.password}
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
              {errors.password && (
                <p id="login-pw-err" role="alert" className="field-error">
                  <i className="bi bi-exclamation-circle me-1" aria-hidden="true" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="remember-row">
              <label className="custom-checkbox" htmlFor="remember">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox-box" aria-hidden="true" />
                Keep me signed in
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Log In
                  <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </>
              )}
            </button>

          </form>

          {/* Social login */}
          <div className="social-divider"><span>or sign in with</span></div>
          <div className="social-btns">
            <button className="social-btn" aria-label="Sign in with Google">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
              </svg>
              Google
            </button>
            <button className="social-btn" aria-label="Sign in with Apple">
              <i className="bi bi-apple" style={{ fontSize: 18 }} aria-hidden="true" />
              Apple
            </button>
          </div>

          {/* Footer */}
          <p className="auth-card-footer">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="auth-link">Create one free</Link>
          </p>

        </div>

        {/* ─── Scoped Styles ─── */}
        <style jsx>{`
          /* Card */
          .auth-card {
            background: #fff;
            border-radius: 24px;
            box-shadow: var(--shadow-lg);
            padding: 44px 44px 36px;
            border: 1px solid var(--clr-border);
            animation: cardIn 0.45s cubic-bezier(0.4,0,0.2,1) both;
          }
          @keyframes cardIn {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          /* Card header */
          .auth-card-header { margin-bottom: 28px; }
          .auth-card-title {
            font-family: var(--font-display);
            font-size: 26px; font-weight: 800;
            color: var(--clr-text);
            margin: 0 0 6px;
            letter-spacing: -0.5px;
          }
          .auth-card-sub {
            font-size: 14px; color: var(--clr-muted); margin: 0; font-weight: 500;
          }

          /* Role group */
          .role-group { margin-bottom: 22px; }
          .role-group-label {
            font-size: 13px; font-weight: 700;
            color: var(--clr-muted);
            text-transform: uppercase; letter-spacing: 0.5px;
            margin-bottom: 10px;
          }
          .role-chips {
            display: flex; flex-wrap: wrap; gap: 8px;
          }
          .role-chip {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 8px 14px;
            border-radius: 100px;
            border: 1.5px solid var(--clr-border);
            background: #fff;
            font-family: var(--font-body);
            font-size: 13px; font-weight: 600;
            color: var(--clr-muted);
            cursor: pointer;
            transition: all var(--transition);
            white-space: nowrap;
          }
          .role-chip:hover {
            border-color: var(--clr-primary-light);
            color: var(--clr-primary);
            background: var(--clr-primary-xlight);
          }
          .role-chip.active {
            border-color: var(--clr-primary);
            background: var(--clr-primary);
            color: #fff;
            box-shadow: 0 4px 14px rgba(194,24,91,0.30);
          }

          /* Divider */
          .auth-divider {
            display: flex; align-items: center; gap: 12px;
            margin: 20px 0;
          }
          .auth-divider::before, .auth-divider::after {
            content: ''; flex: 1;
            height: 1px; background: var(--clr-border);
          }
          .auth-divider span {
            font-size: 12px; color: var(--clr-muted);
            font-weight: 600; white-space: nowrap;
          }

          /* Form fields */
          .form-field { margin-bottom: 18px; }
          .form-lbl {
            display: block;
            font-size: 13px; font-weight: 700;
            color: var(--clr-text);
            margin-bottom: 6px;
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
            padding: 12px 14px 12px 40px;
            border: 1.5px solid var(--clr-border);
            border-radius: 12px;
            font-family: var(--font-body);
            font-size: 14px; font-weight: 500;
            color: var(--clr-text);
            background: #fff;
            transition: border-color var(--transition), box-shadow var(--transition);
            outline: none;
          }
          .form-input:focus {
            border-color: var(--clr-primary);
            box-shadow: 0 0 0 3px rgba(194,24,91,0.12);
          }
          .form-input.input-error { border-color: #EF4444; }
          .form-input.input-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
          .form-input.input-with-action { padding-right: 44px; }
          .form-input:disabled { background: var(--clr-surface); cursor: not-allowed; opacity: 0.7; }

          .input-action-btn {
            position: absolute; right: 12px; top: 50%;
            transform: translateY(-50%);
            background: none; border: none; padding: 4px;
            color: var(--clr-muted); cursor: pointer;
            font-size: 16px; line-height: 1;
            border-radius: 6px;
            transition: color var(--transition);
          }
          .input-action-btn:hover { color: var(--clr-primary); }

          .field-error {
            display: flex; align-items: center;
            margin: 6px 0 0;
            font-size: 12px; font-weight: 600;
            color: #EF4444;
          }

          /* Remember row */
          .remember-row { margin-bottom: 20px; }
          .custom-checkbox {
            display: inline-flex; align-items: center; gap: 10px;
            font-size: 13px; font-weight: 600; color: var(--clr-text);
            cursor: pointer; user-select: none;
          }
          .custom-checkbox input[type="checkbox"] {
            position: absolute; opacity: 0; width: 0; height: 0;
          }
          .checkbox-box {
            width: 18px; height: 18px;
            border: 1.5px solid var(--clr-border);
            border-radius: 5px;
            background: #fff;
            display: flex; align-items: center; justify-content: center;
            transition: all var(--transition);
            flex-shrink: 0;
          }
          .custom-checkbox input:checked ~ .checkbox-box {
            background: var(--clr-primary);
            border-color: var(--clr-primary);
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
            outline: 3px solid rgba(194,24,91,0.25);
            outline-offset: 2px;
          }

          /* Forgot link */
          .forgot-link {
            font-size: 13px; font-weight: 600;
            color: var(--clr-primary);
            text-decoration: none;
            transition: opacity var(--transition);
          }
          .forgot-link:hover { opacity: 0.75; }

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
            margin-bottom: 4px;
          }
          .btn-submit:hover:not(:disabled) {
            background: var(--clr-primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(194,24,91,0.38);
          }
          .btn-submit:disabled {
            opacity: 0.7; cursor: not-allowed; transform: none;
          }
          .spinner {
            width: 16px; height: 16px;
            border: 2px solid rgba(255,255,255,0.35);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          /* Social login */
          .social-divider {
            display: flex; align-items: center; gap: 12px;
            margin: 22px 0 16px;
          }
          .social-divider::before, .social-divider::after {
            content: ''; flex: 1; height: 1px; background: var(--clr-border);
          }
          .social-divider span {
            font-size: 12px; color: var(--clr-muted); font-weight: 600;
          }
          .social-btns { display: flex; gap: 10px; margin-bottom: 24px; }
          .social-btn {
            flex: 1;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            padding: 11px;
            border: 1.5px solid var(--clr-border);
            border-radius: 11px;
            background: #fff;
            font-family: var(--font-body);
            font-size: 13px; font-weight: 700;
            color: var(--clr-text);
            cursor: pointer;
            transition: all var(--transition);
          }
          .social-btn:hover {
            border-color: var(--clr-primary-light);
            background: var(--clr-primary-xlight);
            color: var(--clr-primary);
          }

          /* Footer text */
          .auth-card-footer {
            text-align: center;
            font-size: 13px; color: var(--clr-muted); font-weight: 500;
            margin: 0;
          }
          .auth-link {
            color: var(--clr-primary); font-weight: 700; text-decoration: none;
          }
          .auth-link:hover { text-decoration: underline; }

          @media (max-width: 575px) {
            .auth-card { padding: 32px 24px 28px; border-radius: 20px; }
            .auth-card-title { font-size: 22px; }
            .role-chips { gap: 6px; }
            .role-chip { padding: 7px 11px; font-size: 12px; }
          }
        `}</style>

      </AuthLayout>
    </>
  );
}
