"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, http } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { UserRole } from "@/lib/types";
import { AvailabilityGrid, type Slot } from "@/components/registration/fields/AvailabilityGrid";

const inp: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 10px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4,
};
const hint: React.CSSProperties = { fontSize: 11, color: "#94a3b8", marginTop: 4 };

const EXPERIENCE_LEVELS = [
  { value: "BEGINNER",     label: "Beginner (0-1 years)" },
  { value: "INTERMEDIATE", label: "Intermediate (1-3 years)" },
  { value: "EXPERIENCED",  label: "Experienced (3-7 years)" },
  { value: "EXPERT",       label: "Expert (7+ years)" },
];

const REQUIRED_DOCS = [
  { docType: "POLICE_CHECK",   label: "Police Check" },
  { docType: "NDIS_SCREENING", label: "NDIS Worker Screening Check" },
  { docType: "WWCC",           label: "Working with Children Check (WWCC)" },
  { docType: "FIRST_AID",      label: "First Aid Certificate" },
];

interface ChildDocument {
  id: string;
  docType: string;
  fileName: string;
  status: string;
  uploadedAt: string;
}

export default function EditWorkerPage() {
  const { workerId } = useParams<{ workerId: string }>();
  const router = useRouter();
  const { activeRole } = useAuth();

  const [status,          setStatus]          = useState<string>("ACTIVE");
  const [activating,      setActivating]      = useState(false);
  const [activateError,   setActivateError]   = useState<string | null>(null);

  const [name,            setName]            = useState("");
  const [username,        setUsername]        = useState("");
  const [phone,           setPhone]           = useState("");
  const [bio,             setBio]             = useState("");
  const [suburb,          setSuburb]          = useState("");
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [availability,    setAvailability]    = useState<Slot[]>([]);
  const [serviceAreaInput, setServiceAreaInput] = useState("");
  const [travelRadiusKm,   setTravelRadiusKm]   = useState("");

  const [documents,    setDocuments]    = useState<ChildDocument[]>([]);
  const [uploadType,   setUploadType]   = useState(REQUIRED_DOCS[0].docType);
  const [uploading,    setUploading]    = useState(false);
  const [docError,     setDocError]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState(false);
  const [newPassword,  setNewPassword]  = useState("");
  const [showNewPw,    setShowNewPw]    = useState(false);
  const [resetting,    setResetting]    = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  function loadDocuments() {
    if (!workerId) return;
    api.get<{ documents: ChildDocument[] }>(`/users/${workerId}/documents`)
      .then(r => setDocuments(r.documents ?? []))
      .catch(e => setDocError(e.message));
  }

  useEffect(() => {
    if (activeRole !== UserRole.PROVIDER || !workerId) return;
    // Load full profile via parent-scoped GET /users/:id
    api.get<{ user: any }>(`/users/${workerId}`)
      .then(r => {
        const u = r.user;
        setStatus(u.status ?? "ACTIVE");
        setName(u.name ?? "");
        setUsername(u.username ?? "");
        setPhone(u.phone ?? "");
        setSuburb(u.defaultSuburb ?? "");
        // Worker profile fields
        const wp = u.workerProfile;
        setBio(wp?.bio ?? "");
        setServicesOffered(wp?.servicesOffered ?? []);
        setExperienceLevel(wp?.experienceLevel ?? "");
        setAvailability((wp?.availability ?? []).map((s: any) => ({
          dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime,
        })));
        setServiceAreaInput((wp?.serviceAreas ?? []).join(", "));
        setTravelRadiusKm(wp?.travelRadiusKm != null ? String(wp.travelRadiusKm) : "");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    loadDocuments();
  }, [workerId, activeRole]); // eslint-disable-line

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
      const serviceAreas = serviceAreaInput.split(",").map(s => s.trim()).filter(Boolean);
      const radiusNum    = travelRadiusKm.trim() ? Number(travelRadiusKm) : undefined;

      // Step 1: save base user fields
      await api.patch(`/users/${workerId}`, {
        name:          name.trim()   || undefined,
        phone:         phone.trim()  || undefined,
        defaultSuburb: suburb.trim() || undefined,
      });
      // Step 2: save worker profile fields (always send, even if empty, so clearing works)
      await api.post(`/users/${workerId}/profile/worker`, {
        bio:             bio.trim() || undefined,
        servicesOffered: servicesOffered,
        experienceLevel: experienceLevel || undefined,
        availability:    availability,
        serviceAreas:    serviceAreas.length ? serviceAreas : undefined,
        travelRadiusKm:  radiusNum,
      }).catch(profileErr => {
        // Non-fatal — profile save failing doesn't undo the base save
        console.warn("Profile save warning:", profileErr?.message);
      });
      setSuccess(true);
      // Don't auto-redirect — let user see the success and choose when to go back
    } catch (err: any) {
      setError(err?.message ?? "Save failed. Check the console for details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !workerId) return;
    setUploading(true); setDocError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("docType", uploadType);
      await http.post(`/users/${workerId}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      loadDocuments();
    } catch (err: any) {
      setDocError(err?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDeleteDocument(id: string) {
    if (!workerId || !confirm("Remove this document?")) return;
    try {
      await api.del(`/users/${workerId}/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setDocError(err?.message ?? "Failed to remove document.");
    }
  }

  // Mirrors the server-side completeness check (see linking.service.ts) for
  // immediate UX feedback — the backend re-validates before activating regardless.
  const onboardingMissing: string[] = [];
  if (servicesOffered.length === 0) onboardingMissing.push("Services offered");
  if (!experienceLevel)             onboardingMissing.push("Experience level");
  if (availability.length === 0)    onboardingMissing.push("Availability");
  const serviceAreas = serviceAreaInput.split(",").map(s => s.trim()).filter(Boolean);
  if (serviceAreas.length === 0)    onboardingMissing.push("Service areas");
  if (!travelRadiusKm.trim())       onboardingMissing.push("Travel radius");
  for (const doc of REQUIRED_DOCS) {
    if (!documents.some(d => d.docType === doc.docType)) onboardingMissing.push(doc.label);
  }
  const readyToActivate = onboardingMissing.length === 0;

  async function handleActivate() {
    setActivating(true); setActivateError(null);
    try {
      await api.post(`/linking/workers/${workerId}/activate`, {});
      setStatus("ACTIVE");
    } catch (err: any) {
      setActivateError(err?.message ?? "Activation failed. Please try again.");
    } finally {
      setActivating(false);
    }
  }

  function toggleService(val: string) {
    setServicesOffered(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  if (activeRole !== UserRole.PROVIDER) {
    return (
      <>
        <PageHeader title="Edit Worker" />
        <div style={{ padding: "32px 20px" }}>
          <p style={{ color: "#64748b", fontSize: 14 }}>Only providers can edit worker profiles.</p>
        </div>
      </>
    );
  }

  if (loading) return <div style={{ padding: 40, color: "#94a3b8" }}>Loading...</div>;

  return (
    <>
      <PageHeader
        title="Edit Worker Profile"
        description="Update this worker's details. The worker cannot edit these themselves — you maintain everything on their behalf."
        actions={<Link href="/team"><Button variant="outline" size="sm">← Back</Button></Link>}
      />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>

        {status === "DRAFT" && (
          <div
            style={{
              marginBottom: 20, borderRadius: 12, padding: "16px 18px",
              background: readyToActivate ? "#E8F5E9" : "#FFFBEB",
              border: readyToActivate ? "2px solid #A5D6A7" : "2px solid #FDE68A",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: readyToActivate ? "#2E7D32" : "#92400E" }}>
                  {readyToActivate ? "✓ Ready to Activate" : "Setup Incomplete — Draft"}
                </div>
                <p style={{ fontSize: 12, color: readyToActivate ? "#2E7D32" : "#92400E", marginTop: 4 }}>
                  {readyToActivate
                    ? "All required details and documents are in place. Activate this worker to make them visible for job matching."
                    : `Still needed before this worker can be activated: ${onboardingMissing.join(", ")}`}
                </p>
              </div>
              <button
                type="button"
                disabled={!readyToActivate || activating}
                onClick={handleActivate}
                style={{
                  height: 38, padding: "0 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none",
                  background: readyToActivate ? "#2E7D32" : "#e2e8f0",
                  color: readyToActivate ? "#fff" : "#94a3b8",
                  cursor: readyToActivate && !activating ? "pointer" : "not-allowed",
                }}
              >
                {activating ? "Activating..." : "Finish setup & activate"}
              </button>
            </div>
            {activateError && (
              <p style={{ fontSize: 12, color: "#C62828", marginTop: 10, fontWeight: 600 }}>✗ {activateError}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <Card>
            <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {username && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Login username</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>{username}</span>
                </div>
              )}
              <div>
                <label style={lbl}>Full name</label>
                <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input style={inp} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+61 4xx xxx xxx" />
              </div>
              <div>
                <label style={lbl}>Suburb</label>
                <input style={inp} value={suburb} onChange={e => setSuburb(e.target.value)} placeholder="e.g. Parramatta" />
              </div>
              <div>
                <label style={lbl}>Bio</label>
                <textarea
                  value={bio} onChange={e => setBio(e.target.value)}
                  rows={4} placeholder="Worker's background and experience..."
                  style={{ ...inp, height: "auto", padding: "8px 10px", resize: "vertical" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Expertise</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Services offered</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {JOB_CATEGORIES.map(cat => {
                    const selected = servicesOffered.includes(cat.value);
                    return (
                      <button
                        key={cat.value} type="button" onClick={() => toggleService(cat.value)}
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
              </div>
              <div>
                <label style={lbl}>Experience level</label>
                <select style={inp} value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                  <option value="">Select...</option>
                  {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Availability</CardTitle></CardHeader>
            <CardContent>
              <AvailabilityGrid value={availability} onChange={setAvailability} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Service area</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Suburbs / service areas (comma separated)</label>
                <input
                  style={inp} value={serviceAreaInput} onChange={e => setServiceAreaInput(e.target.value)}
                  placeholder="Parramatta, Blacktown, Penrith"
                />
              </div>
              <div>
                <label style={lbl}>Travel radius (km)</label>
                <input
                  style={inp} type="number" min={0} max={500} value={travelRadiusKm}
                  onChange={e => setTravelRadiusKm(e.target.value)} placeholder="25"
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <div style={{ background: "#FFF0F0", border: "2px solid #FFCDD2", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#C62828", fontWeight: 600 }}>
              ✗ {error}
            </div>
          )}
          {success && (
            <div style={{ background: "#E8F5E9", border: "2px solid #A5D6A7", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#2E7D32", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>✓ Worker profile saved successfully.</span>
              <button
                type="button"
                onClick={() => router.push("/team")}
                style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                ← Back to team
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <Button type="submit" loading={saving}>Save changes</Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/team")}>Cancel</Button>
          </div>
        </form>

        {/* Documents — uploaded by the provider on the worker's behalf */}
        <Card style={{ marginTop: 20 }}>
          <CardHeader><CardTitle>Compliance documents</CardTitle></CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ ...hint, marginTop: 0 }}>
              Upload and manage this worker's documents — they will not be asked to submit these themselves.
            </p>

            {docError && (
              <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#C62828" }}>
                {docError}
              </div>
            )}

            {documents.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {documents.map(doc => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{REQUIRED_DOCS.find(d => d.docType === doc.docType)?.label ?? doc.docType}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{doc.fileName} · {doc.status}</div>
                    </div>
                    <button
                      type="button" onClick={() => handleDeleteDocument(doc.id)}
                      style={{ background: "none", border: "none", color: "#C62828", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <label style={lbl}>Document type</label>
                <select style={inp} value={uploadType} onChange={e => setUploadType(e.target.value)}>
                  {REQUIRED_DOCS.map(d => <option key={d.docType} value={d.docType}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} disabled={uploading} style={{ fontSize: 13 }} />
              </div>
            </div>
            {uploading && <p style={{ fontSize: 12, color: "#94a3b8" }}>Uploading...</p>}
          </CardContent>
        </Card>

        {/* Reset password */}
        <Card style={{ marginTop: 20 }}>
          <CardHeader><CardTitle style={{ fontSize: 15 }}>Reset login password</CardTitle></CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: "#64748b" }}>Set a new password for this worker's account. Share the new password with them directly.</p>
            <div style={{ position: "relative" }}>
              <input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                style={{ ...inp, paddingRight: 60 }}
              />
              <button type="button" onClick={() => setShowNewPw(v => !v)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
                {showNewPw ? "Hide" : "Show"}
              </button>
            </div>
            {resetSuccess && <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Password updated successfully.</p>}
            <button
              type="button"
              disabled={resetting || newPassword.length < 8}
              onClick={async () => {
                setResetting(true); setResetSuccess(false);
                try {
                  await api.post(`/users/${workerId}/reset-password`, { password: newPassword });
                  setNewPassword(""); setResetSuccess(true);
                } catch (err: any) { setError(err?.message ?? "Reset failed."); }
                finally { setResetting(false); }
              }}
              style={{ alignSelf: "flex-start", height: 38, padding: "0 18px", background: newPassword.length >= 8 ? "#374151" : "#e2e8f0", color: newPassword.length >= 8 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: newPassword.length >= 8 ? "pointer" : "not-allowed" }}
            >
              {resetting ? "Resetting..." : "Reset password"}
            </button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
