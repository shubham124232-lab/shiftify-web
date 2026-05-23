import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function MyJobsPage() {
  return (
    <>
      <PageHeader title="My Jobs" description="Jobs you've posted, accepted, or been assigned." />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <EmptyState
              icon="📋"
              title="Nothing here yet"
              description="The marketplace loop arrives in Sub-phase 1D. Jobs you interact with will appear here."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
