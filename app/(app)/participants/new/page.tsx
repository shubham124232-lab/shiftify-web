import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function NewParticipantPage() {
  return (
    <>
      <PageHeader title="Add Participant" description="Register a participant on their behalf." />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              The coordinator-creates-participant wizard arrives in Sub-phase 1B. It runs the full
              participant wizard on the new participant&apos;s behalf, links them to you via
              <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">parentUserId</code>,
              and (once email is live in 1D) emails them login credentials.
            </p>
            <Link href="/participants" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
              ← Back to participants
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
