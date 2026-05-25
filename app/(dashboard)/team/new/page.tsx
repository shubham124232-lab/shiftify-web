import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function NewTeamMemberPage() {
  return (
    <>
      <PageHeader title="Add Worker" description="Create a worker account under your business." />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              The provider-creates-worker wizard arrives in Sub-phase 1B. It runs the full worker
              wizard on the new worker&apos;s behalf and attaches them to your business via
              <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">parentUserId</code>.
            </p>
            <Link href="/team" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
              ← Back to team
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
