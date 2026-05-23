"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";

function statusTone(s: string): "emerald" | "amber" | "rose" | "slate" {
  switch (s) {
    case "VERIFIED": return "emerald";
    case "UPLOADED": return "amber";
    case "REJECTED": return "rose";
    case "EXPIRED": return "rose";
    default: return "slate";
  }
}

export default function DocumentsPage() {
  const { user } = useAuth();
  if (!user) return null;

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
            <CardDescription>{user.documents.length} on file.</CardDescription>
          </CardHeader>
          <CardContent>
            {user.documents.length === 0 ? (
              <EmptyState
                icon="📄"
                title="No documents yet"
                description="Compliance documents (police check, NDIS screening, insurance, etc.) will be uploaded during the registration wizard in Phase 1B."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {user.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{d.docType.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-500">{d.fileName} · uploaded {new Date(d.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {d.expiryDate ? (
                        <span className="text-xs text-slate-500">Expires {new Date(d.expiryDate).toLocaleDateString()}</span>
                      ) : null}
                      <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
