"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function AuditLogPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.adminTier !== "SUPER_ADMIN") {
    return (
      <>
        <PageHeader title="Audit Log" />
        <div className="container-page py-8">
          <Card>
            <CardContent>
              <p className="text-sm text-slate-600">
                Audit log access is restricted to SUPER_ADMIN users. Your tier is{" "}
                <span className="font-semibold">{user.adminTier ?? "—"}</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Audit Log" description="Every admin action with timestamp, admin, target, and reason." />
      <div className="container-page py-8">
        <Card>
          <CardContent>
            <EmptyState
              icon="📜"
              title="No audit entries yet"
              description="Once admins start approving, rejecting, or suspending users in Phase 1C, every action will be recorded here."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
