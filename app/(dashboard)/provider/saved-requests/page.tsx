"use client";

import { Suspense } from "react";
import { OpportunityBoard } from "@/components/provider/OpportunityBoard";

export default function ProviderSavedRequestsPage() {
  return (
    <Suspense fallback={null}>
      <OpportunityBoard mode="saved" crumb="Provider / Saved requests" title="Saved Requests" description="Participant and Support Coordinator requests your organisation can service." />
    </Suspense>
  );
}
