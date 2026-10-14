"use client";

import { Suspense } from "react";
import { OpportunityBoard } from "@/components/provider/OpportunityBoard";

export default function ProviderMatchedRequestsPage() {
  return (
    <Suspense fallback={null}>
      <OpportunityBoard mode="matched" crumb="Provider / Matched" title="Matched Requests" description="Explainable service and area matches. Confirm current capacity and required checks." />
    </Suspense>
  );
}
