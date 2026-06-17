"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { presignUpload, putFileToR2 } from "@/lib/api/profile";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/constants/categories";

// ─── helpers ──────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 10px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "#374151", marginBottom: 4,
};
const row: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

function Textarea({ value, onChange, rows = 3, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      style={{ ...inp, height: "auto", padding: "8px 10px", resize: "vertical" }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, activeRole, silentInit, updateProfile } = useAuth();

  // ── Basic contact fields ──────────────────────────────────────────────────
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");
  const [username,      setUsername]      = useState<string | null>(null);
  // Participant extra fields (needed for 100% completion)
  const [preferredName,  setPreferredName]  = useState("");
  const [primaryDisability, setPrimaryDisability] = useState("");
  const [fundingType,    setFundingType]    = useState<string>("");
  const [emergencyName,  setEmergencyName]  = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRel,   setEmergencyRel]   = useState("");

  // ── Role-specific fields ──────────────────────────────────────────────────
  const [bio,            setBio]            = useState("");
  const [businessName,   setBusinessName]   = useState("");
  const [abn,            setAbn]            = useState("");
  const [ndisRegistered, setNdisRegistered] = useState(false);
  const [ndisNumber,     setNdisNumber]     = useState("");
  const [acceptingClients, setAcceptingClients] = useState(true);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const [avatarUrl,      setAvatarUrl]      = useState<string | null>(null);
  const [uploading,      setUploading]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Phone verification state ──────────────────────────────────────────────
  const [phoneVerified,  setPhoneVerified]  = useState(false);
  const [verifyStep,     setVerifyStep]     = useState<"idle" | "sent" | "done">("idle");
  const [otpCode,        setOtpCode]        = useState("");
  const [otpSending,     setOtpSending]     = useState(false);
  const [otpConfirming,  setOtpConfirming]  = useState(false);
  const [otpError,       setOtpError]       = useState<string | null>(null);
  const [otpDevCode,     setOtpDevCode]     = useState<string | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving,     setSaving]     = useState(false);
  const [pageLoading,setPageLoading] = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);
  const [profile,    setProfile]    = useState<any>(null);
  const [completion, setCompletion] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail((user as any).email ?? "");
    setPhone((user as any).phone ?? "");
    setAvatarUrl((user as any).avatarUrl ?? null);
    setPhoneVerified(!!(user as any).phoneVerified);

    // Load full user (includes embedded role profile)
    api.get<{ user: any; profileCompletion: number }>("/users/me")
      .then(res => {
        const u = res.user;
        if (
          u.name !== user.name ||
          u.email !== user.email ||
          u.phone !== user.phone ||
          u.avatarUrl !== (user as any).avatarUrl ||
          u.status !== user.status
        ) {
          updateProfile(u);
        }
        setName(u.name ?? "");
        setEmail(u.email ?? "");
        setPhone(u.phone ?? "");
        setAvatarUrl(u.avatarUrl ?? null);
        setCompletion(res.profileCompletion ?? 0);
        setPhoneVerified(!!u.phoneVerified);
        // Pick profile for the current active role only (multi-role users have multiple profiles)
        const profileByRole: Record<string, any> = {
          SUPPORT_WORKER: u.workerProfile,
          PROVIDER:       u.providerProfile,
          COORDINATOR:    u.coordinatorProfile,
          PLAN_MANAGER:   u.planManagerProfile,
          PARTICIPANT:    u.participantProfile,
        };
        const p = profileByRole[activeRole ?? ""] ?? {};
        setProfile(p);
        setBio(p.bio ?? "");
        // Coordinator stores org name under organisationName; others use businessName
        setBusinessName(p.businessName ?? p.organisationName ?? "");
        setAbn(p.abn ?? "");
        setNdisRegistered(p.ndisRegistered ?? false);
        setNdisNumber(p.ndisNumber ?? "");
        // Suburb lives on base user for all roles
        setSuburb((u as any).defaultSuburb ?? "");
        setUsername((u as any).username ?? null);
        setAcceptingClients(p.acceptingClients ?? true);
        // Participant extra fields
        setPreferredName(p.preferredName ?? "");
        setPrimaryDisability(p.primaryDisability ?? "");
        setFundingType(p.fundingManagementType ?? "");
        setEmergencyName(p.emergencyContactName ?? "");
        setEmergencyPhone(p.emergencyContactPhone ?? "");
        setEmergencyRel(p.emergencyContactRelationship ?? "");
        // Workers: servicesOffered  Providers: coreServices
        setServicesOffered(p.servicesOffered ?? p.coreServices ?? []);
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, [user, activeRole]);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const presign = await presignUpload("avatars", file.name, file.type);
      await putFileToR2(presign.uploadUrl, file);
      await api.patch("/users/me", { avatarUrl: presign.publicUrl });
      setAvatarUrl(presign.publicUrl);
      updateProfile({ avatarUrl: presign.publicUrl } as any);
    } catch {
      setError("Avatar upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    // Role → profile endpoint path
    const ROLE_PROFILE_PATH: Partial<Record<UserRole, string>> = {
      [UserRole.SUPPORT_WORKER]: "worker",
      [UserRole.PROVIDER]:       "provider",
      [UserRole.COORDINATOR]:    "coordinator",
      [UserRole.PLAN_MANAGER]:   "plan-manager",
      [UserRole.PARTICIPANT]:    "participant",
    };

    try {
      // Update base user — only send non-empty values
      const base = await api.patch<{ user: any }>("/users/me", {
        name:          name.trim()   || undefined,
        phone:         phone.trim()  || undefined,
        defaultSuburb: suburb.trim() || undefined,
      });
      updateProfile(base.user);

      // Update role profile
      const profilePayload: Record<string, any> = {};
      if (activeRole === UserRole.SUPPORT_WORKER) {
        // suburb goes via base user defaultSuburb (already in the PATCH above)
        profilePayload.bio             = bio || undefined;
        profilePayload.servicesOffered = servicesOffered;
      } else if (activeRole === UserRole.PROVIDER) {
        profilePayload.businessName   = businessName || undefined;
        profilePayload.abn            = abn || undefined;
        profilePayload.ndisRegistered = ndisRegistered;
        profilePayload.coreServices   = servicesOffered;
      } else if (activeRole === UserRole.COORDINATOR) {
        // coordinator schema uses organisationName, not businessName
        profilePayload.organisationName = businessName || undefined;
        profilePayload.abn              = abn || undefined;
        profilePayload.bio              = bio || undefined;
      } else if (activeRole === UserRole.PLAN_MANAGER) {
        profilePayload.businessName     = businessName || undefined;
        profilePayload.abn              = abn || undefined;
        profilePayload.acceptingClients = acceptingClients;
      } else if (activeRole === UserRole.PARTICIPANT) {
        profilePayload.ndisNumber                    = ndisNumber || undefined;
        profilePayload.preferredName                 = preferredName || undefined;
        profilePayload.primaryDisability             = primaryDisability || undefined;
        profilePayload.fundingManagementType         = fundingType || undefined;
        profilePayload.emergencyContactName          = emergencyName || undefined;
        profilePayload.emergencyContactPhone         = emergencyPhone || undefined;
        profilePayload.emergencyContactRelationship  = emergencyRel || undefined;
      }
      const rolePath = ROLE_PROFILE_PATH[activeRole as UserRole];
      if (rolePath && Object.keys(profilePayload).length > 0) {
        await api.post(`/users/me/profile/${rolePath}`, profilePayload);
      }

      setSuccess(true);
      silentInit(); // background — store already updated from PATCH response
    } catch (err: any) {
      setError(err?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function toggleService(val: string) {
    setServicesOffered(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  // ── Phone OTP handlers ────────────────────────────────────────────────────
  async function handleSendOtp() {
    if (!phone.trim()) { setOtpError("Please enter a phone number first."); return; }
    setOtpSending(true); setOtpError(null);
    try {
      // Save phone to user first so backend can send OTP to it
      await api.patch("/users/me", { phone: phone.trim() });
      const res = await api.post<{ _dev_code?: string }>("/auth/verify/request", { channel: "phone" });
      setVerifyStep("sent");
      if (res._dev_code) setOtpDevCode(res._dev_code);
    } catch (err: any) { setOtpError(err?.message ?? "Failed to send code."); }
    finally { setOtpSending(false); }
  }

  async function handleConfirmOtp() {
    if (!otpCode.trim()) return;
    setOtpConfirming(true); setOtpError(null);
    try {
      await api.post("/auth/verify/confirm", { channel: "phone", code: otpCode.trim() });
      setPhoneVerified(true);
      setVerifyStep("done");
      setOtpCode("");
      silentInit(); // background
    } catch (err: any) { setOtpError(err?.message ?? "Incorrect code."); }
    finally { setOtpConfirming(false); }
  }

  if (!user) return null;

  const initials = (name || user.name || "User").split(" ").filter(Boolean).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  if (pageLoading) {
    return (
      <>
        <PageHeader title="My Profile" description="Update your contact details and role information." />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
              <div style={{ height: 16, width: "30%", background: "#f3f4f6", borderRadius: 6, marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }} />
              {[1,2].map(j => (
                <div key={j} style={{ marginBottom: 14 }}>
                  <div style={{ height: 10, width: "20%", background: "#f3f4f6", borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 40, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My Profile" description="Update your contact details and role information." />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Profile completion bar */}
          {completion > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1.5px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Profile completion</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: completion >= 80 ? "#16a34a" : "#f59e0b" }}>{completion}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: "#e2e8f0" }}>
                <div style={{ height: 6, borderRadius: 6, width: `${completion}%`, background: completion >= 80 ? "#16a34a" : "#f59e0b", transition: "width 0.3s" }} />
              </div>
            </div>
          )}

          {/* Avatar */}
          <Card>
            <CardHeader><CardTitle>Photo</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 80, height: 80, borderRadius: "50%", cursor: "pointer",
                    background: avatarUrl ? "transparent" : "var(--clr-primary, #c2185b)",
                    border: "3px solid #e2e8f0", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, fontWeight: 700, color: "#fff",
                  }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials}
                </div>
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? "Uploading..." : "Change photo"}
                  </Button>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>JPG or PNG, max 5 MB</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader><CardTitle>Contact details</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Full name">
                <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
              </Field>
              {(username !== null) && (
                <Field label="Username">
                  <div style={{ ...inp, display: 'flex', alignItems: 'center', background: '#f9fafb', color: '#374151', cursor: 'default', userSelect: 'all' as const }}>
                    {username || '—'}
                  </div>
                </Field>
              )}
              <div style={row}>
                <Field label="Email">
                  <div style={{ ...inp, display: 'flex', alignItems: 'center', background: '#f9fafb', color: '#374151', cursor: 'default', userSelect: 'all' as const }}>
                    {email || '—'}
                  </div>
                </Field>
                <div>
                  <label style={lbl}>Phone</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input style={{ ...inp, flex: 1 }} type="tel" value={phone} onChange={e => { setPhone(e.target.value); setVerifyStep("idle"); }} placeholder="+61 4xx xxx xxx" />
                    {phoneVerified ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", whiteSpace: "nowrap" }}>✓ Verified</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpSending || verifyStep === "sent"}
                        style={{ height: 40, padding: "0 14px", background: "#c2185b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", opacity: otpSending ? 0.7 : 1 }}
                      >
                        {otpSending ? "Sending…" : verifyStep === "sent" ? "Code sent" : "Verify phone"}
                      </button>
                    )}
                  </div>
                  {verifyStep === "sent" && !phoneVerified && otpDevCode && (
                    <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#2E7D32', marginTop: 8 }}>
                      <span style={{ fontWeight: 700 }}>Dev OTP: </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}>{otpDevCode}</span>
                    </div>
                  )}
                  {verifyStep === "sent" && !phoneVerified && (
                    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        style={{ ...inp, width: 140 }}
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        placeholder="6-digit code"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleConfirmOtp}
                        disabled={otpConfirming || otpCode.length < 6}
                        style={{ height: 40, padding: "0 14px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: otpConfirming ? 0.7 : 1 }}
                      >
                        {otpConfirming ? "Verifying…" : "Confirm"}
                      </button>
                      <button type="button" onClick={handleSendOtp} style={{ fontSize: 12, color: "#c2185b", background: "none", border: "none", cursor: "pointer" }}>
                        Resend
                      </button>
                    </div>
                  )}
                  {otpError && <p style={{ fontSize: 12, color: "#C62828", marginTop: 6 }}>{otpError}</p>}
                  {!phoneVerified && verifyStep !== "sent" && (
                    <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 6 }}>⚠ Phone not verified — required to post support requests.</p>
                  )}
                </div>
              </div>
              <Field label="Default suburb">
                <input style={inp} value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="e.g. Parramatta" />
              </Field>
            </CardContent>
          </Card>

          {/* Role-specific fields */}
          {(activeRole === UserRole.SUPPORT_WORKER || activeRole === UserRole.COORDINATOR) && (
            <Card>
              <CardHeader><CardTitle>About you</CardTitle></CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Bio">
                  <Textarea value={bio} onChange={setBio} placeholder="Tell participants about your experience..." />
                </Field>
              </CardContent>
            </Card>
          )}

          {activeRole === UserRole.PARTICIPANT && (
            <>
              <Card>
                <CardHeader><CardTitle>NDIS details</CardTitle></CardHeader>
                <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="NDIS number">
                    <input style={inp} value={ndisNumber} onChange={e => setNdisNumber(e.target.value)} placeholder="43 000 000 00" />
                  </Field>
                  <Field label="Preferred name">
                    <input style={inp} value={preferredName} onChange={e => setPreferredName(e.target.value)} placeholder="e.g. Alex" />
                  </Field>
                  <Field label="Primary disability">
                    <input style={inp} value={primaryDisability} onChange={e => setPrimaryDisability(e.target.value)} placeholder="e.g. Autism Spectrum Disorder" />
                  </Field>
                  <Field label="Funding management type">
                    <select style={inp} value={fundingType} onChange={e => setFundingType(e.target.value)}>
                      <option value="">Select…</option>
                      <option value="SELF">Self-managed</option>
                      <option value="PLAN">Plan-managed</option>
                      <option value="NDIA">NDIA-managed</option>
                    </select>
                  </Field>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Emergency contact</CardTitle></CardHeader>
                <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Contact name">
                    <input style={inp} value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="e.g. Jane Smith" />
                  </Field>
                  <div style={row}>
                    <Field label="Contact phone">
                      <input style={inp} value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="+61 4xx xxx xxx" />
                    </Field>
                    <Field label="Relationship">
                      <input style={inp} value={emergencyRel} onChange={e => setEmergencyRel(e.target.value)} placeholder="e.g. Parent, Carer" />
                    </Field>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {(activeRole === UserRole.SUPPORT_WORKER || activeRole === UserRole.PROVIDER) && (
            <Card>
              <CardHeader><CardTitle>Services offered</CardTitle></CardHeader>
              <CardContent>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {JOB_CATEGORIES.map(cat => {
                    const selected = servicesOffered.includes(cat.value);
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => toggleService(cat.value)}
                        style={{
                          padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: selected ? "2px solid #c2185b" : "1.5px solid #e2e8f0",
                          background: selected ? "rgba(194,24,91,0.08)" : "#fff",
                          color: selected ? "#c2185b" : "#64748b",
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {(activeRole === UserRole.PROVIDER || activeRole === UserRole.COORDINATOR || activeRole === UserRole.PLAN_MANAGER) && (
            <Card>
              <CardHeader><CardTitle>Business details</CardTitle></CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label={activeRole === UserRole.COORDINATOR ? "Organisation name" : "Business name"}>
                  <input style={inp} value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder={activeRole === UserRole.COORDINATOR ? "e.g. Sunrise Coordination" : "Sunrise Care Pty Ltd"} />
                </Field>
                <Field label="ABN">
                  <input style={inp} value={abn} onChange={e => setAbn(e.target.value)} placeholder="12 345 678 901" />
                </Field>
                {activeRole === UserRole.PROVIDER && (
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
                    <input type="checkbox" checked={ndisRegistered} onChange={e => setNdisRegistered(e.target.checked)} />
                    NDIS registered provider
                  </label>
                )}
                {activeRole === UserRole.PLAN_MANAGER && (
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
                    <input type="checkbox" checked={acceptingClients} onChange={e => setAcceptingClients(e.target.checked)} />
                    Currently accepting new clients
                  </label>
                )}
              </CardContent>
            </Card>
          )}

            {/* Edit full profile link */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <a href="/profile/edit" style={{ fontSize: 13, color: "var(--clr-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                Edit full profile <i className="bi bi-arrow-right" />
              </a>
            </div>

            {/* Save button */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-start" }}>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </Button>
              {success && (
                <span style={{ fontSize: 13, color: "#16a34a", display: "flex", alignItems: "center", gap: 6 }}>
                  <i className="bi bi-check-circle-fill" /> Saved successfully
                </span>
              )}
              {error && (
                <span style={{ fontSize: 13, color: "#dc2626" }}>{error}</span>
              )}
            </div>
          </form>
        </div>
      </>
  );
}
