import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function VerificationQueuePage() {
  return (
    <>
      <PageHeader
        title="Verification Queue"
        description="Pending users awaiting admin review."
      />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <EmptyState
              icon="📋"
              title="Queue is empty"
              description="Sub-phase 1C will activate this view. Users in PENDING status will appear here with their wizard data and uploaded documents."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
