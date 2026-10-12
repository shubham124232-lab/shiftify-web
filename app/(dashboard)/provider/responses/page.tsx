"use client";

// Provider PR-D04 "Responses & Enquiries" — the combined inbox. The Provider menu now links to the focused
// pages (/provider/enquiries and /provider/my-responses); this combined view stays reachable by URL.
import { ResponsesInbox } from "@/components/provider/ResponsesInbox";

export default function ProviderResponsesPage() {
  return <ResponsesInbox view="all" />;
}
