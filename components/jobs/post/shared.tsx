"use client";

// Shared UI building blocks for the 4 participant posting journeys
// (Rapid/Urgent/Last-Minute/Routine). Each journey page composes these the
// same way the old flat jobs/post/page.tsx composed its own Step1..Step8 —
// just shared across 4 files instead of duplicated, since all 4 journeys ask
// nearly the same service/safety/funding/requirements questions.

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SERVICE_CATALOGUE, getCatalogueCategory, type CatalogueCategory } from "@/lib/constants/support-catalogue";
import type {
  CatalogueSelection, SafetyChecklist, FundingChoice, WorkerRequirements, PersonReceivingSupport,
  MultiCatalogueSelection, RoutinePreferences, RoutinePreferenceKey, RoutineWorkerChoice, PostingTier,
} from "@/lib/types/posting";
import { ROUTINE_PREFERENCE_LABELS, ROUTINE_PREFERENCE_DETAIL_KEYS } from "@/lib/types/posting";

export const inp =
  "w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";
export const lbl = "block text-xs font-semibold text-slate-700 mb-1";

// ─── Wizard shell (progress bar + card + back/continue footer) ────────────────

export function WizardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center">
          <div className={cn("flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0",
            i === step ? "bg-brand-600 text-white" : i < step ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-400")}>
            {i < step ? "✓" : i + 1}
          </div>
          {i < total - 1 && <div className={cn("h-0.5 w-6 shrink-0", i < step ? "bg-brand-400" : "bg-slate-200")} />}
        </div>
      ))}
    </div>
  );
}

export function WizardScreen({
  tierLabel, screenTitle, step, total, error, belowError, children, onBack, onNext, nextLabel, nextDisabled, saving,
}: {
  tierLabel: string;
  screenTitle: string;
  step: number;
  total: number;
  error?: string | null;
  belowError?: React.ReactNode;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  saving?: boolean;
}) {
  return (
    <>
      <PageHeader title={tierLabel} description={screenTitle} />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <WizardProgress step={step} total={total} />
        {error && !belowError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        {belowError && <div className="mb-4">{belowError}</div>}
        <Card><CardContent className="py-6">{children}</CardContent></Card>
        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={onBack} disabled={step === 0}>Back</Button>
          <Button onClick={onNext} disabled={nextDisabled || saving} loading={saving}>{nextLabel}</Button>
        </div>
      </div>
    </>
  );
}

// ─── Small shared controls ──────────────────────────────────────────────────────

export function RadioCards<T extends string>({
  options, value, onChange, columns = 1,
}: { options: { v: T; l: string; d?: string }[]; value: T | undefined; onChange: (v: T) => void; columns?: number }) {
  return (
    <div className={cn("grid gap-3", columns > 1 ? `grid-cols-${columns}` : "")}>
      {options.map(({ v, l, d }) => (
        <label key={v} className={cn(
          "flex items-start gap-2 cursor-pointer border rounded-lg px-4 py-3 text-sm font-medium transition-colors",
          value === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50",
        )} onClick={() => onChange(v)}>
          <input type="radio" className="sr-only" checked={value === v} onChange={() => onChange(v)} />
          <div>
            <div>{l}</div>
            {d && <div className="text-xs text-slate-400 mt-0.5">{d}</div>}
          </div>
        </label>
      ))}
    </div>
  );
}

export function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

export function ReviewRow({ label, value, onEdit }: { label: string; value: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-xs font-semibold text-slate-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 text-right flex items-center justify-end gap-2">
        {value || <span className="text-slate-300">none</span>}
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-xs font-medium text-brand-600 hover:text-brand-700 underline shrink-0">
            Edit
          </button>
        )}
      </span>
    </div>
  );
}

// ─── Privacy / address-release notice shown near the info-sharing checkbox ────

export function AddressReleaseNotice() {
  return (
    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
      Your exact address is never shown up front. It's released to a worker or provider only after you've both mutually confirmed the request — before that, they see your suburb and postcode only.
    </p>
  );
}

// ─── Posting-authority confirmation (Coordinator posting for a connected, ─────
// non-managed participant — SC-P01). Only relevant when PersonStep resolves to
// an EXISTING_PARTICIPANT that is a *connection* (canPostRequests already true
// server-side to have reached this step), not a fully managed sub-account.
// Doc requires 3 choices: self-certify / request participant approval / choose
// another participant. "Request approval" doesn't change canPostRequests — it's
// a one-off ping (postingApprovalStatus on the connection) the coordinator can
// send instead of self-certifying, and posting is blocked until it resolves.

type PostingApprovalStatus = "PENDING" | "APPROVED" | "DECLINED" | null;

