"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { broadcast, notifyUser } from "@/lib/api/admin";

const ROLES = ["", "SUPPORT_WORKER", "PARTICIPANT", "PROVIDER", "COORDINATOR", "PLAN_MANAGER"];

export default function BroadcastPage() {
  const { user } = useAuth();

  // Broadcast state
  const [bTitle, setBTitle]   = useState("");
  const [bBody, setBBody]     = useState("");
  const [bRole, setBRole]     = useState("");
  const [bLoading, setBLoading] = useState(false);
  const [bResult, setBResult] = useState<string | null>(null);
  const [bError, setBError]   = useState<string | null>(null);

  // Single user notify state
  const [nUserId, setNUserId] = useState("");
  const [nTitle, setNTitle]   = useState("");
  const [nBody, setNBody]     = useState("");
  const [nLoading, setNLoading] = useState(false);
  const [nResult, setNResult] = useState<string | null>(null);
  const [nError, setNError]   = useState<string | null>(null);

  if (!user || user.adminTier !== "SUPER_ADMIN") {
    return (
      <div className="container-page py-16 text-center text-slate-500">
        <p className="text-lg font-medium">Access denied</p>
        <p className="mt-1 text-sm">Broadcast is restricted to Super Admins.</p>
      </div>
    );
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    setBError(null); setBResult(null);
    if (!bTitle.trim() || !bBody.trim()) { setBError("Title and message are required."); return; }
    setBLoading(true);
    try {
      const r = await broadcast(bTitle, bBody, bRole || undefined);
      setBResult(`Sent to ${r.sent} users (${r.failed} failed).`);
      setBTitle(""); setBBody(""); setBRole("");
    } catch (err: any) {
      setBError(err.message);
    } finally {
      setBLoading(false);
    }
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    setNError(null); setNResult(null);
    if (!nUserId.trim() || !nTitle.trim() || !nBody.trim()) { setNError("All fields required."); return; }
    setNLoading(true);
    try {
      await notifyUser(nUserId, nTitle, nBody);
      setNResult("Notification sent.");
      setNUserId(""); setNTitle(""); setNBody("");
    } catch (err: any) {
      setNError(err.message);
    } finally {
      setNLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Send Notifications" description="Broadcast to all users or notify a single user" />
      <div className="container-page py-8 grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* Broadcast */}
        <Card>
          <CardHeader>
            <CardTitle>Broadcast</CardTitle>
            <CardDescription>Send a notification to all users, or filter by role.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target role</label>
                <select
                  value={bRole}
                  onChange={(e) => setBRole(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r || "All users"}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="e.g. Platform maintenance tonight"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  value={bBody}
                  onChange={(e) => setBBody(e.target.value)}
                  rows={4}
                  placeholder="Your message…"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {bError  && <p className="text-sm text-red-600">{bError}</p>}
              {bResult && <p className="text-sm text-green-600">{bResult}</p>}
              <Button type="submit" disabled={bLoading} className="w-full">
                {bLoading ? "Sending…" : "Send broadcast"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Single user */}
        <Card>
          <CardHeader>
            <CardTitle>Notify a single user</CardTitle>
            <CardDescription>Send a targeted notification using a user ID.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNotify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
                <input
                  type="text"
                  value={nUserId}
                  onChange={(e) => setNUserId(e.target.value)}
                  placeholder="UUID from All Users page"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={nTitle}
                  onChange={(e) => setNTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  value={nBody}
                  onChange={(e) => setNBody(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              {nError  && <p className="text-sm text-red-600">{nError}</p>}
              {nResult && <p className="text-sm text-green-600">{nResult}</p>}
              <Button type="submit" disabled={nLoading} className="w-full">
                {nLoading ? "Sending…" : "Send notification"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
