"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ParticipantDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Post support requests, track applications, and confirm completed support."
        actions={
          <Link href="/jobs/post">
            <Button>+ Post Support Request</Button>
          </Link>
        }
      />

      <div className="container-page py-8 space-y-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Active Requests"   value="--" hint="Live when jobs API ready" />
          <StatCard label="Applications"      value="--" hint="Live when jobs API ready" />
          <StatCard label="Upcoming Bookings" value="--" hint="Live when jobs API ready" />
          <StatCard label="Unread Messages"   value="--" hint="Live when messages API ready" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My recent requests</CardTitle>
            <CardDescription>You have not posted any requests yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="📋"
              title="No requests yet"
              description="Post a support request and verified workers in your area will be notified."
              action={
                <Link href="/jobs/post">
                  <Button>Post Your First Request</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Coming next</CardTitle>
              <CardDescription>Phase 2 will activate the marketplace loop.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>- Post a support request</li>
                <li>- See applications from workers/providers</li>
                <li>- Confirm completed support</li>
                <li>- Save favourite workers</li>
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
                <div className="flex justify-between"><dt className="text-slate-500">Suburb</dt><dd>{user.defaultSuburb ?? "Not set"}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">State</dt><dd>{user.defaultState ?? "Not set"}</dd></div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
