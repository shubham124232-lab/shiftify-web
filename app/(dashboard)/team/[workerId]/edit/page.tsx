"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { UserRole } from "@/lib/types";

const inp: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 10px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4,
};

export default function EditWorkerPage() {
  const { workerId } = useParams<{ workerId: string }>();
  const router = useRouter();
  const { activeRole } = useAuth();

  const [name,            setName]            = useState("");
  const [username,        setUsername]        = useState("");
  const [phone,           setPhone]           = useState("");
  const [bio,             setBio]             = useState("");
  const [suburb,          setSuburb]          = useState("");
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);

  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState(false);
  const [newPassword,  setNewPassword]  = useState("");
  const [showNewPw,    setShowNewPw]    = useState(false);
  const [resetting,    setResetting]    = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (activeRole !== UserRole.PROVIDER || !workerId) return;
    // Load full profile via parent-scoped GET /users/:id
    api.get<{ user: any }>(`/users/${workerId}`)
      .then(r => {
        const u = r.user;
        setName(u.name ?? "");
        setUsername(u.username ?? "");
        setPhone(u.phone ?? "");
        setSuburb(u.defaultSuburb ?? "");
        // Worker profile fields
        const wp = u.workerProfile;
        setBio(wp?.bio ?? "");
        setServicesOffered(wp?.servicesOffered ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [workerId, activeRole]); // eslint-disable-line

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
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
        description="Update this worker's details."
        actions={<Link href="/team"><Button variant="outline" size="sm">← Back</Button></Link>}
      />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>
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
            <CardHeader><CardTitle>Services offered</CardTitle></CardHeader>
            <CardContent>
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

          {/* Reset password */}
          <Card>
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

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit" disabled={saving}
              style={{ height: 44, padding: "0 28px", background: "#c2185b", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <Button type="button" variant="ghost" onClick={() => router.push("/team")}>Cancel</Button>
          </div>
        </form>
      </div>
    </>
  );
}
