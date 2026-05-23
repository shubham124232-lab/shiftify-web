import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader title="All Users" description="Search and filter every account in the system." />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <EmptyState
              icon="👥"
              title="User directory coming in 1C"
              description="Once verification is wired up, this becomes a searchable directory with filters by role, status, and creation date."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
