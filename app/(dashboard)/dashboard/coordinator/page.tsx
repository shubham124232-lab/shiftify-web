"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Manage your participants and post support requests on their behalf."
        actions={
          <>
            <Link href="/participants/new"><Button variant="secondary">+ Add Participant</Button></Link>
            <Link href="/jobs/post"><Button>+ Post Request</Button></Link>
          </>
        }
      />

      <div className="container-page py-8 space-y-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Managed Participants" value="--" hint="Live when linking API ready" />
          <StatCard label="Active Requests"      value="--" hint="Live when jobs API ready" />
          <StatCard label="Unfilled Requests"    value="--" hint="Live when jobs API ready" />
          <StatCard label="Unread Messages"      value="--" hint="Live when messages API ready" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My participants</CardTitle>
            <CardDescription>Participants you support and can post on behalf of.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="👤"
              title="No participants yet"
              description="Add participants you support so you can post requests for them with their saved details."
              action={
                <Link href="/participants/new"><Button>Add Your First Participant</Button></Link>
              }
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
                <li>- Register participants on their behalf</li>
                <li>- Post requests selecting which participant</li>
                <li>- Track applications across all participants</li>
                <li>- Save preferred providers/workers</li>
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