export function PostingAuthorityStep({
  participantUserId, participantName, onConfirm, onChooseAnother,
}: { participantUserId: string; participantName: string; onConfirm: () => void; onChooseAnother: () => void }) {
  const [mode, setMode] = useState<"choice" | "requesting" | "waiting" | "declined">("choice");
  const [error, setError] = useState<string | null>(null);

  async function requestApproval() {
    setMode("requesting");
    setError(null);
    try {
      await api.post("/coordinator-connections/request-posting-approval", { participantUserId });
      setMode("waiting");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't send the approval request.");
      setMode("choice");
    }
  }

  useEffect(() => {
    if (mode !== "waiting") return;
    const check = () => {
      api.get<{ connections: { participant: { id: string }; postingApprovalStatus: PostingApprovalStatus }[] }>("/coordinator-connections")
        .then((r) => {
          const conn = r.connections.find((c) => c.participant.id === participantUserId);
          if (conn?.postingApprovalStatus === "APPROVED") onConfirm();
          else if (conn?.postingApprovalStatus === "DECLINED") setMode("declined");
        })
        .catch(() => {});
    };
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [mode, participantUserId, onConfirm]);

  if (mode === "waiting" || mode === "requesting") {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm font-semibold text-slate-800">Waiting for {participantName}&rsquo;s approval</p>
        <p className="text-xs text-slate-500">
          We've asked {participantName} to approve you posting this request on their behalf. This will update automatically once they respond.
        </p>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <Button variant="outline" onClick={onChooseAnother} className="w-full">Choose another participant</Button>
        </div>
      </div>
    );
  }

  if (mode === "declined") {
    return (
      <div className="space-y-5 text-center">
        <p className="text-sm font-semibold text-slate-800">{participantName} declined this request</p>
        <p className="text-xs text-slate-500">You can ask again, or post for a different participant.</p>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <Button onClick={requestApproval} className="w-full">Request approval again</Button>
          <Button variant="outline" onClick={onChooseAnother} className="w-full">Choose another participant</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-center">
      <p className="text-sm font-semibold text-slate-800">
        Can you post and manage this request for {participantName}?
      </p>
      <p className="text-xs text-slate-500">
        You're connected to this participant. Confirm you're authorised to post and manage support requests on their behalf, or ask them to approve this request first.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        <Button onClick={onConfirm} className="w-full">Yes, I&rsquo;m authorised</Button>
        <Button variant="outline" onClick={requestApproval} className="w-full">Request participant approval</Button>
        <Button variant="ghost" onClick={onChooseAnother} className="w-full">Choose another participant</Button>
      </div>
    </div>
  );
}

// ─── Single Shift Pass prompt (SC-S02/S06 — Pricing V2 §6) ─────────────────────
// Shown in place of a raw error when createJob rejects with SUBSCRIPTION_LIMIT:
// the Coordinator has used their 10 free introductory posts and needs either a
// subscription or a one-time Shift Pass to post again.

export function ShiftPassPrompt({ onPurchased, onDismiss }: { onPurchased: () => void; onDismiss: () => void }) {
  const [screen, setScreen] = useState<"choice" | "purchase">("choice");
  const [purchasing, setPurchasing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function purchase() {
    setPurchasing(true);
    setErr(null);
    try {
      await api.post("/subscriptions/shift-pass", {});
      onPurchased();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Purchase failed.");
    } finally {
      setPurchasing(false);
    }
  }

  if (screen === "purchase") {
    return (
      <div className="space-y-4 text-center border border-slate-200 rounded-xl p-5 bg-slate-50">
        <p className="text-sm font-semibold text-slate-800">Single Shift Pass</p>
        <div className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3 bg-white text-left">
          <span className="text-sm text-slate-700">One new request or agreed chargeable action</span>
          <span className="text-sm font-bold text-slate-900">$19.99</span>
        </div>
        <p className="text-xs text-slate-500">Direct Connect is not included.</p>
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <Button onClick={purchase} disabled={purchasing} className="w-full">
            {purchasing ? "Processing…" : "Purchase for $19.99"}
          </Button>
          <Button variant="outline" onClick={() => setScreen("choice")} className="w-full">Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center border border-slate-200 rounded-xl p-5 bg-slate-50">
      <p className="text-sm font-semibold text-slate-800">You've used your 10 introductory job posts</p>
      <p className="text-xs text-slate-500">Choose a subscription plan for ongoing posting, or buy a Single Shift Pass to post just this one request.</p>
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        <a href="/subscription"><Button className="w-full">Choose a subscription</Button></a>
        <Button variant="outline" onClick={() => setScreen("purchase")} className="w-full">Purchase one Single Shift Pass — $19.99</Button>
        <Button variant="ghost" onClick={onDismiss} className="w-full">Cancel</Button>
      </div>
    </div>
  );
}

// ─── "Who needs support" step (shared) ─────────────────────────────────────────

function SomeoneElseFields({ value, onChange }: { value: PersonReceivingSupport; onChange: (p: Partial<PersonReceivingSupport>) => void }) {
  return (
    <div className="space-y-3 border border-brand-100 rounded-xl p-4 bg-brand-50/30">
      <div>
        <label className={lbl}>Preferred name *</label>
        <input className={inp} value={value.someoneElseName} onChange={(e) => onChange({ someoneElseName: e.target.value })} placeholder="e.g. Alex" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Age group</label>
          <select className={inp} value={value.someoneElseAgeGroup} onChange={(e) => onChange({ someoneElseAgeGroup: e.target.value })}>
            <option value="">Select…</option>
            <option value="Child">Child</option>
            <option value="Teen">Teen</option>
            <option value="Adult">Adult</option>
            <option value="Older adult">Older adult</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Phone (optional)</label>
          <input className={inp} type="tel" value={value.someoneElsePhone} onChange={(e) => onChange({ someoneElsePhone: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export function PersonStep({
  value, onChange, tierLabel, isCoordinator, authorityConfirmed, onAuthorityChange,
}: {
  value: PersonReceivingSupport; onChange: (p: Partial<PersonReceivingSupport>) => void; tierLabel: string; isCoordinator?: boolean;
  // SC-P01 — required once a Coordinator picks a *connected* (non-managed) participant.
  authorityConfirmed?: boolean; onAuthorityChange?: (v: boolean) => void;
}) {
  const [participants, setParticipants] = useState<{ id: string; name: string; connected?: boolean }[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    if (!isCoordinator) return;
    setLoadingParticipants(true);
    Promise.all([
      api.get<{ users: { id: string; name: string }[] }>("/linking/participants")
        .catch(() => ({ users: [] })),
      api.get<{ connections: { status: string; canPostRequests: boolean; participant: { id: string; name: string } }[] }>("/coordinator-connections")
        .catch(() => ({ connections: [] })),
    ]).then(([managed, conns]) => {
      const managedList = (managed.users ?? []).map((u) => ({ id: u.id, name: u.name }));
      const connectedList = (conns.connections ?? [])
        .filter((c) => c.status === "ACCEPTED" && c.canPostRequests)
        .map((c) => ({ id: c.participant.id, name: c.participant.name, connected: true }));
      setParticipants([...managedList, ...connectedList]);
    }).finally(() => setLoadingParticipants(false));
  }, [isCoordinator]);

  if (isCoordinator) {
    // A coordinator is never "Me" — only an existing managed participant or a new one.
    const coordWho = value.who === "SOMEONE_ELSE" || value.who === "EXISTING_PARTICIPANT" ? value.who : undefined;
    return (
      <div className="space-y-5">
        <label className={lbl}>Who needs this {tierLabel}?</label>
        <RadioCards
          value={coordWho}
          onChange={(who) => onChange({ who })}
          options={[
            { v: "EXISTING_PARTICIPANT", l: "One of my existing participants" },
            { v: "SOMEONE_ELSE", l: "A new participant" },
          ]}
        />
        {value.who === "EXISTING_PARTICIPANT" && (
          <div>
            <label className={lbl}>Select participant *</label>
            <select className={inp} value={value.existingParticipantId} onChange={(e) => {
              const picked = participants.find((p) => p.id === e.target.value);
              onChange({
                existingParticipantId: e.target.value,
                existingParticipantIsConnection: !!picked?.connected,
                existingParticipantName: picked?.name ?? "",
              });
            }}>
              <option value="">{loadingParticipants ? "Loading…" : "Select a participant…"}</option>
              {participants.map((p) => <option key={p.id} value={p.id}>{p.name}{p.connected ? " (connected)" : ""}</option>)}
            </select>
            {!loadingParticipants && participants.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">No participants yet — add one from the Participant Cases page, or choose &ldquo;A new participant&rdquo;.</p>
            )}
          </div>
        )}
        {value.who === "EXISTING_PARTICIPANT" && value.existingParticipantId && value.existingParticipantIsConnection && !authorityConfirmed && (
          <PostingAuthorityStep
            participantUserId={value.existingParticipantId}
            participantName={value.existingParticipantName || "this participant"}
            onConfirm={() => onAuthorityChange?.(true)}
            onChooseAnother={() => {
              onAuthorityChange?.(false);
              onChange({ existingParticipantId: "", existingParticipantIsConnection: false, existingParticipantName: "" });
            }}
          />
        )}
        {value.who === "EXISTING_PARTICIPANT" && value.existingParticipantId && value.existingParticipantIsConnection && authorityConfirmed && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            ✓ Confirmed — you're authorised to post for {value.existingParticipantName || "this participant"}.
          </p>
        )}
        {value.who === "SOMEONE_ELSE" && <SomeoneElseFields value={value} onChange={onChange} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <label className={lbl}>Who needs this {tierLabel}?</label>
      <RadioCards
        value={value.who}
        onChange={(who) => onChange({ who })}
        options={[{ v: "ME", l: "Me" }, { v: "SOMEONE_ELSE", l: "Someone else" }]}
      />
      {value.who === "SOMEONE_ELSE" && <SomeoneElseFields value={value} onChange={onChange} />}
    </div>
  );
}

// ─── Service category picker (category tiles only) ────────────────────────────
// Single-select for Rapid/Urgent/Last-Minute (R-03/U-03/L-03); multi-select for
// Routine (O-03, "primary service required; additional services allowed").

export function CategoryPickerStep({
  selectedIds, onToggle, multi, questionLabel = "What support is needed?",
}: { selectedIds: string[]; onToggle: (id: string) => void; multi?: boolean; questionLabel?: string }) {
  return (
    <div>
      <label className={lbl}>{questionLabel}</label>
      {multi && <p className="text-xs text-slate-400 mb-2">Select a primary service — you may add more.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SERVICE_CATALOGUE.map((c) => (
          <button key={c.id} type="button" onClick={() => onToggle(c.id)}
            className={cn("border rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
              selectedIds.includes(c.id) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Follow-up question block (tasks + note + category questions) — the part ──
// of the old catalogue step reused by both the single-category (R/U/L) and
// multi-category (Routine) tasks screens.

export function CategoryFollowupsBlock({
  category, tasks, onToggleTask, answers, onAnswer, tasksLabel = "Select the relevant task(s)",
}: {
  category: CatalogueCategory;
  tasks: string[];
  onToggleTask: (task: string) => void;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  tasksLabel?: string;
}) {
  return (
    <div className="space-y-4 border border-slate-100 rounded-xl p-4">
      <p className="text-sm font-semibold text-slate-700">{category.label}</p>
      <div>
        <label className={lbl}>{tasksLabel}</label>
        <div className="flex flex-wrap gap-2">
          {category.tasks.map((t) => (
            <button key={t} type="button" onClick={() => onToggleTask(t)}
              className={cn("h-8 px-3 rounded-full border text-xs font-medium transition-colors",
                tasks.includes(t) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {category.note && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{category.note}</p>}
      {category.questions.length > 0 && (
        <div className="space-y-4 border border-slate-100 rounded-xl p-4 bg-slate-50">
          {category.questions.map((q) => (
            <div key={q.id}>
              <label className={lbl}>{q.label}</label>
              {q.type === "yesno" ? (
                <div className="flex gap-3">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className={cn("flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-1.5 text-sm transition-colors",
                      answers[q.id] === opt ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                      <input type="radio" className="sr-only" checked={answers[q.id] === opt} onChange={() => onAnswer(q.id, opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : q.type === "select" ? (
                <select className={inp} value={answers[q.id] ?? ""} onChange={(e) => onAnswer(q.id, e.target.value)}>
                  <option value="">Select…</option>
                  {q.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input className={inp} value={answers[q.id] ?? ""} onChange={(e) => onAnswer(q.id, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single-category tasks step (R-04/U-04/L-04) ───────────────────────────────

export function TasksStep({
  value, onChange, showOtherTask = false, otherTaskLabel = "Other essential task (optional)",
}: { value: CatalogueSelection; onChange: (v: Partial<CatalogueSelection>) => void; showOtherTask?: boolean; otherTaskLabel?: string }) {
  const category = getCatalogueCategory(value.categoryId);
  if (!category) return <p className="text-sm text-slate-400">Go back and choose a support service first.</p>;

  function toggleTask(task: string) {
    if (!category) return;
    const tasks = value.tasks.includes(task) ? value.tasks.filter((t) => t !== task) : [...value.tasks, task];
    onChange({ tasks });
  }

  return (
    <div className="space-y-4">
      <CategoryFollowupsBlock
        category={category}
        tasks={value.tasks}
        onToggleTask={toggleTask}
        answers={value.answers}
        onAnswer={(id, v) => onChange({ answers: { ...value.answers, [id]: v } })}
        tasksLabel="Select the relevant task(s) from the chosen service"
      />
      {showOtherTask && (
        <div>
          <label className={lbl}>{otherTaskLabel}</label>
          <input className={inp} value={value.otherTask} onChange={(e) => onChange({ otherTask: e.target.value })} />
        </div>
      )}
    </div>
  );
}

// ─── Multi-category tasks + goals step (Routine O-04) ──────────────────────────

const ROUTINE_GOALS = [
  "Build independence", "Maintain daily routine", "Access community/social activities",
  "Attend work/study/appointments", "Support health and wellbeing", "Give informal supports a break", "Other goal",
];

export function MultiCategoryTasksStep({
  value, onChange,
}: { value: MultiCatalogueSelection; onChange: (v: Partial<MultiCatalogueSelection>) => void }) {
  function toggleTask(categoryId: string, task: string) {
    const current = value.tasksByCategory[categoryId] ?? [];
    const tasks = current.includes(task) ? current.filter((t) => t !== task) : [...current, task];
    onChange({ tasksByCategory: { ...value.tasksByCategory, [categoryId]: tasks } });
  }
  function toggleGoal(g: string) {
    onChange({ goals: value.goals.includes(g) ? value.goals.filter((x) => x !== g) : [...value.goals, g] });
  }

  if (value.categoryIds.length === 0) {
    return <p className="text-sm text-slate-400">Go back and choose at least one support service first.</p>;
  }

  return (
    <div className="space-y-5">
      {value.categoryIds.map((id) => {
        const category = getCatalogueCategory(id);
        if (!category) return null;
        return (
          <CategoryFollowupsBlock
            key={id}
            category={category}
            tasks={value.tasksByCategory[id] ?? []}
            onToggleTask={(t) => toggleTask(id, t)}
            answers={value.answersByCategory[id] ?? {}}
            onAnswer={(qid, v) => onChange({ answersByCategory: { ...value.answersByCategory, [id]: { ...(value.answersByCategory[id] ?? {}), [qid]: v } } })}
            tasksLabel="Select all service tasks"
          />
        );
      })}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <label className={lbl}>What would you like support with? (goals, optional)</label>
        <div className="flex flex-wrap gap-2">
          {ROUTINE_GOALS.map((g) => (
            <button key={g} type="button" onClick={() => toggleGoal(g)}
              className={cn("h-8 px-3 rounded-full border text-xs font-medium transition-colors",
                value.goals.includes(g) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {g}
            </button>
          ))}
        </div>
        <textarea className={cn(inp, "h-auto py-2")} rows={3} maxLength={600} value={value.description}
          onChange={(e) => onChange({ description: e.target.value })} placeholder="Optional description (max 600 characters)" />
      </div>
    </div>
  );
}

// ─── Safety checklist step (shared) ────────────────────────────────────────────

const SAFETY_ITEMS: { key: keyof Omit<SafetyChecklist, "none" | "otherDetail">; label: string }[] = [
  { key: "twoPersonSupport", label: "Two-person support is required" },
  { key: "manualTransfer", label: "Manual transfer or hoist is involved" },
  { key: "behaviourPlan", label: "A behaviour support plan or regulated restrictive practice may be relevant" },
  { key: "medicationMonitoring", label: "Medication or health monitoring is involved" },
  { key: "accessIssues", label: "There are pets, smoking, stairs or access issues" },
];

const ROUTINE_SAFETY_ITEMS: { key: keyof Omit<SafetyChecklist, "none" | "otherDetail" | "other" | "privateDetailsSharing">; label: string }[] = [
  { key: "communicationInstructions", label: "Communication instructions" },
  { key: "mobilityInstructions", label: "Mobility/equipment instructions" },
  { key: "mealtimePlan", label: "Mealtime plan" },
  { key: "allergyInfo", label: "Allergy information" },
  { key: "homeAccessInfo", label: "Home-access information" },
];

export function SafetyStep({ value, onChange, questionLabel = "Is there anything essential a worker must know before accepting?", routineExtras }: {
  value: SafetyChecklist; onChange: (v: Partial<SafetyChecklist>) => void; questionLabel?: string; routineExtras?: boolean;
}) {
  return (
    <div className="space-y-4">
      <label className={lbl}>{questionLabel}</label>
      <CheckboxRow checked={value.none} onChange={(v) => onChange({ none: v, ...(v ? { twoPersonSupport: false, manualTransfer: false, behaviourPlan: false, medicationMonitoring: false, accessIssues: false, other: false, communicationInstructions: false, mobilityInstructions: false, mealtimePlan: false, allergyInfo: false, homeAccessInfo: false } : {}) })} label="No special safety information" />
      <div className="space-y-2 pl-1">
        {SAFETY_ITEMS.map(({ key, label }) => (
          <CheckboxRow key={key} checked={value[key] as boolean} onChange={(v) => onChange({ [key]: v, none: false } as Partial<SafetyChecklist>)} label={label} />
        ))}
        <CheckboxRow checked={value.other} onChange={(v) => onChange({ other: v, none: false })} label="Other essential information" />
        {value.other && (
          <input className={inp} value={value.otherDetail} onChange={(e) => onChange({ otherDetail: e.target.value })} placeholder="Briefly describe" />
        )}
        {routineExtras && ROUTINE_SAFETY_ITEMS.map(({ key, label }) => (
          <CheckboxRow key={key} checked={!!value[key]} onChange={(v) => onChange({ [key]: v, none: false } as Partial<SafetyChecklist>)} label={label} />
        ))}
      </div>
      {routineExtras && (
        <div>
          <label className={lbl}>When should private details be shared?</label>
          <RadioCards
            value={value.privateDetailsSharing ?? ""}
            onChange={(v) => onChange({ privateDetailsSharing: v })}
            options={[{ v: "AFTER_SHORTLIST", l: "After shortlist" }, { v: "AFTER_CONFIRMATION", l: "After confirmation" }]}
          />
        </div>
      )}
      <p className="text-xs text-slate-400">Private documents/instructions can be shared after a worker/provider is selected.</p>
    </div>
  );
}

// ─── Worker requirements step (shared) ─────────────────────────────────────────

export function RequirementsStep({
  value, onChange, showWorkerChoice,
  questionLabel = "What is essential for this request?",
  genderLabel = "Worker gender required for personal/privacy/cultural reasons",
  languageLabel = "Specific language/Auslan",
  qualificationLabel = "Relevant qualification or participant-specific training",
}: {
  value: WorkerRequirements; onChange: (v: Partial<WorkerRequirements>) => void; showWorkerChoice?: boolean;
  questionLabel?: string; genderLabel?: string; languageLabel?: string; qualificationLabel?: string;
}) {
  return (
    <div className="space-y-4">
      {showWorkerChoice && (
        <div className="pb-3 border-b border-slate-100">
          <label className={lbl}>Independent support worker, provider organisation, or either? *</label>
          <RadioCards
            value={value.workerOrProvider ?? undefined}
            onChange={(v) => onChange({ workerOrProvider: v })}
            options={[{ v: "WORKER", l: "Independent support worker" }, { v: "PROVIDER", l: "Provider organisation" }, { v: "EITHER", l: "Either" }]}
          />
        </div>
      )}
      <label className={lbl}>{questionLabel}</label>
      <CheckboxRow checked={value.none} onChange={(v) => onChange({ none: v })} label="No additional requirement" />
      <CheckboxRow checked={value.genderRequired} onChange={(v) => onChange({ genderRequired: v, none: false })} label={genderLabel} />
      {value.genderRequired && (
        <div className="grid grid-cols-2 gap-3 pl-6">
          <select className={inp} value={value.genderValue} onChange={(e) => onChange({ genderValue: e.target.value })}>
            <option value="">Select gender…</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="NON_BINARY">Non-binary</option>
          </select>
          <input className={inp} value={value.genderReason} onChange={(e) => onChange({ genderReason: e.target.value })} placeholder="Reason category (optional)" />
        </div>
      )}
      <CheckboxRow checked={value.driversLicence} onChange={(v) => onChange({ driversLicence: v, none: false })} label="Driver's licence" />
      <CheckboxRow checked={value.vehicle} onChange={(v) => onChange({ vehicle: v, none: false })} label="Worker vehicle" />
      <CheckboxRow checked={value.wheelchairVehicle} onChange={(v) => onChange({ wheelchairVehicle: v, none: false })} label="Wheelchair-accessible vehicle" />
      <CheckboxRow checked={value.language} onChange={(v) => onChange({ language: v, none: false })} label={languageLabel} />
      {value.language && (
        <input className={cn(inp, "ml-6 w-64")} value={value.languageValue} onChange={(e) => onChange({ languageValue: e.target.value })} placeholder="Which language?" />
      )}
      <CheckboxRow checked={value.qualification} onChange={(v) => onChange({ qualification: v, none: false })} label={qualificationLabel} />
      {value.qualification && (
        <input className={cn(inp, "ml-6 w-64")} value={value.qualificationValue} onChange={(e) => onChange({ qualificationValue: e.target.value })} placeholder="Which qualification?" />
      )}
      <CheckboxRow checked={value.twoWorkers} onChange={(v) => onChange({ twoWorkers: v, none: false })} label="Two workers required" />
      <CheckboxRow checked={value.certIIIOrAbove} onChange={(v) => onChange({ certIIIOrAbove: v, none: false })} label="Cert III or above" />
      <CheckboxRow checked={value.restrictivePractices} onChange={(v) => onChange({ restrictivePractices: v, none: false })} label="Restrictive practices" />
      <CheckboxRow checked={value.firstAid} onChange={(v) => onChange({ firstAid: v, none: false })} label="First aid" />
      <CheckboxRow checked={value.alliedHealth} onChange={(v) => onChange({ alliedHealth: v, none: false })} label="Allied health background" />
    </div>
  );
}

// ─── Funding + rate step (shared) ──────────────────────────────────────────────

export function FundingStep({ value, onChange }: { value: FundingChoice; onChange: (v: Partial<FundingChoice>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>How will this support be paid for?</label>
        <RadioCards
          value={value.fundingType}
          onChange={(v) => onChange({ fundingType: v })}
          options={[
            { v: "SELF_MANAGED", l: "Self-managed NDIS funding" },
            { v: "PLAN_MANAGED", l: "Plan-managed NDIS funding" },
            { v: "NDIA_MANAGED", l: "NDIA-managed funding" },
            { v: "PRIVATE", l: "Privately paid" },
            { v: "UNSURE", l: "I'm not sure" },
          ]}
        />
      </div>
      {value.fundingType === "PLAN_MANAGED" && (
        <div>
          <label className={lbl}>Plan Manager name (optional)</label>
          <input className={inp} value={value.planManagerName} onChange={(e) => onChange({ planManagerName: e.target.value })} />
        </div>
      )}
      <div>
        <label className={lbl}>Rate choice</label>
        <RadioCards
          value={value.rateChoice}
          onChange={(v) => onChange({ rateChoice: v })}
          options={[
            { v: "NDIS_RATE", l: "Use the applicable NDIS rate" },
            { v: "OFFERED_RATE", l: "Enter an offered hourly rate" },
            { v: "ASK_WORKERS", l: "Ask workers/providers to provide their rate" },
            { v: "DECIDE_LATER", l: "Decide after connecting" },
          ]}
        />
      </div>
      {value.rateChoice === "OFFERED_RATE" && (
        <div className="w-40">
          <label className={lbl}>Offered hourly rate (AUD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
            <input type="number" min="0" step="0.5" className={cn(inp, "pl-7")} value={value.offeredRate} onChange={(e) => onChange({ offeredRate: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Routine-only: funding step split into two screens (O-10 / O-11) ───────────

export function FundingTypeStep({ value, onChange }: { value: FundingChoice; onChange: (v: Partial<FundingChoice>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>How will this support be paid for?</label>
        <RadioCards
          value={value.fundingType}
          onChange={(v) => onChange({ fundingType: v })}
          options={[
            { v: "SELF_MANAGED", l: "Self-managed NDIS funding" },
            { v: "PLAN_MANAGED", l: "Plan-managed NDIS funding" },
            { v: "NDIA_MANAGED", l: "NDIA-managed funding" },
            { v: "PRIVATE", l: "Privately paid" },
            { v: "UNSURE", l: "I'm not sure" },
          ]}
        />
      </div>
      <CheckboxRow checked={!!value.differentPartsManaged} onChange={(v) => onChange({ differentPartsManaged: v })} label="Different parts are managed differently" />
      {value.fundingType === "PLAN_MANAGED" && (
        <div>
          <label className={lbl}>Plan Manager name (optional)</label>
          <input className={inp} value={value.planManagerName} onChange={(e) => onChange({ planManagerName: e.target.value })} />
        </div>
      )}
      <p className="text-xs text-slate-400">NDIS number, plan dates and plan balance are not requested here.</p>
    </div>
  );
}

export function RateStep({ value, onChange }: { value: FundingChoice; onChange: (v: Partial<FundingChoice>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>How would you like to set the rate?</label>
        <RadioCards
          value={value.rateChoice}
          onChange={(v) => onChange({ rateChoice: v })}
          options={[
            { v: "NDIS_RATE", l: "Use the applicable NDIS rate" },
            { v: "OFFERED_RATE", l: "Enter an offered hourly rate" },
            { v: "ASK_WORKERS", l: "Ask workers/providers to provide their rate" },
            { v: "DECIDE_LATER", l: "Decide after connecting" },
          ]}
        />
      </div>
      {value.rateChoice === "OFFERED_RATE" && (
        <div className="w-40">
          <label className={lbl}>Offered hourly rate (AUD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
            <input type="number" min="0" step="0.5" className={cn(inp, "pl-7")} value={value.offeredRate} onChange={(e) => onChange({ offeredRate: e.target.value })} />
          </div>
        </div>
      )}
      <div>
        <label className={lbl}>Notes about agreed travel, evening, weekend, public-holiday or cancellation arrangements (optional)</label>
        <textarea className={cn(inp, "h-auto py-2")} rows={2} value={value.rateNotes ?? ""} onChange={(e) => onChange({ rateNotes: e.target.value })} />
      </div>
    </div>
  );
}

// ─── Routine-only: worker/provider choice (O-07) ────────────────────────────────

export function RoutineWorkerStep({ value, onChange }: { value: RoutineWorkerChoice; onChange: (v: RoutineWorkerChoice) => void }) {
  return (
    <div>
      <label className={lbl}>Who are you looking for?</label>
      <RadioCards
        value={value}
        onChange={onChange}
        options={[
          { v: "WORKER", l: "Independent support worker" },
          { v: "PROVIDER", l: "Provider organisation" },
          { v: "EITHER", l: "Either" },
          { v: "ONE_REGULAR", l: "One regular worker" },
          { v: "SMALL_TEAM", l: "A small consistent team" },
          { v: "NO_PREFERENCE", l: "No preference" },
        ]}
      />
    </div>
  );
}

// ─── Routine-only: match preferences with Essential/Preferred tagging (O-08) ───

export function RoutinePreferencesStep({ value, onChange }: { value: RoutinePreferences; onChange: (key: RoutinePreferenceKey, v: Partial<RoutinePreferences[RoutinePreferenceKey]>) => void }) {
  return (
    <div className="space-y-3">
      <label className={lbl}>What matters for a good match?</label>
      {(Object.keys(ROUTINE_PREFERENCE_LABELS) as RoutinePreferenceKey[]).map((key) => {
        const item = value[key];
        const needsDetail = ROUTINE_PREFERENCE_DETAIL_KEYS.includes(key);
        return (
          <div key={key} className="border border-slate-100 rounded-lg px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <CheckboxRow checked={item.selected} onChange={(v) => onChange(key, { selected: v })} label={ROUTINE_PREFERENCE_LABELS[key]} />
              {item.selected && (
                <div className="flex gap-1 shrink-0">
                  {(["ESSENTIAL", "PREFERRED"] as const).map((tier) => (
                    <button key={tier} type="button" onClick={() => onChange(key, { tier })}
                      className={cn("h-7 px-2.5 rounded-full border text-xs font-medium transition-colors",
                        item.tier === tier ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50")}>
                      {tier === "ESSENTIAL" ? "Essential" : "Preferred"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {item.selected && needsDetail && (
              <input className={cn(inp, "mt-2")} value={item.detail} onChange={(e) => onChange(key, { detail: e.target.value })}
                placeholder={key === "language" ? "Which language?" : key === "other" ? "Describe" : "Details"} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Live-request confirmation screen (shared, tier-aware) ─────────────────────

const LIVE_SCREEN_CONFIG: Record<PostingTier, { items: string[]; buttonLabel: string }> = {
  RAPID: {
    items: ["Matching suitable workers and providers", "Time since posted", "Responses received", "View responses", "Message", "Edit essential details", "Cancel request"],
    buttonLabel: "View matches",
  },
  URGENT: {
    items: ["Request summary and time remaining", "Responses", "View profiles", "Message", "Edit", "Cancel"],
    buttonLabel: "View responses",
  },
  LAST_MINUTE: {
    items: ["Request status", "Responses", "Shortlist", "Message", "Edit", "Withdraw request"],
    buttonLabel: "View responses",
  },
  ROUTINE: {
    items: ["Request status", "Responses", "Compare profiles", "Shortlist", "Message", "Edit", "Pause or withdraw"],
    buttonLabel: "View responses",
  },
};

export function LiveRequestScreen({ tier, tierLabel, jobId, isDraft }: { tier: PostingTier; tierLabel: string; jobId: string; isDraft: boolean }) {
  const config = LIVE_SCREEN_CONFIG[tier];
  return (
    <>
      <PageHeader title={isDraft ? "Draft saved" : `${tierLabel} request live`} />
      <div className="mx-auto max-w-lg px-5 py-12 text-center">
        <div className="mb-6 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">✓</div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {isDraft ? "Saved — finish it later" : `Your ${tierLabel.replace(" Support", "")} Support request is live`}
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          {isDraft
            ? "You can find this in My Requests and finish it whenever you're ready."
            : "Matching suitable workers and providers now."}
        </p>
        {!isDraft && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {config.items.map((label) => (
              <span key={label} className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">{label}</span>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <a href={`/jobs/${jobId}`}><Button className="w-full">{isDraft ? "Continue editing" : config.buttonLabel}</Button></a>
          <a href="/jobs/my"><Button variant="outline" className="w-full">My requests board</Button></a>
        </div>
      </div>
    </>
  );
}

export function buildWorkerPreferencesPayload(req: WorkerRequirements) {
  if (req.none && !req.workerOrProvider) return undefined;
  return {
    genderRequired: req.genderRequired || undefined,
    genderValue: req.genderRequired ? req.genderValue || undefined : undefined,
    genderReason: req.genderRequired ? req.genderReason || undefined : undefined,
    driversLicence: req.driversLicence || undefined,
    vehicle: req.vehicle || undefined,
    wheelchairVehicle: req.wheelchairVehicle || undefined,
    language: req.language ? (req.languageValue || true) : undefined,
    qualification: req.qualification ? (req.qualificationValue || true) : undefined,
    twoWorkers: req.twoWorkers || undefined,
    certIIIOrAbove: req.certIIIOrAbove || undefined,
    restrictivePractices: req.restrictivePractices || undefined,
    firstAid: req.firstAid || undefined,
    alliedHealth: req.alliedHealth || undefined,
    workerOrProvider: req.workerOrProvider || undefined,
  };
}

// Routine-only (O-08) — essential/preferred match-preference payload.
export function buildRoutinePreferencesPayload(prefs: RoutinePreferences) {
  const selected = (Object.keys(prefs) as RoutinePreferenceKey[]).filter((k) => prefs[k].selected);
  if (selected.length === 0) return undefined;
  const out: Record<string, { tier: string; detail?: string }> = {};
  for (const k of selected) out[k] = { tier: prefs[k].tier, detail: prefs[k].detail || undefined };
  return out;
}

export function buildSafetyFlagsPayload(s: SafetyChecklist) {
  if (s.none) return undefined;
  return {
    twoPersonSupport: s.twoPersonSupport || undefined,
    manualTransfer: s.manualTransfer || undefined,
    behaviourPlan: s.behaviourPlan || undefined,
    medicationMonitoring: s.medicationMonitoring || undefined,
    accessIssues: s.accessIssues || undefined,
    other: s.other ? (s.otherDetail || true) : undefined,
    communicationInstructions: s.communicationInstructions || undefined,
    mobilityInstructions: s.mobilityInstructions || undefined,
    mealtimePlan: s.mealtimePlan || undefined,
    allergyInfo: s.allergyInfo || undefined,
    homeAccessInfo: s.homeAccessInfo || undefined,
    privateDetailsSharing: s.privateDetailsSharing || undefined,
  };
}

export function buildFundingPayload(f: FundingChoice) {
  const budgetType = f.rateChoice === "NDIS_RATE" ? "NDIS"
    : f.rateChoice === "OFFERED_RATE" ? "FIXED_HOURLY"
    : f.rateChoice === "ASK_WORKERS" ? "OPEN"
    : f.rateChoice === "DECIDE_LATER" ? "DISCUSS"
    : undefined;
  return {
    fundingType: f.differentPartsManaged ? "MIXED" : (f.fundingType === "UNSURE" || f.fundingType === "" ? undefined : f.fundingType),
    planManagerName: f.planManagerName || undefined,
    budgetType,
    budgetPerHour: f.rateChoice === "OFFERED_RATE" && f.offeredRate ? parseFloat(f.offeredRate) : undefined,
    // Free-text rate/engagement notes (travel, evening/weekend/public-holiday,
    // cancellation arrangements) don't have a dedicated column — nested into
    // the existing internalNote field rather than adding a new migration.
    internalNote: f.rateNotes || undefined,
  };
}
