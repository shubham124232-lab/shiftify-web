import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function MessagesPage() {
  return (
    <>
      <PageHeader title="Messages" description="Per-job conversation threads." />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <EmptyState
              icon="💬"
              title="No active conversations"
              description="Each job gets its own thread once someone applies or accepts. The full messaging UI arrives in Sub-phase 1D."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
