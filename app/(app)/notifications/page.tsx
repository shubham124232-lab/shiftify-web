import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" description="All your in-app alerts in one place." />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <EmptyState
              icon="🔔"
              title="No notifications yet"
              description="When admins approve your account, when a job is accepted, or when someone messages you, you'll see it here."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
