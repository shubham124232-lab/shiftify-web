"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BranchDetail {
  id: string;
  name: string;
  region: string | null;
  timezone: string | null;
  managerName: string | null;
  serviceLines: string[];
  isActive: boolean;
  administrators: { id: string; rolePreset: string; status: string; user: { id: string; name: string; email: string } }[];
  teamMembers: { id: string; name: string; mobile: string; skills: string[]; inviteStatus: "PENDING" | "VERIFIED"; locations: string[]; relationshipType: string | null }[];
}

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRATOR: "Administrator", BRANCH_MANAGER: "Branch Manager", INTAKE: "Intake", WORKFORCE: "Workforce", READ_ONLY: "Read-only",
};

// Branch workspace: one Branch's people at a glance.
export default function BranchWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ branch: BranchDetail }>(`/provider-org/branches/${id}`)
      .then((r) => setBranch(r.branch))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load this branch"));
  }, [id]);

  return (
    <>
      <PageHeader
        title={branch ? branch.name : "Branch workspace"}
        description={branch ? [branch.region, branch.timezone].filter(Boolean).join(" · ") || "Branch workspace" : undefined}
        actions={<Link href="/provider/branches"><Button variant="outline" size="sm">All branches</Button></Link>}
      />
      <div className="container-page space-y-5 py-8">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!branch && !error && <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />}
        {branch && (
          <>
            <Card>
              <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 py-4 text-sm">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${branch.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {branch.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-slate-500">Manager: <strong className="text-slate-800">{branch.managerName ?? "Not set"}</strong></span>
                <span className="text-slate-500">Team members: <strong className="text-slate-800">{branch.teamMembers.length}</strong></span>
                <span className="text-slate-500">Administrators: <strong className="text-slate-800">{branch.administrators.length}</strong></span>
                {branch.serviceLines.length > 0 && <span className="text-slate-500">Services: <strong className="text-slate-800">{branch.serviceLines.join(", ")}</strong></span>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Team members</CardTitle>
                  <Link href="/provider/workforce" className="text-sm font-semibold text-brand-600 hover:underline">Manage Internal Team</Link>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                {branch.teamMembers.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">No team members on this branch yet.</p>
                ) : (
                  <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                    {branch.teamMembers.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="m-0 text-sm font-semibold text-slate-900">{m.name}</p>
                          <p className="m-0 mt-0.5 truncate text-xs text-slate-500">{[m.mobile, m.locations.join(", "), m.skills.join(", ")].filter(Boolean).join(" · ")}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${m.inviteStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {m.inviteStatus === "VERIFIED" ? "Verified" : "Pending verification"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Administrators</CardTitle>
                  <Link href="/provider/administrators" className="text-sm font-semibold text-brand-600 hover:underline">Manage Administrators</Link>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                {branch.administrators.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">No administrators are assigned to this branch.</p>
                ) : (
                  <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                    {branch.administrators.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="m-0 text-sm font-semibold text-slate-900">{a.user.name}</p>
                          <p className="m-0 mt-0.5 text-xs text-slate-500">{a.user.email}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{ROLE_LABEL[a.rolePreset] ?? a.rolePreset}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
