import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Provider menu pages that are approved but not built yet (Provider demo, 2026-10-09).
const PAGES: Record<string, { title: string; note: string }> = {
  "calendar":      { title: "Calendar",      note: "Assignments and upcoming shifts by branch." },
  "service-lines": { title: "Service Lines", note: "The service capabilities your organisation offers." },
};

export default function ProviderComingSoonPage({ params }: { params: { slug: string } }) {
  const page = PAGES[params.slug] ?? { title: "This page", note: "" };
  return (
    <>
      <PageHeader title={page.title} />
      <div className="container-page py-8">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-lg font-semibold text-slate-900">Coming soon</p>
            {page.note && <p className="text-sm text-slate-500">{page.note}</p>}
            <p className="text-sm text-slate-500">We&apos;re still building this page.</p>
            <Link href="/dashboard/provider"><Button variant="outline" size="sm">Back to dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
