"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Clock, CalendarDays, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/jobs/post/shared";
import { ProviderStaffingWizard } from "@/components/jobs/post/ProviderStaffingWizard";
import { RequestDetailDialog } from "@/components/provider/RequestDialogs";
import { TeamMemberDialog } from "@/components/provider/TeamMemberDialog";
import { TIER_META, type PostingTier } from "@/lib/types/posting";

const LANES: { tier: PostingTier; icon: React.ReactNode; accent: string }[] = [
  { tier: "RAPID",       icon: <Zap className="h-5 w-5" />,          accent: "#FF2340" },
  { tier: "URGENT",      icon: <Clock className="h-5 w-5" />,        accent: "#FF8500" },
  { tier: "LAST_MINUTE", icon: <Timer className="h-5 w-5" />,        accent: "#00A06A" },
  { tier: "ROUTINE",     icon: <CalendarDays className="h-5 w-5" />, accent: "#547FC4" },
];

// Provider "Post a Shift" popup: choose how soon the worker is needed, then the staffing wizard opens in the same popup.
export function PostShiftDialog({ onClose }: { onClose: () => void }) {
  const [tier, setTier] = useState<PostingTier | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  if (viewId) return <RequestDetailDialog jobId={viewId} own onClose={onClose} />;
  if (tier) return <ProviderStaffingWizard tier={tier} onClose={onClose} onBackToLanes={() => setTier(null)} onViewRequest={setViewId} />;
  return (
    <ModalShell title="Post a staffing request" subtitle="Start with timing, then choose internal or external distribution." onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="m-0 mb-4 text-lg font-bold text-slate-900">How soon do you need a worker?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {LANES.map(({ tier: t, icon, accent }) => {
            const meta = TIER_META[t];
            return (
              <button key={t} type="button" onClick={() => setTier(t)}
                className="rounded-xl border border-slate-200 px-4 py-4 text-left transition-colors hover:border-brand-400 hover:bg-brand-50/40">
                <span className="flex items-center gap-2 text-base font-semibold text-slate-900"><span style={{ color: accent }}>{icon}</span>{meta.label}</span>
                <span className="mt-1 block text-sm text-slate-500">{meta.timing}</span>
              </button>
            );
          })}
        </div>
        <p className="m-0 mt-4 text-xs text-slate-500">Urgency never costs an extra Provider action. Drafts and internal checks are free.</p>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </ModalShell>
  );
}

// "Service or specific capacity?" chooser, shared by the dashboard Create popup and the Services & Capacity page.
export function ServiceOrCapacityDialog({ onClose, onBack }: { onClose: () => void; onBack?: () => void }) {
  const router = useRouter();
  const go = (href: string) => { onClose(); router.push(href); };
  return (
    <ModalShell title="Service or specific capacity?" onClose={onClose}>
      <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="m-0 text-base font-bold text-slate-900">Service availability</p>
          <p className="m-0 mt-2 text-sm text-slate-500">General service intake and ongoing referrals.</p>
          <Button className="mt-4 w-full" onClick={() => go("/provider/post-service")}>Start service listing</Button>
        </div>
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="m-0 text-base font-bold text-slate-900">Capacity slot</p>
          <p className="m-0 mt-2 text-sm text-slate-500">Exact days, times and quantity you can deliver.</p>
          <Button className="mt-4 w-full" onClick={() => go("/provider/post-service")}>Start capacity slot</Button>
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
        <Button variant="outline" onClick={() => go("/provider/sil-vacancy")}>List housing vacancy</Button>
        <Button variant="outline" onClick={() => setAddingMember(true)}>Add internal team member</Button>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4"><Button variant="outline" onClick={onClose}>Close</Button></div>
    </ModalShell>
  );
}
