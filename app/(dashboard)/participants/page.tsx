"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";

export default function ParticipantsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.activeRole !== "COORDINATOR") {
    return (
      <>
        <PageHeader title="My Participants" />
        <div className="container-page py-8">
          <Card>
            <CardContent>
              <p className="text-sm text-slate-600">This page is only available to coordinator accounts.</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Participants"
        description="Participants you support and can post on behalf of."
        actions={<Link href="/participants/new"><Button>+ Add Participant</Button></Link>}
      />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <EmptyState
              icon="👤"
              title="No participants yet"
              description="Add participants you support. You can save multiple addresses and phone numbers per participant and pick which one when posting a request."
              action={
                <Link href="/participants/new"><Button>Add Your First Participant</Button></Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
