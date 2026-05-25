"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";

export default function TeamPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.activeRole !== "PROVIDER") {
    return (
      <>
        <PageHeader title="My Team" />
        <div className="container-page py-8">
          <Card>
            <CardContent>
              <p className="text-sm text-slate-600">This page is only available to provider accounts.</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Team"
        description="Workers employed by your business."
        actions={
          <Link href="/team/new"><Button>+ Add Worker</Button></Link>
        }
      />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <EmptyState
              icon="👥"
              title="No workers yet"
              description="Add support workers to your team. You'll be able to assign accepted jobs to them in Phase 1D."
              action={
                <Link href="/team/new"><Button>Add Your First Worker</Button></Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
