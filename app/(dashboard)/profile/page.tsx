"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
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
  const { user, activeRole, silentInit } = useAuth();

  // ── Basic contact fields ──────────────────────────────────────────────────
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [suburb, setSuburb] = useState("");

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

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);
  const [profile,  setProfile]  = useState<any>(null);
  const [completion, setCompletion] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail((user as any).email ?? "");
    setPhone((user as any).phone ?? "");
    setAvatarUrl((user as any).avatarUrl ?? null);

    // Load full user (includes embedded role profile)
    api.get<{ user: any; profileCompletion: number }>("/users/me")
      .then(res => {
        const u = res.user;
        setCompletion(res.profileCompletion ?? 0);
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
        setAcceptingClients(p.acceptingClients ?? true);
        // Workers: servicesOffered  Providers: coreServices
        setServicesOffered(p.servicesOffered ?? p.coreServices ?? []);
      })
      .catch(() => {});
  }, [user, activeRole]);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.get<{ uploadUrl: string; fileKey: string; publicUrl: string }>(
        `/upload/presign?category=avatars&fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
      );
      await fetch(res.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      await api.patch("/users/me", { avatarUrl: res.publicUrl });
      setAvatarUrl(res.publicUrl);
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
      await api.patch("/users/me", {
        name:          name.trim()   || undefined,
        email:         email.trim()  || undefined,
        phone:         phone.trim()  || undefined,
        defaultSuburb: suburb.trim() || undefined,
      });

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
        // participant schema: ndisNumber only; bio/suburb go via base user
        profilePayload.ndisNumber = ndisNumber || undefined;
      }
      const rolePath = ROLE_PROFILE_PATH[activeRole as UserRole];
      if (rolePath && Object.keys(profilePayload).length > 0) {
        await api.post(`/users/me/profile/${rolePath}`, profilePayload);
      }

      await silentInit();
      setSuccess(true);
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

  if (!user) return null;

  const initials = user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

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
              <div style={row}>
                <Field label="Email">
                  <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </Field>
                <Field label="Phone">
                  <input style={inp} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+61 4xx xxx xxx" />
                </Field>
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
            <Card>
              <CardHeader><CardTitle>NDIS details</CardTitle></CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="NDIS number">
                  <input style={inp} value={ndisNumber} onChange={e => setNdisNumber(e.target.value)} placeholder="43 000 000 00" />
                </Field>
              </CardContent>
            </Card>
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

          {error && (
            <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#2E7D32" }}>
              Profile saved successfully.
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ height: 44, padding: "0 28px", background: "#c2185b", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
