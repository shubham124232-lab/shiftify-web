"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
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
const hint: React.CSSProperties = { fontSize: 11, color: "#94a3b8", marginTop: 4 };

export default function NewWorkerPage() {
  const router = useRouter();

  const [name,     setName]     = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const missing: string[] = [];
  if (!name.trim())        missing.push("Full name");
  if (!username.trim())    missing.push("Username");
  if (password.length < 8) missing.push("Password (min 8 characters)");

  const canSubmit = missing.length === 0 && !saving;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) { setError(`Please complete: ${missing.join(", ")}`); return; }
    setSaving(true); setError(null);

    try {
      const result = await api.post<{ user: { id: string } }>("/linking/workers", {
        name: name.trim(),
        username: username.trim(),
        password,
      });
      router.push(`/team/${result.user.id}/edit?created=1`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : (err as any)?.message;
      setError(msg ?? "Failed to create worker. Please try again.");
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Add Worker"
        description="Create a managed support worker account. You'll complete their profile, availability and compliance documents on the next page — the account starts as a draft until setup is finished."
        actions={<Link href="/team"><Button variant="outline" size="sm">← Back</Button></Link>}
      />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardHeader><CardTitle>Account & login</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Full name *</label>
                <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" autoFocus />
              </div>
              <div>
                <label style={lbl}>Username *</label>
                <input
                  style={inp} value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                  placeholder="john.smith" autoComplete="off"
                />
                <p style={hint}>Letters, numbers, dot, dash or underscore. Used to log in.</p>
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
                <p style={hint}>Share these credentials with the worker so they can log in.</p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>
              {error}
            </div>
          )}

          {!canSubmit && missing.length > 0 && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#92400E" }}>
              Still needed before you can create this worker: {missing.join(", ")}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <Button type="submit" disabled={!canSubmit} loading={saving}>
              {saving ? "Creating..." : "Create worker & continue setup"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/team")}>Cancel</Button>
          </div>
        </form>
      </div>
    </>
  );
}
