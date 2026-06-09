"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inp: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 10px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4,
};

export default function NewParticipantPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [created,  setCreated]  = useState<{ name: string; username: string; password: string } | null>(null);
  const [copied,   setCopied]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim())     { setError("Name is required."); return; }
    if (!username.trim()) { setError("Username is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSaving(true); setError(null);
    try {
      await api.post("/linking/participants", {
        name: name.trim(), username: username.trim(), password,
      });
      setCreated({ name: name.trim(), username: username.trim(), password });
    } catch (err: any) {
      setError(err?.message ?? "Failed to create participant.");
    } finally {
      setSaving(false);
    }
  }

  function copyCredentials() {
    if (!created) return;
    navigator.clipboard.writeText(`Username: ${created.username}\nPassword: ${created.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (created) {
    return (
      <>
        <PageHeader title="Participant Created" description="Share these login credentials with the participant." />
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ background: "#fff", border: "2px solid #bbf7d0", borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d", marginBottom: 16 }}>
              ✓ Account created for {created.name}
            </div>
            <p style={{ fontSize: 13, color: "#374151", marginBottom: 16, lineHeight: 1.6 }}>
              Share these credentials with the participant. The password will not be shown again — save it now or reset it later from the Edit page.
            </p>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "14px 16px", fontFamily: "monospace", fontSize: 14, marginBottom: 16 }}>
              <div style={{ marginBottom: 6 }}><span style={{ color: "#6b7280", fontFamily: "sans-serif", fontSize: 12 }}>Username</span></div>
              <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>{created.username}</div>
              <div style={{ marginBottom: 6 }}><span style={{ color: "#6b7280", fontFamily: "sans-serif", fontSize: 12 }}>Password</span></div>
              <div style={{ fontWeight: 700, color: "#1e293b" }}>{created.password}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={copyCredentials}
                style={{ height: 40, padding: "0 20px", background: copied ? "#15803d" : "#c2185b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {copied ? "Copied!" : "Copy credentials"}
              </button>
              <button
                onClick={() => router.push("/participants")}
                style={{ height: 40, padding: "0 20px", background: "transparent", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}
              >
                Go to My Participants →
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Add Participant"
        description="Create a managed participant account on their behalf."
        actions={<Link href="/participants"><Button variant="outline" size="sm">← Back</Button></Link>}
      />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardHeader><CardTitle>Participant details</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Full name *</label>
                <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" autoFocus />
              </div>
              <div>
                <label style={lbl}>Username *</label>
                <input
                  style={inp} value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                  placeholder="jane.smith" autoComplete="off"
                />
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Letters, numbers, dot, dash or underscore. Used to log in.</p>
              </div>
              <div>
                <label style={lbl}>Temporary password *</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inp, paddingRight: 70 }}
                    type={showPw ? "text" : "password"}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters" autoComplete="new-password"
                  />
                  <button
                    type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Share these credentials with the participant to let them log in.</p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <Button type="submit" loading={saving}>Create participant</Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/participants")}>Cancel</Button>
          </div>
        </form>
      </div>
    </>
  );
}
