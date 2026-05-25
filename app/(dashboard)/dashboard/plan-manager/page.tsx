"use client";

import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PlanManagerDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="View the marketplace and the participants whose plans you manage."
      />

      <div className="container-page py-8 space-y-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Linked Participants" value="--" hint="Live when participant API ready" />
          <StatCard label="Jobs Posted"         value="--" hint="Live when jobs API ready" />
          <StatCard label="Jobs Completed"      value="--" hint="Live when jobs API ready" />
          <StatCard label="Jobs In Progress"    value="--" hint="Live when jobs API ready" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Marketplace overview</CardTitle>
            <CardDescription>You have read-only access to all jobs system-wide.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="📊"
              title="No jobs to show yet"
              description="Once participants and coordinators start posting, you will see the activity here."
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Coming next</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>- View marketplace activity (read-only)</li>
                <li>- Track linked participants and their jobs</li>
                <li>- Invoice approval workflow (Phase 2+)</li>
                <li>- Budget reporting (Phase 2+)</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Your profile snapshot</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              <dl className="space-y-2">
                <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{user.email}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd>{user.status}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Service area</dt><dd>Not set</dd></div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
