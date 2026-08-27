"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store/auth.store";
import { api } from "@/lib/api";
import { presignUpload, putFileToR2 } from "@/lib/api/profile";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { inp as twInp, lbl as twLbl } from "@/components/jobs/post/shared";

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

function TagToggleGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const selected = value.includes(opt);
          return (
            <button key={opt} type="button"
              onClick={() => onChange(selected ? value.filter(v => v !== opt) : [...value, opt])}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                selected ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, activeRole, updateProfile } = useAuth();

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

  // Worker-only visibility controls (SW doc §2-3 Window 14)
  const [nameDisplayMode,   setNameDisplayMode]   = useState("FULL_NAME");
  const [rateDisplayMode,   setRateDisplayMode]   = useState("PUBLIC");
  const [contactPreference, setContactPreference] = useState("ALLOW_MESSAGES");

  // Worker-only introduction (Window 6), boundaries (Window 13), travel (Window 11),
  // rate breakdown / meet-and-greet (Window 12), document visibility (Window 9)
  const [introSummary,          setIntroSummary]          = useState("");
  const [experienceYearsBucket, setExperienceYearsBucket] = useState("");
  const [approachTags,          setApproachTags]          = useState<string[]>([]);
  const [interests,             setInterests]             = useState<string[]>([]);
  const [environmentExclusions, setEnvironmentExclusions] = useState("");
  const [taskExclusions,        setTaskExclusions]        = useState("");
  const [boundaryNotes,         setBoundaryNotes]         = useState("");
  const [travelMode,            setTravelMode]            = useState("");
  const [childRestraintAvailable,     setChildRestraintAvailable]     = useState(false);
  const [wheelchairAccessibleVehicle, setWheelchairAccessibleVehicle] = useState(false);
  const [weekdayRate,   setWeekdayRate]   = useState("");
  const [eveningRate,   setEveningRate]   = useState("");
  const [saturdayRate,  setSaturdayRate]  = useState("");
  const [sundayRate,    setSundayRate]    = useState("");
  const [sleepoverRate, setSleepoverRate] = useState("");
  const [meetAndGreetPreference,          setMeetAndGreetPreference]          = useState("OPTIONAL");
  const [documentsVisibleToParticipants,  setDocumentsVisibleToParticipants]  = useState(false);
  const [ageGroupsSupported,         setAgeGroupsSupported]         = useState<string[]>([]);
  const [settingsExperience,         setSettingsExperience]         = useState<string[]>([]);
  const [communicationSupportSkills, setCommunicationSupportSkills] = useState<string[]>([]);

  // Coordinator-only fields (SC-A05/A08 + capacity/availability)
  const [roleType,               setRoleType]               = useState("");
  const [organisationRole,       setOrganisationRole]       = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("");
  const [currentCapacityStatus,  setCurrentCapacityStatus]  = useState("");
  const [availabilityType,       setAvailabilityType]       = useState("");
  const [maxParticipantLoad,     setMaxParticipantLoad]     = useState("");
  const [orgInviteCode,          setOrgInviteCode]          = useState<string | null>(null);
  const [generatingCode,         setGeneratingCode]         = useState(false);

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
  const [completionMissing, setCompletionMissing] = useState<string[]>([]);

  useEffect(() => {
    // Guard lives inside the effect — fires on every mount and activeRole change,
    // not gated on the `user` object reference (which stays stable after login
    // and would prevent a fresh fetch after wizard completion).
    if (!user) return;
    setName(user.name ?? "");
    setEmail((user as any).email ?? "");
    setPhone((user as any).phone ?? "");
    setAvatarUrl((user as any).avatarUrl ?? null);
    setPhoneVerified(!!(user as any).phoneVerified);

    // Load full user (includes embedded role profile)
    api.get<{ user: any; profileCompletion: number; completionMissing: string[] }>("/users/me")
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
        setCompletionMissing(res.completionMissing ?? []);
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
        // Coordinator-only fields
        setRoleType(p.roleType ?? "");
        setOrganisationRole(p.organisationRole ?? "");
        setPreferredContactMethod(p.preferredContactMethod ?? "");
        setCurrentCapacityStatus(p.currentCapacityStatus ?? "");
        setAvailabilityType(p.availabilityType ?? "");
        setMaxParticipantLoad(p.maxParticipantLoad != null ? String(p.maxParticipantLoad) : "");
        setOrgInviteCode(p.orgInviteCode ?? null);
        setNameDisplayMode(p.nameDisplayMode ?? "FULL_NAME");
        setRateDisplayMode(p.rateDisplayMode ?? "PUBLIC");
        setContactPreference(p.contactPreference ?? "ALLOW_MESSAGES");
        setIntroSummary(p.introSummary ?? "");
        setExperienceYearsBucket(p.experienceYearsBucket ?? "");
        setApproachTags(p.approachTags ?? []);
        setInterests(p.interests ?? []);
        setEnvironmentExclusions((p.supportBoundaries?.environmentExclusions ?? []).join(", "));
        setTaskExclusions((p.supportBoundaries?.taskExclusions ?? []).join(", "));
        setBoundaryNotes(p.supportBoundaries?.notes ?? "");
        setTravelMode(p.travelMode ?? "");
        setChildRestraintAvailable(p.childRestraintAvailable ?? false);
        setWheelchairAccessibleVehicle(p.wheelchairAccessibleVehicle ?? false);
        setWeekdayRate(p.detailedRates?.weekdayRate != null ? String(p.detailedRates.weekdayRate) : "");
        setEveningRate(p.detailedRates?.eveningRate != null ? String(p.detailedRates.eveningRate) : "");
        setSaturdayRate(p.detailedRates?.saturdayRate != null ? String(p.detailedRates.saturdayRate) : "");
        setSundayRate(p.detailedRates?.sundayRate != null ? String(p.detailedRates.sundayRate) : "");
        setSleepoverRate(p.detailedRates?.sleepoverRate != null ? String(p.detailedRates.sleepoverRate) : "");
        setMeetAndGreetPreference(p.meetAndGreetPreference ?? "OPTIONAL");
        setDocumentsVisibleToParticipants(p.documentsVisibleToParticipants ?? false);
        setAgeGroupsSupported(p.ageGroupsSupported ?? []);
        setSettingsExperience(p.settingsExperience ?? []);
        setCommunicationSupportSkills(p.communicationSupportSkills ?? []);
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }, [activeRole]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Photo counts toward profile completion — keep the gate in sync,
      // same as the profile-save and document-save paths.
      useAuthStore.getState().refreshGateStatus();
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
        profilePayload.bio               = bio || undefined;
        profilePayload.servicesOffered   = servicesOffered;
        profilePayload.nameDisplayMode   = nameDisplayMode;
        profilePayload.rateDisplayMode   = rateDisplayMode;
        profilePayload.contactPreference = contactPreference;
        profilePayload.introSummary          = introSummary || undefined;
        profilePayload.experienceYearsBucket = experienceYearsBucket || undefined;
        profilePayload.approachTags          = approachTags;
        profilePayload.interests             = interests;
        profilePayload.supportBoundaries = {
          environmentExclusions: environmentExclusions.split(",").map(s => s.trim()).filter(Boolean),
          taskExclusions:        taskExclusions.split(",").map(s => s.trim()).filter(Boolean),
          notes:                 boundaryNotes || undefined,
        };
        profilePayload.travelMode                  = travelMode || undefined;
        profilePayload.childRestraintAvailable      = childRestraintAvailable;
        profilePayload.wheelchairAccessibleVehicle  = wheelchairAccessibleVehicle;
        profilePayload.detailedRates = {
          weekdayRate:   weekdayRate   ? Number(weekdayRate)   : undefined,
          eveningRate:   eveningRate   ? Number(eveningRate)   : undefined,
          saturdayRate:  saturdayRate  ? Number(saturdayRate)  : undefined,
          sundayRate:    sundayRate    ? Number(sundayRate)    : undefined,
          sleepoverRate: sleepoverRate ? Number(sleepoverRate) : undefined,
        };
        profilePayload.meetAndGreetPreference         = meetAndGreetPreference;
        profilePayload.documentsVisibleToParticipants = documentsVisibleToParticipants;
        profilePayload.ageGroupsSupported         = ageGroupsSupported;
        profilePayload.settingsExperience         = settingsExperience;
        profilePayload.communicationSupportSkills = communicationSupportSkills;
      } else if (activeRole === UserRole.PROVIDER) {
        profilePayload.businessName   = businessName || undefined;
        profilePayload.abn            = abn || undefined;
        profilePayload.ndisRegistered = ndisRegistered;
        profilePayload.coreServices   = servicesOffered;
      } else if (activeRole === UserRole.COORDINATOR) {
        // coordinator schema uses organisationName, not businessName
        profilePayload.organisationName       = businessName || undefined;
        profilePayload.abn                    = abn || undefined;
        profilePayload.bio                    = bio || undefined;
        profilePayload.organisationRole       = organisationRole || undefined;
        profilePayload.preferredContactMethod = preferredContactMethod || undefined;
        profilePayload.currentCapacityStatus  = currentCapacityStatus || undefined;
        profilePayload.availabilityType       = availabilityType || undefined;
        profilePayload.maxParticipantLoad     = maxParticipantLoad ? Number(maxParticipantLoad) : undefined;
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

      // Re-fetch profileCompletion/marketplaceMissing now that both saves are in —
      // otherwise AppLayout's gate keeps reading pre-save values and bounces the
      // user straight back here even though the profile is now complete. Also
      // updates this page's own completion bar (local state, not the auth store)
      // from the same response — no second /users/me round trip, and a failure
      // here (it never throws) can't mask an already-successful save.
      const gate = await useAuthStore.getState().refreshGateStatus();
      if (gate) {
        setCompletion(gate.profileCompletion ?? 0);
        setCompletionMissing(gate.completionMissing);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateInviteCode() {
    setGeneratingCode(true);
    try {
      const res = await api.post<{ profile: { orgInviteCode: string | null } }>("/users/me/profile/coordinator/invite-code", {});
      setOrgInviteCode(res.profile.orgInviteCode ?? null);
    } catch (err: any) { setError(err?.message ?? "Failed to generate invite code."); }
    finally { setGeneratingCode(false); }
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
      useAuthStore.getState().markPhoneVerified();
      // marketplaceMissing's "Verify your phone number" item is backend-derived —
      // markPhoneVerified only updates the local flag, so re-fetch to clear it.
      useAuthStore.getState().refreshGateStatus();
      setVerifyStep("done");
      setOtpCode("");
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
              {completionMissing.length > 0 && (
                <ul style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 6 }}>
                  {completionMissing.map((label) => (
                    <li key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
                      <span style={{ width: 14, height: 14, borderRadius: 4, border: "1.5px solid #cbd5e1", flexShrink: 0 }} />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
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

          {activeRole === UserRole.SUPPORT_WORKER && (
            <Card>
              <CardHeader><CardTitle>Profile visibility</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <p className="text-xs text-slate-400">
                  Controls how you appear to participants, coordinators and providers browsing for available workers, before you've connected with them.
                </p>
                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Name shown as">
                    <select className={twInp} value={nameDisplayMode} onChange={e => setNameDisplayMode(e.target.value)}>
                      <option value="FULL_NAME">Full name</option>
                      <option value="FIRST_NAME_INITIAL">First name and surname initial</option>
                    </select>
                  </Field>
                  <Field label="Hourly rate shown">
                    <select className={twInp} value={rateDisplayMode} onChange={e => setRateDisplayMode(e.target.value)}>
                      <option value="PUBLIC">Public</option>
                      <option value="AFTER_CONNECT">After Connect</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </Field>
                </div>
                <Field label="Contact preference">
                  <select className={twInp} value={contactPreference} onChange={e => setContactPreference(e.target.value)}>
                    <option value="ALLOW_MESSAGES">Allow messages</option>
                    <option value="INVITATIONS_ONLY">Invitations only</option>
                  </select>
                </Field>
              </CardContent>
            </Card>
          )}

          {activeRole === UserRole.SUPPORT_WORKER && (
            <Card>
              <CardHeader><CardTitle>Introduction</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <Field label="Short introduction">
                  <Textarea value={introSummary} onChange={setIntroSummary} placeholder="A short intro shown on your profile card..." rows={2} />
                </Field>
                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Years of experience">
                    <select className={twInp} value={experienceYearsBucket} onChange={e => setExperienceYearsBucket(e.target.value)}>
                      <option value="">Select…</option>
                      <option value="0-1">0–1 years</option>
                      <option value="1-3">1–3 years</option>
                      <option value="3-5">3–5 years</option>
                      <option value="5-10">5–10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </Field>
                  <Field label="Approach (comma-separated)">
                    <input style={inp} value={approachTags.join(", ")} onChange={e => setApproachTags(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="e.g. Patient, Structured" />
                  </Field>
                </div>
                <Field label="Interests (comma-separated)">
                  <input style={inp} value={interests.join(", ")} onChange={e => setInterests(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="e.g. Music, Sport, Gardening" />
                </Field>
              </CardContent>
            </Card>
          )}

          {activeRole === UserRole.SUPPORT_WORKER && (
            <Card>
              <CardHeader><CardTitle>Experience with participant groups</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <TagToggleGroup label="Age groups" options={["Children", "Young people", "Adults", "Older people"]} value={ageGroupsSupported} onChange={setAgeGroupsSupported} />
                <TagToggleGroup label="Settings" options={["Home", "Supported Independent Living (SIL)", "Community", "School", "Residential aged care"]} value={settingsExperience} onChange={setSettingsExperience} />
                <TagToggleGroup label="Communication support" options={["Auslan", "AAC (augmentative/alternative communication)", "Plain English", "Interpreter-assisted"]} value={communicationSupportSkills} onChange={setCommunicationSupportSkills} />
              </CardContent>
            </Card>
          )}

          {activeRole === UserRole.SUPPORT_WORKER && (
            <Card>
              <CardHeader><CardTitle>Boundaries and environment</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <p className="text-xs text-slate-400">
                  Let participants know upfront about environments or tasks you can't support, so there are no surprises after you Connect.
                </p>
                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Environments I can't support (comma-separated)">
                    <input style={inp} value={environmentExclusions} onChange={e => setEnvironmentExclusions(e.target.value)} placeholder="e.g. Homes with smoking, Homes with pets" />
                  </Field>
                  <Field label="Tasks I can't support (comma-separated)">
                    <input style={inp} value={taskExclusions} onChange={e => setTaskExclusions(e.target.value)} placeholder="e.g. Heavy lifting" />
                  </Field>
                </div>
                <Field label="Other notes">
                  <Textarea value={boundaryNotes} onChange={setBoundaryNotes} rows={2} />
                </Field>
              </CardContent>
            </Card>
          )}

          {activeRole === UserRole.SUPPORT_WORKER && (
            <Card>
              <CardHeader><CardTitle>Travel</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Travel mode">
                    <select className={twInp} value={travelMode} onChange={e => setTravelMode(e.target.value)}>
                      <option value="">Select…</option>
                      <option value="OWN_VEHICLE">Own vehicle</option>
                      <option value="PUBLIC_TRANSPORT">Public transport</option>
                      <option value="WALKING">Walking</option>
                      <option value="NONE">None</option>
                    </select>
                  </Field>
                  <div className="flex flex-col gap-2 justify-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={childRestraintAvailable} onChange={e => setChildRestraintAvailable(e.target.checked)} />
                      Child restraint available
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={wheelchairAccessibleVehicle} onChange={e => setWheelchairAccessibleVehicle(e.target.checked)} />
                      Wheelchair-accessible vehicle
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeRole === UserRole.SUPPORT_WORKER && (
            <Card>
              <CardHeader><CardTitle>Rate breakdown & meet-and-greet</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <div className="grid grid-cols-3 gap-3.5">
                  <Field label="Weekday rate ($/hr)">
                    <input style={inp} type="number" value={weekdayRate} onChange={e => setWeekdayRate(e.target.value)} />
                  </Field>
                  <Field label="Evening rate ($/hr)">
                    <input style={inp} type="number" value={eveningRate} onChange={e => setEveningRate(e.target.value)} />
                  </Field>
                  <Field label="Saturday rate ($/hr)">
                    <input style={inp} type="number" value={saturdayRate} onChange={e => setSaturdayRate(e.target.value)} />
                  </Field>
                  <Field label="Sunday rate ($/hr)">
                    <input style={inp} type="number" value={sundayRate} onChange={e => setSundayRate(e.target.value)} />
                  </Field>
                  <Field label="Sleepover rate ($/shift)">
                    <input style={inp} type="number" value={sleepoverRate} onChange={e => setSleepoverRate(e.target.value)} />
                  </Field>
                  <Field label="Meet-and-greet preference">
                    <select className={twInp} value={meetAndGreetPreference} onChange={e => setMeetAndGreetPreference(e.target.value)}>
                      <option value="REQUIRED">Required before confirming</option>
                      <option value="OPTIONAL">Optional</option>
                      <option value="NOT_NEEDED">Not needed</option>
                    </select>
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={documentsVisibleToParticipants} onChange={e => setDocumentsVisibleToParticipants(e.target.checked)} />
                  Show my compliance/document status to participants before they Connect
                </label>
              </CardContent>
            </Card>
          )}

          {activeRole === UserRole.COORDINATOR && (
            <Card>
              <CardHeader><CardTitle>Availability & capacity</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                <Field label="Current capacity status">
                  <select className={twInp} value={currentCapacityStatus} onChange={e => setCurrentCapacityStatus(e.target.value)}>
                    <option value="">Select…</option>
                    <option value="ACCEPTING">Accepting new participants</option>
                    <option value="LIMITED">Limited availability</option>
                    <option value="WAITLIST_ONLY">Waitlist only</option>
                    <option value="NOT_ACCEPTING">Not accepting</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Availability type">
                    <select className={twInp} value={availabilityType} onChange={e => setAvailabilityType(e.target.value)}>
                      <option value="">Select…</option>
                      <option value="BUSINESS_HOURS">Business hours</option>
                      <option value="FLEXIBLE">Flexible</option>
                      <option value="EMERGENCY_AVAILABLE">Emergency availability</option>
                    </select>
                  </Field>
                  <Field label="Maximum participant load">
                    <input className={twInp} type="number" min={0} max={200} value={maxParticipantLoad}
                      onChange={e => setMaxParticipantLoad(e.target.value)} placeholder="e.g. 20" />
                  </Field>
                </div>
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
                      <option value="SELF_MANAGED">Self-managed</option>
                      <option value="PLAN_MANAGED">Plan-managed</option>
                      <option value="NDIA_MANAGED">NDIA-managed</option>
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
                {activeRole === UserRole.COORDINATOR && (
                  <>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className={twLbl}>Coordinator type</label>
                        <div className="h-10 flex items-center px-2.5 rounded-lg bg-slate-50 text-slate-600 text-sm">
                          {{ INDEPENDENT: "Independent", SC_ORGANISATION: "SC Organisation", NDIS_PROVIDER: "NDIS Provider", OTHER_ORGANISATION: "Other Organisation" }[roleType] ?? "—"}
                        </div>
                      </div>
                      <Field label="Your role in the organisation">
                        <input className={twInp} value={organisationRole} onChange={e => setOrganisationRole(e.target.value)} placeholder="e.g. Senior Support Coordinator" />
                      </Field>
                    </div>
                    <Field label="Preferred contact method">
                      <select className={twInp} value={preferredContactMethod} onChange={e => setPreferredContactMethod(e.target.value)}>
                        <option value="">Select…</option>
                        <option value="EMAIL">Email</option>
                        <option value="PHONE">Phone call</option>
                        <option value="SMS">SMS</option>
                        <option value="PLATFORM_MESSAGE">Platform message</option>
                      </select>
                    </Field>
                    {roleType && roleType !== "INDEPENDENT" && (
                      <div>
                        <label className={twLbl}>Team invitation code</label>
                        {orgInviteCode ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 tracking-widest">{orgInviteCode}</span>
                            <span className="text-xs text-slate-400">Share this with colleagues joining your organisation.</span>
                          </div>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={handleGenerateInviteCode} disabled={generatingCode}>
                            {generatingCode ? "Generating…" : "Generate invite code"}
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

            {/* Edit full profile link */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/profile/edit" style={{ fontSize: 13, color: "var(--clr-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                Edit full profile <i className="bi bi-arrow-right" />
              </Link>
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
