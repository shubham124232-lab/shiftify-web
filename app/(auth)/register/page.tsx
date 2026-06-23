'use client';
// /register: role -> details -> [OTP modal] -> plan (paid) -> payment (paid) -> profile wizard
// Everything on one page. No redirects between steps.

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { useForm, FormProvider, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import AuthLayout from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { useRegistrationStore } from '@/lib/store/registration.store';
import { useAuthStore } from '@/lib/store/auth.store';
import { api, setApiToken } from '@/lib/api';
import { UserRole, UserStatus } from '@/lib/types';
import { upsertProfile } from '@/lib/api/profile';
import { getStepsForRole } from '@/lib/registration';
import { STEP_COMPONENTS }  from '@/lib/registration/stepComponents';

const FREE_ROLES = new Set<UserRole>([UserRole.PARTICIPANT]);

const ROLE_CARDS = [
  { value: UserRole.PARTICIPANT,    label: 'Participant',    tagline: 'I need NDIS support services',         icon: 'bi-person-heart'        },
  { value: UserRole.SUPPORT_WORKER, label: 'Support Worker', tagline: 'I provide direct care & support',      icon: 'bi-hand-thumbs-up-fill' },
  { value: UserRole.PROVIDER,       label: 'Provider',       tagline: 'Organisation delivering NDIS services', icon: 'bi-building-fill-check' },
  { value: UserRole.COORDINATOR,    label: 'Coordinator',    tagline: 'I coordinate support for participants', icon: 'bi-diagram-3-fill'      },
  { value: UserRole.PLAN_MANAGER,   label: 'Plan Manager',   tagline: 'I manage NDIS funding & budgets',       icon: 'bi-calculator-fill'     },
];

function getStrength(pw: string): { level: 0|1|2|3; label: string; color: string } {
  if (!pw.length) return { level: 0, label: '', color: 'transparent' };
  const score = [pw.length>=8,/[A-Z]/.test(pw),/[0-9]/.test(pw),/[^A-Za-z0-9]/.test(pw),pw.length>=10].filter(Boolean).length;
  if (score <= 2) return { level: 1, label: 'Weak',   color: '#ef4444' };
  if (score <= 3) return { level: 2, label: 'Fair',   color: '#f59e0b' };
  return             { level: 3, label: 'Strong', color: '#22c55e' };
}

const inp: React.CSSProperties = { width:'100%',height:42,padding:'0 12px',borderRadius:'var(--btn-radius)',border:'1.5px solid var(--clr-border)',fontSize:14,outline:'none',background:'#fff',boxSizing:'border-box' };
const lbl: React.CSSProperties = { display:'block',fontSize:12,fontWeight:600,color:'var(--clr-text)',marginBottom:5 };

// WizardStep: keyed per step so useForm remounts with correct schema each time
interface WizardStepProps {
  role: UserRole; stepIndex: number; totalSteps: number;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
}
function WizardStep({ role, stepIndex, totalSteps, onSave, onBack }: WizardStepProps) {
  const store    = useRegistrationStore();
  const allSteps = getStepsForRole(role);
  const config   = allSteps[stepIndex];
  const StepComp = STEP_COMPONENTS[role]?.[stepIndex];
  const [saving, setSaving]     = useState(false);
  const [apiErr, setApiErr]     = useState<string|null>(null);
  const isFinal = config?.isFinal ?? stepIndex === totalSteps - 1;

  const form = useForm({
    resolver:      zodResolver(config.schema),
    defaultValues: store.formData as Record<string,unknown>,
    mode:          'onBlur',
  });

  const onSubmit = async (data: FieldValues) => {
    setSaving(true); setApiErr(null);
    try { await onSave(data as Record<string,unknown>); }
    catch (err) { setApiErr(err instanceof Error ? err.message : 'Failed to save. Please try again.'); setSaving(false); }
  };

  if (!config || !StepComp) return null;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:20}}>
          <div style={{width:40,height:40,borderRadius:10,background:'rgba(194,24,91,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <i className={`bi ${config.icon}`} style={{color:'var(--clr-primary)',fontSize:18}} />
          </div>
          <div>
            <h2 style={{margin:0,fontSize:17,fontWeight:800,fontFamily:'var(--font-display)',color:'var(--clr-text)',letterSpacing:-0.3}}>{config.title}</h2>
            <p style={{margin:'2px 0 0',fontSize:12,color:'var(--clr-muted)'}}>{config.description}</p>
          </div>
        </div>

        {apiErr && (
          <div style={{background:'#FFF0F0',border:'1px solid #FFCDD2',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#C62828'}}>
            <i className="bi bi-exclamation-circle" style={{marginRight:6}} />{apiErr}
          </div>
        )}

        <StepComp />

        <div style={{display:'flex',gap:10,marginTop:24}}>
          {stepIndex > 0 && (
            <button type="button" onClick={onBack}
              style={{height:42,padding:'0 18px',borderRadius:'var(--btn-radius)',border:'1.5px solid var(--clr-border)',background:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',color:'var(--clr-text)',display:'flex',alignItems:'center',gap:6}}>
              <i className="bi bi-arrow-left" />Back
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-shiftify"
            style={{flex:1,height:42,fontSize:14,fontWeight:700,opacity:saving?0.7:1,cursor:saving?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {saving && <span style={{width:15,height:15,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0}} />}
            {isFinal ? 'Complete Setup' : 'Save & Continue'}
          </button>
        </div>

        {/* All steps mandatory during registration — no skip */}
      </form>
    </FormProvider>
  );
}

type Phase = 'role'|'details'|'plan'|'payment'|'wizard';
interface ApiPlan {
  id: string; key?: string;
  name?: string; label?: string;       // backend sends `name`
  amountAud?: number|string;           // backend sends `amountAud`
  price?: number;                      // some adapters send `price`
  period?: string; features?: string[]; popular?: boolean;
}
function planPrice(p: ApiPlan): number { return Number(p.amountAud ?? p.price ?? 0); }
function planLabel(p: ApiPlan): string { return p.label ?? p.name ?? p.key ?? ''; }

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, loading: authLoading, error: authError, clearError, silentInit, activatePlan } = useAuth();
  const store = useRegistrationStore();

  const [phase,       setPhase]       = useState<Phase>('role');
  const [role,        setRole]        = useState<UserRole|null>(null);

  // OTP
  const [showOtp,    setShowOtp]    = useState(false);
  const [otpDigits,  setOtpDigits]  = useState(['','','','','','']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError,   setOtpError]   = useState<string|null>(null);
  const [otpResent,  setOtpResent]  = useState(false);
  const [devCode,    setDevCode]    = useState<string|null>(null);
  const otpRefs = useRef<(HTMLInputElement|null)[]>([]);

  // Details
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [showCf,     setShowCf]     = useState(false);
  const [username,       setUsername]       = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle');
  const usernameTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const [localError, setLocalError] = useState<string|null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const strength = getStrength(password);

  // Plan
  const [plans,        setPlans]        = useState<ApiPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError,   setPlansError]   = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string|null>(null);

  // Register submit
  const [submitting, setSubmitting] = useState(false);

  // Payment
  const [payLoading, setPayLoading] = useState(false);
  const [payError,   setPayError]   = useState<string|null>(null);

  // Wizard
  const [wizardStep, setWizardStep] = useState(0);
  const profileSteps = role ? getStepsForRole(role) : [];

  function fetchPlans() {
    if (!role) return;
    setPlansLoading(true);
    setPlansError(false);
    api.get<{ plans: ApiPlan[] }>(`/subscriptions/plans?role=${role}`)
      .then(res => setPlans(res.plans ?? []))
      .catch(() => { setPlansError(true); setPlans([]); })
      .finally(() => setPlansLoading(false));
  }

  useEffect(() => {
    if (phase !== 'plan' || !role) return;
    fetchPlans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, role]);

  // Progress
  // New order: role(0) → details(1) → wizard(2..N) → plan(N+1, paid) → payment(N+2, paid)
  const needsPlan    = role ? !FREE_ROLES.has(role) : false;
  const wizardOffset = 2; // role + details come first
  const totalSteps   = wizardOffset + profileSteps.length + (needsPlan ? 2 : 0);
  const currentIndex =
    phase === 'role'    ? 0 :
    phase === 'details' ? 1 :
    phase === 'wizard'  ? wizardOffset + wizardStep :
    phase === 'plan'    ? wizardOffset + profileSteps.length :
                          wizardOffset + profileSteps.length + 1; // payment
  const progressPct  = totalSteps > 1 ? Math.round((currentIndex / (totalSteps - 1)) * 100) : 100;
  const displayError = localError ?? authError;

  function handleRoleNext() {
    if (!role) return;
    clearError(); setLocalError(null); setPhase('details');
  }

  function handleUsernameBlur() {
    const val = username.trim();
    if (!val || val.length < 3) return;
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const res = await api.get<{ available: boolean }>(`/auth/check-username?username=${encodeURIComponent(val)}`);
        setUsernameStatus(res.available ? 'available' : 'taken');
      } catch { setUsernameStatus('idle'); }
    }, 3000);
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setLocalError(null); clearError(); setFieldErrors({});

    // ── Client-side field validation ─────────────────────────────────────────
    const errs: Record<string,string> = {};
    if (!firstName.trim())    errs.firstName = 'First name is required.';
    if (!lastName.trim())     errs.lastName  = 'Last name is required.';
    if (!username.trim())     errs.username  = 'Username is required.';
    else if (username.trim().length < 3) errs.username = 'Username must be at least 3 characters.';
    else if (usernameStatus === 'taken') errs.username = 'That username is already taken. Please choose another.';

    const cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (!cleanPhone) {
      errs.phone = 'Phone number is required.';
    } else if (!/^(\+?61[2-9]\d{8}|0[2-9]\d{8})$/.test(cleanPhone)) {
      errs.phone = 'Please enter a valid Australian phone number (e.g. 0412 345 678).';
    }

    if (!password)            errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (password && password !== confirm) errs.confirm = 'Passwords do not match.';

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await registerUser({ role: role!, name: `${firstName.trim()} ${lastName.trim()}`, password, email: email||undefined, phone: phone.trim(), username: username.trim() });
      if (res._dev_code) {
        setDevCode(res._dev_code);
        sessionStorage.setItem('shiftify_dev_otp', res._dev_code);
      }
      setShowOtp(true);
    } catch (err) {
      // If backend returned field-level details, map them to inline errors
      if (err instanceof Error && 'details' in err && Array.isArray((err as any).details)) {
        const backendErrs: Record<string,string> = {};
        ((err as any).details as { path: string; message: string }[]).forEach(d => {
          if (d.path) backendErrs[d.path] = d.message;
        });
        if (Object.keys(backendErrs).length > 0) setFieldErrors(backendErrs);
      }
      // authError banner is already set by the store
    }
    finally { setSubmitting(false); }
  }

  function handleOtpDigit(idx: number, val: string) {
    const d = val.replace(/\D/g,'').slice(-1);
    const next = [...otpDigits]; next[idx] = d; setOtpDigits(next);
    if (d && idx < 5) otpRefs.current[idx+1]?.focus();
  }
  function handleOtpKey(idx: number, e: React.KeyboardEvent) {
    if (e.key==='Backspace' && !otpDigits[idx] && idx>0) otpRefs.current[idx-1]?.focus();
  }
  function handleOtpPaste(e: React.ClipboardEvent) {
    const digits = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (digits.length===6) { setOtpDigits(digits.split('')); otpRefs.current[5]?.focus(); }
  }

  async function handleOtpVerify() {
    const code = otpDigits.join('');
    if (code.length < 6) { setOtpError('Enter all 6 digits.'); return; }
    setOtpError(null); setOtpLoading(true);
    try {
      await api.post('/auth/verify/confirm', { channel:'phone', code });
      // Mark phone verified in store immediately — silentInit() returns early when
      // accessToken is already set, so we update the flag directly.
      useAuthStore.setState({ phoneVerified: true });
      // Activate free roles immediately after OTP; paid roles activate after payment
      if (FREE_ROLES.has(role!)) {
        await api.post('/subscriptions/activate', {});
        const current = useAuthStore.getState().user;
        if (current) useAuthStore.setState({ user: { ...current, status: UserStatus.ACTIVE } });
      }
      setShowOtp(false);
      // All roles go through wizard first, then plan/payment for paid roles
      store.setRole(role!, STEP_COMPONENTS[role!].length);
      setPhase('wizard');
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally { setOtpLoading(false); }
  }

  async function handleOtpResend() {
    setOtpResent(false); setOtpError(null);
    try {
      const res = await api.post<{ _dev_code?: string }>('/auth/verify/resend', { channel:'phone' });
      setOtpResent(true);
      if (res._dev_code) {
        setDevCode(res._dev_code);
        sessionStorage.setItem('shiftify_dev_otp', res._dev_code);
      }
    }
    catch { setOtpError('Could not resend. Please try again.'); }
  }

  function handlePlanNext() {
    if (!selectedPlan) return;
    setPhase('payment');
  }

  async function handlePayment() {
    setPayError(null); setPayLoading(true);
    try {
      await api.post('/subscriptions/activate', { planId: selectedPlan });
      // Directly update store status to ACTIVE.
      // setApiToken(null)+silentInit() doesn't work here: silentInit returns early
      // when store.accessToken is already set, leaving status=PENDING and causing
      // the dashboard layout to redirect back to /setup/verify.
      const current = useAuthStore.getState().user;
      if (current) {
        useAuthStore.setState({ user: { ...current, status: UserStatus.ACTIVE } });
      }
      store.resetWizard(); // clear wizard draft
      router.replace('/dashboard'); // registration complete → go to dashboard
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally { setPayLoading(false); }
  }

  const handleWizardSave = useCallback(async (data: Record<string,unknown>) => {
    store.mergeFormData(data);
    // Convert date-only strings (YYYY-MM-DD) to ISO datetime for backend validation
    const DATE_FIELDS = ["dob", "visaExpiry"];
    const payload = { ...store.formData, ...data, profileStep: wizardStep+1 };
    for (const field of DATE_FIELDS) {
      const val = (payload as Record<string,unknown>)[field];
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        (payload as Record<string,unknown>)[field] = new Date(val + "T00:00:00.000Z").toISOString();
      }
    }
    await upsertProfile(role!, payload);
    store.markStepSaved(wizardStep);
    store.setLastSaved();
    const total = getStepsForRole(role!).length;
    if (wizardStep >= total-1) {
      store.resetWizard();
      // Free roles go straight to dashboard; paid roles select a plan next
      if (FREE_ROLES.has(role!)) router.replace('/dashboard');
      else setPhase('plan');
    } else {
      setWizardStep(s => s+1);
    }
  }, [role, wizardStep, store, router]);

  function handleWizardBack() {
    if (wizardStep > 0) { setWizardStep(s => s-1); return; }
    setPhase('details'); // back to details from first wizard step
  }

  function handleWizardSkip() {
    const total = getStepsForRole(role!).length;
    if (wizardStep >= total-1) { store.resetWizard(); router.replace('/dashboard'); }
    else setWizardStep(s => s+1);
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <AuthLayout mode="register">

      {phase !== 'role' && (
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontSize:12,fontWeight:600,color:'var(--clr-muted)'}}>Step {currentIndex+1} of {totalSteps}</span>
            <span style={{fontSize:11,color:'var(--clr-muted)'}}>
              {phase==='details' ? 'Account Details' : phase==='wizard' ? (profileSteps[wizardStep]?.title ?? 'Profile Setup') : phase==='plan' ? 'Choose Plan' : 'Payment'}
            </span>
          </div>
          <div style={{height:4,background:'var(--clr-border)',borderRadius:4}}>
            <div style={{height:'100%',width:`${progressPct}%`,background:'var(--clr-primary)',borderRadius:4,transition:'width 0.4s ease'}} />
          </div>
        </div>
      )}

      {/* ROLE */}
      {phase === 'role' && (
        <>
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:20}}>
            <div style={{width:28,height:10,borderRadius:5,background:'var(--clr-primary)'}} />
            <div style={{width:10,height:10,borderRadius:5,background:'var(--clr-border)'}} />
            <span style={{fontSize:12,color:'var(--clr-muted)',fontWeight:600,marginLeft:4}}>Step 1</span>
          </div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:800,color:'var(--clr-text)',letterSpacing:-0.5,marginBottom:4}}>Create your account</h1>
          <p style={{fontSize:14,color:'var(--clr-muted)',marginBottom:24}}>First, tell us how you&apos;ll use Shiftify</p>

          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {ROLE_CARDS.map(card => {
              const sel = role===card.value;
              return (
                <button key={card.value} type="button" onClick={() => setRole(card.value)}
                  style={{display:'flex',alignItems:'center',gap:14,width:'100%',padding:'14px 16px',borderRadius:'var(--card-radius)',border:sel?'2px solid var(--clr-primary)':'1.5px solid var(--clr-border)',background:sel?'rgba(194,24,91,0.04)':'#fff',cursor:'pointer',textAlign:'left',transition:'all 0.18s'}}>
                  <div style={{width:44,height:44,borderRadius:12,flexShrink:0,background:sel?'var(--clr-primary)':'var(--clr-surface)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:sel?'#fff':'var(--clr-primary)',transition:'all 0.18s'}}>
                    <i className={`bi ${card.icon}`} />
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--clr-text)'}}>{card.label}</div>
                    <div style={{fontSize:12,color:'var(--clr-muted)',marginTop:2}}>{card.tagline}</div>
                  </div>
                  <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,border:sel?'2px solid var(--clr-primary)':'2px solid var(--clr-border)',background:sel?'var(--clr-primary)':'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {sel && <i className="bi bi-check-lg" style={{color:'#fff',fontSize:11}} />}
                  </div>
                </button>
              );
            })}
          </div>

          <button type="button" disabled={!role} onClick={handleRoleNext} className="btn-shiftify"
            style={{width:'100%',height:46,fontSize:15,fontWeight:700,marginTop:20,opacity:role?1:0.5,cursor:role?'pointer':'not-allowed'}}>
            Continue
          </button>
          <p style={{textAlign:'center',fontSize:13,color:'var(--clr-muted)',marginTop:20}}>
            Already have an account?{' '}
            <Link href="/login" style={{color:'var(--clr-primary)',fontWeight:700,textDecoration:'none'}}>Log in</Link>
          </p>
        </>
      )}

      {/* DETAILS */}
      {phase === 'details' && (
        <>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
            <button type="button" onClick={() => { setPhase('role'); clearError(); setLocalError(null); }}
              style={{background:'none',border:'none',cursor:'pointer',color:'var(--clr-primary)',padding:0}}>
              <i className="bi bi-arrow-left" style={{fontSize:18}} />
            </button>
            <div>
              <h1 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,color:'var(--clr-text)',margin:0,letterSpacing:-0.3}}>
                {ROLE_CARDS.find(r => r.value===role)?.label} Account
              </h1>
              <p style={{fontSize:13,color:'var(--clr-muted)',margin:0}}>Fill in your details to get started</p>
            </div>
          </div>

          <form onSubmit={handleRegister} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={lbl}>First Name</label>
                <input type="text" value={firstName} onChange={e=>{setFirstName(e.target.value);setFieldErrors(p=>({...p,firstName:''}));}} placeholder="Jane" style={{...inp,borderColor:fieldErrors.firstName?'#ef4444':undefined}} autoComplete="given-name" />
                {fieldErrors.firstName && <p style={{fontSize:11,color:'#ef4444',marginTop:3}}>{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label style={lbl}>Last Name</label>
                <input type="text" value={lastName} onChange={e=>{setLastName(e.target.value);setFieldErrors(p=>({...p,lastName:''}));}} placeholder="Smith" style={{...inp,borderColor:fieldErrors.lastName?'#ef4444':undefined}} autoComplete="family-name" />
                {fieldErrors.lastName && <p style={{fontSize:11,color:'#ef4444',marginTop:3}}>{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div>
              <label style={lbl}>Username <span style={{color:'#ef4444'}}>*</span></label>
              <div style={{position:'relative'}}>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g,'')); setUsernameStatus('idle'); if (usernameTimer.current) clearTimeout(usernameTimer.current); }}
                  onBlur={handleUsernameBlur}
                  placeholder="e.g. jane.smith"
                  style={inp}
                  autoComplete="username"
                />
                {usernameStatus === 'checking' && <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#64748b'}}>Checking…</span>}
                {usernameStatus === 'available' && <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#16a34a',fontWeight:700}}>✓ Available</span>}
                {usernameStatus === 'taken'     && <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#dc2626',fontWeight:700}}>✗ Taken</span>}
              </div>
              <p style={{fontSize:11,color:'var(--clr-muted)',marginTop:3}}>Lowercase letters, numbers, dots and underscores only</p>
            </div>

            <div>
              <label style={lbl}>Phone Number <span style={{color:'#ef4444'}}>*</span></label>
              <input type="tel" value={phone} onChange={e=>{setPhone(e.target.value);setFieldErrors(p=>({...p,phone:''}));}} placeholder="+61 4xx xxx xxx" style={{...inp,borderColor:fieldErrors.phone?'#ef4444':undefined}} autoComplete="tel" />
              {fieldErrors.phone && <p style={{fontSize:11,color:'#ef4444',marginTop:3}}>{fieldErrors.phone}</p>}
            </div>

            <div>
              <label style={lbl}>Email <span style={{fontWeight:400,color:'var(--clr-muted)'}}>(optional)</span></label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={inp} autoComplete="email" />
            </div>

            <div>
              <label style={lbl}>Password</label>
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="Min. 8 characters" style={{...inp,paddingRight:42}} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(v=>!v)}
                  style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--clr-muted)',fontSize:16,padding:0}}>
                  <i className={`bi ${showPw?'bi-eye-slash':'bi-eye'}`} />
                </button>
              </div>
              {password.length > 0 && (
                <div style={{marginTop:6}}>
                  <div style={{display:'flex',gap:4,marginBottom:4}}>
                    {[1,2,3].map(l => <div key={l} style={{flex:1,height:3,borderRadius:4,background:strength.level>=l?strength.color:'var(--clr-border)',transition:'background 0.2s'}} />)}
                  </div>
                  <span style={{fontSize:11,color:strength.color,fontWeight:600}}>{strength.label}</span>
                </div>
              )}
              {fieldErrors.password && <p style={{fontSize:11,color:'#ef4444',marginTop:3}}>{fieldErrors.password}</p>}
            </div>

            <div>
              <label style={lbl}>Confirm Password</label>
              <div style={{position:'relative'}}>
                <input type={showCf?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)}
                  placeholder="Repeat password" style={{...inp,paddingRight:42}} autoComplete="new-password" />
                <button type="button" onClick={() => setShowCf(v=>!v)}
                  style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--clr-muted)',fontSize:16,padding:0}}>
                  <i className={`bi ${showCf?'bi-eye-slash':'bi-eye'}`} />
                </button>
              </div>
              {fieldErrors.confirm && <p style={{fontSize:11,color:'#ef4444',marginTop:3}}>{fieldErrors.confirm}</p>}
            </div>

            {displayError && (
              <div style={{background:'#FFF0F0',border:'1px solid #FFCDD2',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#C62828',fontWeight:500}}>
                {displayError}
              </div>
            )}

            <p style={{fontSize:11,color:'var(--clr-muted)',lineHeight:1.5,margin:0}}>
              By creating an account you agree to our{' '}
              <Link href="/terms" style={{color:'var(--clr-primary)',textDecoration:'none'}}>Terms</Link>{' '}and{' '}
              <Link href="/privacy" style={{color:'var(--clr-primary)',textDecoration:'none'}}>Privacy Policy</Link>.
            </p>

            <button type="submit" disabled={submitting} className="btn-shiftify"
              style={{width:'100%',height:46,fontSize:15,fontWeight:700,opacity:submitting?0.7:1,cursor:submitting?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {submitting && <span style={{width:15,height:15,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0}} />}
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </>
      )}

      {/* PLAN */}
      {phase === 'plan' && (
        <>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color:'var(--clr-text)',letterSpacing:-0.5,marginBottom:4}}>Choose your plan</h1>
          <p style={{fontSize:13,color:'var(--clr-muted)',marginBottom:24}}>All plans include a 14-day free trial. Cancel anytime.</p>

          {plansLoading && (
            <div style={{textAlign:'center',color:'var(--clr-muted)',padding:40,display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
              <div style={{width:18,height:18,border:'2px solid var(--clr-primary)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
              Loading plans...
            </div>
          )}

          {!plansLoading && plansError && (
            <div style={{textAlign:'center',padding:32,color:'var(--clr-muted)',fontSize:14}}>
              <i className="bi bi-exclamation-circle" style={{fontSize:32,color:'#f59e0b',display:'block',marginBottom:12}} />
              <p style={{marginBottom:16,fontWeight:600}}>Could not load plans.</p>
              <p style={{marginBottom:20,fontSize:13}}>Please check your connection and try again.</p>
              <button type="button" className="btn-shiftify" onClick={fetchPlans}
                style={{height:44,padding:'0 28px',fontSize:14,fontWeight:700}}>
                Retry
              </button>
            </div>
          )}

          {!plansLoading && !plansError && plans.length === 0 && (
            <div style={{textAlign:'center',padding:32,color:'var(--clr-muted)',fontSize:14}}>
              <i className="bi bi-info-circle" style={{fontSize:32,color:'#94a3b8',display:'block',marginBottom:12}} />
              <p style={{marginBottom:8,fontWeight:600}}>No plans available.</p>
              <p style={{fontSize:13}}>Contact support if this persists.</p>
            </div>
          )}

          {!plansLoading && plans.length > 0 && (
            <>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {plans.map(plan => {
                  const sel = selectedPlan===plan.id;
                  return (
                    <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)}
                      style={{display:'flex',alignItems:'center',gap:14,width:'100%',padding:16,borderRadius:'var(--card-radius)',border:sel?'2px solid var(--clr-primary)':'1.5px solid var(--clr-border)',background:sel?'rgba(194,24,91,0.04)':'#fff',cursor:'pointer',textAlign:'left',transition:'all 0.18s',position:'relative',overflow:'hidden'}}>
                      {plan.popular && (
                        <div style={{position:'absolute',top:10,right:12,background:'var(--clr-primary)',color:'#fff',fontSize:9,fontWeight:800,borderRadius:100,padding:'2px 8px',textTransform:'uppercase',letterSpacing:0.5}}>Popular</div>
                      )}
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--clr-text)',marginBottom:2}}>{planLabel(plan)}</div>
                        <div style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color:sel?'var(--clr-primary)':'var(--clr-text)',lineHeight:1}}>
                          ${planPrice(plan).toFixed(2)}<span style={{fontSize:12,fontWeight:500,color:'var(--clr-muted)'}}>{plan.period ?? '/mo'}</span>
                        </div>
                        {(plan.features?.length ?? 0) > 0 && (
                          <div style={{fontSize:11,color:'var(--clr-muted)',marginTop:4}}>{plan.features?.slice(0,2).join(' · ')}</div>
                        )}
                      </div>
                      <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,border:sel?'2px solid var(--clr-primary)':'2px solid var(--clr-border)',background:sel?'var(--clr-primary)':'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {sel && <i className="bi bi-check-lg" style={{color:'#fff',fontSize:11}} />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button type="button" disabled={!selectedPlan} onClick={handlePlanNext} className="btn-shiftify"
                style={{width:'100%',height:46,fontSize:15,fontWeight:700,marginTop:20,opacity:selectedPlan?1:0.5,cursor:selectedPlan?'pointer':'not-allowed'}}>
                Continue to Payment
              </button>
            </>
          )}
        </>
      )}

      {/* PAYMENT */}
      {phase === 'payment' && (
        <>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
            <button type="button" onClick={() => setPhase('plan')}
              style={{background:'none',border:'none',cursor:'pointer',color:'var(--clr-primary)',padding:0}}>
              <i className="bi bi-arrow-left" style={{fontSize:18}} />
            </button>
            <div>
              <h1 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,color:'var(--clr-text)',margin:0,letterSpacing:-0.3}}>Payment Details</h1>
              {selectedPlanData && (
                <p style={{fontSize:13,color:'var(--clr-muted)',margin:0}}>
                  {planLabel(selectedPlanData)} &mdash; ${planPrice(selectedPlanData).toFixed(2)}{selectedPlanData.period ?? '/mo'}
                </p>
              )}
            </div>
          </div>

          {/* Plan summary */}
          {selectedPlanData && (
            <div style={{background:'var(--clr-surface)',borderRadius:12,padding:'16px 20px',marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--clr-text)'}}>{planLabel(selectedPlanData)}</div>
                  <div style={{fontSize:12,color:'var(--clr-muted)',marginTop:2}}>Billed monthly — cancel anytime</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,color:'var(--clr-primary)'}}>
                    ${planPrice(selectedPlanData).toFixed(2)}
                  </div>
                  <div style={{fontSize:11,color:'var(--clr-muted)'}}>{selectedPlanData.period ?? '/mo'}</div>
                </div>
              </div>
            </div>
          )}

          {payError && (
            <div style={{background:'#FFF0F0',border:'1px solid #FFCDD2',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#C62828',marginBottom:14}}>{payError}</div>
          )}

          <button type="button" disabled={payLoading} onClick={handlePayment} className="btn-shiftify"
            style={{width:'100%',height:46,fontSize:15,fontWeight:700,opacity:payLoading?0.7:1,cursor:payLoading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {payLoading && <span style={{width:15,height:15,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0}} />}
            {payLoading ? 'Activating…' : selectedPlanData ? `Activate ${planLabel(selectedPlanData)}` : 'Activate Plan'}
          </button>
        </>
      )}

      {/* WIZARD */}
      {phase === 'wizard' && role && profileSteps.length > 0 && (
        <>
          <WizardStep
            key={wizardStep}
            role={role}
            stepIndex={wizardStep}
            totalSteps={profileSteps.length}
            onSave={handleWizardSave}
            onBack={handleWizardBack}
          />
        </>
      )}

      {/* OTP MODAL */}
      {showOtp && (
        <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',padding:20}}>
          <div style={{background:'#fff',borderRadius:20,padding:'36px 32px',width:'100%',maxWidth:400,boxShadow:'0 24px 64px rgba(0,0,0,0.25)'}}>

            <div style={{width:56,height:56,borderRadius:16,background:'rgba(194,24,91,0.08)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
              <i className="bi bi-phone-fill" style={{color:'var(--clr-primary)',fontSize:24}} />
            </div>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:800,color:'var(--clr-text)',textAlign:'center',marginBottom:6}}>Verify your phone</h2>
            <p style={{fontSize:13,color:'var(--clr-muted)',textAlign:'center',marginBottom:24,lineHeight:1.5}}>
              We sent a 6-digit code to <strong>{phone}</strong>
            </p>

            {devCode && (
              <div style={{background:'#E8F5E9',border:'1px solid #A5D6A7',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#2E7D32',marginBottom:20,textAlign:'center'}}>
                <span style={{fontWeight:700}}>Dev OTP: </span>
                <span style={{fontFamily:'monospace',fontWeight:700,letterSpacing:3}}>{devCode}</span>
              </div>
            )}

            <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:20}} onPaste={handleOtpPaste}>
              {otpDigits.map((d,i) => (
                <input key={i} ref={el => { otpRefs.current[i]=el; }} type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e=>handleOtpDigit(i,e.target.value)} onKeyDown={e=>handleOtpKey(i,e)}
                  style={{width:46,height:54,textAlign:'center',fontSize:22,fontWeight:700,fontFamily:'monospace',borderRadius:10,border:d?'2px solid var(--clr-primary)':'1.5px solid var(--clr-border)',outline:'none',background:'#fff',color:'var(--clr-text)',transition:'border 0.15s'}} />
              ))}
            </div>

            {otpError && (
              <div style={{background:'#FFF0F0',border:'1px solid #FFCDD2',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#C62828',marginBottom:16,textAlign:'center'}}>{otpError}</div>
            )}
            {otpResent && (
              <div style={{background:'#E8F5E9',border:'1px solid #A5D6A7',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#2E7D32',marginBottom:16,textAlign:'center'}}>Code resent &mdash; check your phone.</div>
            )}

            <button type="button" disabled={otpLoading||otpDigits.join('').length<6} onClick={handleOtpVerify}
              className="btn-shiftify"
              style={{width:'100%',height:46,fontSize:15,fontWeight:700,opacity:(otpLoading||otpDigits.join('').length<6)?0.55:1,cursor:(otpLoading||otpDigits.join('').length<6)?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {otpLoading && <span style={{width:15,height:15,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0}} />}
              {otpLoading ? 'Verifying...' : 'Verify Phone'}
            </button>
            <div style={{textAlign:'center',marginTop:16,fontSize:13,color:'var(--clr-muted)'}}>
              Didn&apos;t receive it?{' '}
              <button type="button" onClick={handleOtpResend}
                style={{background:"none",border:"none",cursor:"pointer",color:"var(--clr-primary)",fontWeight:700,fontSize:13,padding:0}}>
                Resend code
              </button>
            </div>
          </div>
        </div>
      )}

    </AuthLayout>
  );
}
