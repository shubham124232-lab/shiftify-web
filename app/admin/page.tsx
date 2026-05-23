"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminHomePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Verification queue and user management for the Shiftify platform."
      />

      <div className="container-page py-8 space-y-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Pending Verifications" value={0} tone="warn" />
          <StatCard label="Total Users" value={0} />
          <StatCard label="Approved Users" value={0} tone="ok" />
          <StatCard label="System Status" value="OK" tone="ok" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Verification queue</CardTitle>
              <CardDescription>Sub-phase 1C will populate this with pending registrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Once users complete the registration wizards, they appear here in PENDING state.
                You&apos;ll be able to view their uploaded documents and approve or reject with a reason.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Audit log</CardTitle>
              <CardDescription>SUPER_ADMIN only — every admin action is logged.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Approve, reject, and suspend actions all write to the audit log with timestamp,
                admin ID, target user ID, and reason.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
