"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function WorkerDashboard() {
  const { user } = useAuth();
  if (!user) return null;
  const isSolo = true; // parentUserId linking arrives in Phase 2

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description={
          isSolo
            ? "Browse available jobs and accept the ones that fit your schedule."
            : "View jobs assigned to you by your provider and mark them complete when done."
        }
        actions={
          isSolo ? (
            <Link href="/jobs"><Button>Browse Jobs</Button></Link>
          ) : null
        }
      />

      <div className="container-page py-8 space-y-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Open Opportunities" value="--" hint="Live when jobs API ready" />
          <StatCard label="Active Bookings"    value="--" hint="Live when jobs API ready" />
          <StatCard label="Completed Jobs"     value="--" hint="Live when jobs API ready" />
          <StatCard label="Unread Messages"    value="--" hint="Live when messages API ready" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isSolo ? "Recommended for you" : "Assigned to me"}{" "}
              {!isSolo && <Badge tone="brand">Provider-employed</Badge>}
            </CardTitle>
            <CardDescription>
              {isSolo
                ? "Jobs near you that match your services."
                : "Your provider assigns work to you. You cannot accept marketplace jobs directly."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={isSolo ? "🔎" : "📋"}
              title={isSolo ? "No jobs yet" : "No assignments yet"}
              description={
                isSolo
                  ? "Once participants post requests in your area, they will appear here."
                  : "When your provider accepts a job and assigns it to you, it will show up here."
              }
              action={isSolo ? <Link href="/jobs"><Button>Browse marketplace</Button></Link> : undefined}
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
                <li>- Browse and {isSolo ? "accept" : "track"} jobs</li>
                <li>- Mark jobs in-progress and complete</li>
                <li>- Message the participant during a booking</li>
                <li>- Manage availability and preferences</li>
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
                <div className="flex justify-between"><dt className="text-slate-500">Suburb</dt><dd>Not set</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Employment</dt><dd>{isSolo ? "Solo / Contractor" : "Provider-employed"}</dd></div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
