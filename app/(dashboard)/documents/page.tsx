"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        description="Compliance documents for verification. Upload flow arrives in Phase 1B."
      />
      <div className="container-page py-8">
        <Card>
          <CardHeader>
            <CardTitle>My documents</CardTitle>
            <CardDescription>0 on file.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon="📄"
              title="No documents yet"
              description="Compliance documents (police check, NDIS screening, insurance, etc.) will be uploaded during the registration wizard in Phase 1B."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
