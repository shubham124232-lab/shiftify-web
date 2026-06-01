"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";

interface Worker { id: string; name: string; email: string | null; phone: string | null; }

export default function TeamPage() {
  const { activeRole } = useAuth();
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.get<{ users: Worker[] }>("/linking/workers")
      .then(r => setWorkers(r.users ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  async function handleUnlink(id: string, name: string) {
    if (!confirm(`Remove ${name} from your team? They will be suspended and unlinked.`)) return;
    setUnlinking(id);
    try {
      await api.del(`/linking/workers/${id}`);
      setWorkers(prev => prev.filter(w => w.id !== id));
    } catch (err: any) { setError(err?.message ?? "Failed to remove worker."); }
    finally { setUnlinking(null); }
  }

  useEffect(() => { if (activeRole === UserRole.PROVIDER) load(); }, [activeRole]); // eslint-disable-line

  if (activeRole !== UserRole.PROVIDER) {
    return (
      <>
        <PageHeader title="My Team" />
        <div style={{ padding: "32px 20px" }}>
          <p style={{ color: "#64748b", fontSize: 14 }}>This page is only available to Provider accounts.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Team"
        description="Support workers in your organisation."
        actions={
          <button
            onClick={() => router.push("/team/new")}
            style={{ height: 40, padding: "0 18px", background: "#c2185b", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            + Add Worker
          </button>
        }
      />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

{error && <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>{error}</div>}

        <Card>
          <CardHeader><CardTitle>Workers ({workers.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading...</p>
              : workers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No workers yet</p>
                  <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Add support workers to assign them to jobs.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {workers.map(w => (
                    <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#4338ca" }}>
                        {w.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{w.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{w.email ?? w.phone ?? "No contact"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link href={`/team/${w.id}/edit`}>
                          <button style={{ height: 32, padding: "0 12px", background: "transparent", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#374151", cursor: "pointer" }}>Edit</button>
                        </Link>
                        <button
                          onClick={() => handleUnlink(w.id, w.name)}
                          disabled={unlinking === w.id}
                          style={{ height: 32, padding: "0 12px", background: "transparent", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#b91c1c", cursor: "pointer" }}
                        >
                          {unlinking === w.id ? "..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
