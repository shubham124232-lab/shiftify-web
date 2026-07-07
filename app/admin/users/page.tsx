"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  listUsers,
  getUser,
  getDocumentViewUrl,
  updateUserStatus,
  notifyUser,
  type AdminUser,
  type AdminDocument,
} from "@/lib/api/admin";

const ROLES    = ["", "SUPPORT_WORKER", "PARTICIPANT", "PROVIDER", "COORDINATOR", "PLAN_MANAGER"];
const STATUSES = ["", "PENDING", "ACTIVE", "SUSPENDED", "REJECTED"];

const STATUS_COLOURS: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700",
  PENDING:   "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
  REJECTED:  "bg-slate-100 text-slate-500",
};

const DOC_STATUS_COLOURS: Record<string, string> = {
  UPLOADED: "bg-blue-100 text-blue-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED:  "bg-orange-100 text-orange-700",
};

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState("");
  const [role, setRole]       = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Documents viewer
  const [docsUser, setDocsUser]       = useState<(AdminUser & { documents: AdminDocument[] }) | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    listUsers({ page, limit: 20, status: status || undefined, role: role || undefined })
      .then((r) => { setUsers(r.users); setTotal(r.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, status, role]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatus(id: string, newStatus: string) {
    setActionId(id);
    try {
      await updateUserStatus(id, newStatus as any);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function handleNotify(id: string) {
    setActionId(id);
    try {
      await notifyUser(id, "Account Update", "Your account has been reviewed by an admin.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionId(null);
    }
  }

  async function handleViewDocs(id: string) {
    setActionId(id);
    setDocsLoading(true);
    try {
      const r = await getUser(id);
      setDocsUser(r.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionId(null);
      setDocsLoading(false);
    }
  }

  async function handleOpenDoc(docId: string) {
    setViewingDocId(docId);
    try {
      const r = await getDocumentViewUrl(docId);
      window.open(r.viewUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setViewingDocId(null);
    }
  }

  return (
    <>
      <PageHeader title="All Users" description="Search, filter and manage platform users." />
      <div className="container-page py-8 space-y-6">
        {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
            {STATUSES.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
          </select>
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white">
            {ROLES.map(r => <option key={r} value={r}>{r || "All roles"}</option>)}
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Roles</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
                  ) : !users.length ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No users found.</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500">{u.email ?? u.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{(u.roles ?? []).map(r => r.role).join(", ")}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[u.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {u.status !== "ACTIVE" && (
                            <Button size="sm" variant="outline" disabled={actionId === u.id}
                              onClick={() => handleStatus(u.id, "ACTIVE")}>Approve</Button>
                          )}
                          {u.status !== "SUSPENDED" && (
                            <Button size="sm" variant="outline" disabled={actionId === u.id}
                              onClick={() => handleStatus(u.id, "SUSPENDED")}>Suspend</Button>
                          )}
                          <Button size="sm" variant="ghost" disabled={actionId === u.id}
                            onClick={() => handleViewDocs(u.id)}>Docs</Button>
                          <Button size="sm" variant="ghost" disabled={actionId === u.id}
                            onClick={() => handleNotify(u.id)}>Notify</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">{total} total users</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </div>

      {/* ── Documents viewer modal ── */}
      {(docsUser || docsLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => { setDocsUser(null); setDocsLoading(false); }}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {docsLoading ? "Loading…" : `Documents — ${docsUser?.name}`}
                </h2>
                {docsUser && (
                  <p className="text-xs text-slate-500">{docsUser.email ?? docsUser.phone ?? docsUser.username ?? ""}</p>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={() => { setDocsUser(null); setDocsLoading(false); }}>Close</Button>
            </div>

            <div className="px-6 py-4">
              {docsLoading ? (
                <p className="py-6 text-center text-sm text-slate-400">Loading documents…</p>
              ) : !docsUser?.documents?.length ? (
                <p className="py-6 text-center text-sm text-slate-500">No documents uploaded by this user.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {docsUser.documents.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {d.docType.replaceAll("_", " ")}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {d.fileName} · {new Date(d.uploadedAt).toLocaleDateString("en-AU")}
                        </p>
                        {d.rejectionReason && (
                          <p className="text-xs text-red-500 mt-0.5">Reason: {d.rejectionReason}</p>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${DOC_STATUS_COLOURS[d.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {d.status}
                      </span>
                      <Button size="sm" variant="outline" className="shrink-0"
                        disabled={viewingDocId === d.id}
                        onClick={() => handleOpenDoc(d.id)}>
                        {viewingDocId === d.id ? "Opening…" : "View"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
