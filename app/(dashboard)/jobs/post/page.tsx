import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function PostJobPage() {
  return (
    <>
      <PageHeader title="Post Support Request" description="Arriving in Sub-phase 1D." />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">
              The full posting flow arrives in Sub-phase 1D. Coordinators will see a
              &quot;Posting for which participant?&quot; selector and the chosen participant&apos;s
              primary address will auto-fill.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
