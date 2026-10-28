"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { ProviderStaffingWizard } from "@/components/jobs/post/ProviderStaffingWizard";
import { RequestDetailDialog } from "@/components/provider/RequestDialogs";
import { TeamMemberDialog } from "@/components/provider/TeamMemberDialog";


// Provider "Post a Shift" popup: choose how soon the worker is needed, then the staffing wizard opens in the same popup.
export function PostShiftDialog({ onClose }: { onClose: () => void }) {
  const [viewId, setViewId] = useState<string | null>(null);
  if (viewId) return <RequestDetailDialog jobId={viewId} own onClose={onClose} />;
  // The demo opens the staffing form straight away; the timing lane is chosen on its first step.
  return <ProviderStaffingWizard tier="RAPID" onClose={onClose} onViewRequest={setViewId} />;
}

// "Service or specific capacity?" chooser, shared by the dashboard Create popup and the Services & Capacity page.
export function ServiceOrCapacityDialog({ onClose, onBack, onPick }: { onClose: () => void; onBack?: () => void; onPick?: (kind: "service" | "capacity") => void }) {
  const router = useRouter();
  const go = (href: string) => { onClose(); router.push(href); };
  const pick = (kind: "service" | "capacity") => (onPick ? onPick(kind) : go(`/provider/services?wizard=${kind}`));
  return (
    <ModalShell title="Service or specific capacity?" onClose={onClose}>
      <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="m-0 text-base font-bold text-slate-900">Service availability</p>
          <p className="m-0 mt-2 text-sm text-slate-500">General service intake and ongoing referrals.</p>
          <Button className="mt-4 w-full" onClick={() => pick("service")}>Start service listing</Button>
        </div>
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="m-0 text-base font-bold text-slate-900">Capacity slot</p>
          <p className="m-0 mt-2 text-sm text-slate-500">Exact days, times and quantity you can deliver.</p>
          <Button className="mt-4 w-full" onClick={() => pick("capacity")}>Start capacity slot</Button>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4"><Button variant="outline" onClick={onBack ?? onClose}>{onBack ? "Back" : "Close"}</Button></div>
    </ModalShell>
  );
}

// Provider "Create" popup: the three things a Provider creates outside a staffing request.
export function CreateDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [chooser, setChooser] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const go = (href: string) => { onClose(); router.push(href); };

  if (addingMember) return <TeamMemberDialog onClose={onClose} onSaved={() => { onClose(); router.push("/provider/team-availability"); }} />;
  if (chooser) return <ServiceOrCapacityDialog onClose={onClose} onBack={() => setChooser(false)} />;

  return (
    <ModalShell title="Create" onClose={onClose}>
      <div className="flex flex-wrap gap-3 px-6 py-6">
        <Button onClick={() => setChooser(true)}>Post services / capacity</Button>
        <Button variant="outline" onClick={() => go("/provider/housing?wizard=housing")}>List housing vacancy</Button>
        <Button variant="outline" onClick={() => setAddingMember(true)}>Add internal team member</Button>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </ModalShell>
  );
}
