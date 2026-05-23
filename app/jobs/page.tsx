// Public marketplace listing. Phase 1D will populate this with real data.
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Footer } from "@/components/layout/footer";
import { EmergencyFab } from "@/components/layout/emergency-fab";
import { Card, CardContent } from "@/components/ui/card";

export default function PublicJobsPage() {
  return (
    <>
      <MarketingNav />
      <main className="container-page py-16">
        <p className="text-sm font-medium uppercase tracking-wider text-brand-700">Live Marketplace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Active Shifts &amp; Opportunities
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Browse real-time support requests posted by participants across Australia.
        </p>

        <Card className="mt-10">
          <CardContent>
            <div className="py-16 text-center">
              <div className="mb-3 text-4xl" aria-hidden>🛒</div>
              <h3 className="text-lg font-semibold text-slate-900">Marketplace opens in Sub-phase 1D</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Once participants and coordinators start posting support requests, you&apos;ll be
                able to filter by suburb, category, and urgency right here.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
      <EmergencyFab />
    </>
  );
}
