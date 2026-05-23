"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProviderDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Accept jobs on behalf of your team and assign them to available workers."
        actions={
          <>
            <Link href="/jobs"><Button variant="secondary">Browse Jobs</Button></Link>
            <Link href="/team/new"><Button>+ Add Worker</Button></Link>
          </>
        }
      />

      <div className="container-page py-8 space-y-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Team Size"         value="--" hint="Live when linking API ready" />
          <StatCard label="Active Jobs"       value="--" hint="Live when jobs API ready" />
          <StatCard label="Available Workers" value="--" hint="Live when jobs API ready" />
          <StatCard label="Unread Messages"   value="--" hint="Live when messages API ready" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My team</CardTitle>
            <CardDescription>Workers employed by your business.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="👥"
              title="No workers yet"
              description="Add support workers to your team so you can assign jobs to them when you accept work."
              action={
                <Link href="/team/new"><Button>Add Your First Worker</Button></Link>
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
                <li>- Add workers to your team</li>
                <li>- Browse and accept marketplace jobs</li>
                <li>- Assign jobs to specific workers</li>
                <li>- Post SIL/SDA and service availability (Phase 2+)</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Business snapshot</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              <dl className="space-y-2">
                <div className="flex justify-between"><dt className="text-slate-500">Account email</dt><dd>{user.email}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd>{user.status}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Suburb</dt><dd>{user.defaultSuburb ?? "Not set"}</dd></div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
