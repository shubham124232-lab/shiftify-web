"use client";

// "Request details" — what the poster actually selected in the posting journey (tasks and follow-up
// answers, goals, worker requirements, safety information, schedule flexibility, funding and rate,
// response preferences). Before this card existed those answers were stored but never shown again.
// The API already redacts private fields per viewer (safetyFlags are null for people browsing the open
// board), so this component simply renders whatever the job payload contains.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTINE_PREFERENCE_LABELS, type RoutinePreferenceKey } from "@/lib/types/posting";

type Json = Record<string, unknown>;

export interface RequestDetailsJob {
  selectedTasks?: unknown;
  workerPreferences?: Json | null;
  safetyFlags?: Json | null;
  fundingType?: string | null;
  budgetType?: string | null;
  budgetPerHour?: number | string | null;
  timeFlexibility?: string | null;
  requestPurposeCategory?: string | null;
  recurrencePattern?: Json | null;
  isRecurring?: boolean;
  supportGoal?: string | null;
  serviceDeliveryMode?: string | null;
  responsePreferences?: Json | null;
  contactPreferences?: Json | null;
}

const FUNDING_LABELS: Record<string, string> = {
  SELF_MANAGED: "Self-managed NDIS funding", PLAN_MANAGED: "Plan-managed NDIS funding", NDIA_MANAGED: "NDIA-managed funding",
  PRIVATE: "Privately paid", MIXED: "Different parts managed differently", DISCUSS: "Not confirmed yet",
};
const RATE_LABELS: Record<string, string> = {
  NDIS: "Applicable NDIS rate", OPEN: "Workers/providers provide their rate", DISCUSS: "Decide after connecting",
};
const DELIVERY_LABELS: Record<string, string> = {
  HOME: "Participant's home", COMMUNITY: "Community", APPOINTMENT: "Appointment or activity", PICKUP_DROPOFF: "Pick-up/drop-off",
  MULTIPLE: "Multiple locations", TRANSPORT: "Transport-based", PROVIDER: "Provider setting/premises", SCHOOL_WORK: "School/work", ONLINE: "Online/virtual", OTHER: "Other",
};
const REQUIREMENT_LABELS: Record<string, string> = {
  genderRequired: "Worker gender requirement", driversLicence: "Driver's licence", vehicle: "Worker vehicle", wheelchairVehicle: "Wheelchair-accessible vehicle",
  language: "Language/Auslan", qualification: "Qualification or participant-specific training", twoWorkers: "Two workers required",
  certIIIOrAbove: "Cert III or above", restrictivePractices: "Restrictive practices", firstAid: "First aid", alliedHealth: "Allied health background",
};
const SAFETY_LABELS: Record<string, string> = {
  environmentalInfo: "Environment",
  twoPersonSupport: "Two-person support is required", manualTransfer: "Manual transfer or hoist is involved",
  behaviourPlan: "Behaviour support plan or regulated restrictive practice may be relevant", medicationMonitoring: "Medication or health monitoring is involved",
  accessIssues: "Pets, smoking, stairs or access issues", other: "Other essential information", communicationInstructions: "Communication instructions",
  mobilityInstructions: "Mobility/equipment instructions", mealtimePlan: "Mealtime plan", allergyInfo: "Allergy information", homeAccessInfo: "Home-access information",
  supportPlanAvailable: "Support plan/instructions are available", privateDocsShareable: "Private documents can be shared after shortlist or confirmation",
};
const WORKER_TYPE_LABELS: Record<string, string> = {
  WORKER: "Independent support worker", PROVIDER: "Provider organisation", EITHER: "Either a worker or a provider",
  ONE_REGULAR: "One regular worker", SMALL_TEAM: "A small consistent team", NO_PREFERENCE: "No preference",
  SINGLE_WORKER: "Single worker", TEAM_ROSTER: "Team/roster of workers", TWO_WORKERS: "Two workers for selected supports",
};

const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const asText = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-6">
      <dt className="w-44 shrink-0 text-[12px] font-semibold uppercase tracking-[0.05em] text-slate-500">{label}</dt>
      <dd className="m-0 text-[14px] text-slate-800">{children}</dd>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return <ul className="m-0 list-disc space-y-0.5 pl-4">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}

export function RequestDetailsCard({ job, isOwner }: { job: RequestDetailsJob; isOwner: boolean }) {
  const rows: { label: string; body: React.ReactNode }[] = [];

  // ── Tasks, follow-up answers, goals (flat array for Rapid/Urgent/Last-Minute, object when answers/goals exist)
  const st = job.selectedTasks;
  if (Array.isArray(st) && st.length) {
    rows.push({ label: "Tasks", body: <List items={st.map(String)} /> });
  } else if (isObj(st)) {
    const cats = Array.isArray(st.categories) ? st.categories.filter(isObj) : [];
    for (const c of cats) {
      const tasks = Array.isArray(c.tasks) ? c.tasks.map(String) : [];
      const answers = isObj(c.answers) ? Object.entries(c.answers).filter(([, v]) => asText(v)) : [];
      if (!tasks.length && !answers.length) continue;
      rows.push({
        label: cats.length > 1 ? asText(c.label) || "Tasks" : "Tasks",
        body: (
          <div className="space-y-1.5">
            {tasks.length > 0 && <List items={tasks} />}
            {answers.length > 0 && <p className="m-0 text-[12px] text-slate-500">Follow-up answers: {answers.map(([k, v]) => `${k.replace(/[-_]/g, " ")}: ${asText(v)}`).join("; ")}</p>}
          </div>
        ),
      });
    }
    const goals = Array.isArray(st.goals) ? st.goals.map(String) : [];
    const planGoal = asText(st.planGoal);
    if (goals.length || planGoal) rows.push({ label: "Goals", body: <List items={[...goals, ...(planGoal ? [`Plan goal: ${planGoal}`] : [])]} /> });
  }
  if (job.requestPurposeCategory) rows.push({ label: "Reason / purpose", body: job.requestPurposeCategory });

  // ── Schedule
  const rp = job.recurrencePattern;
  if (isObj(rp) && rp.type && rp.type !== "ONE_TIME") {
    const days = Array.isArray(rp.days) ? rp.days.join(", ") : "";
    const bits = [
      asText(rp.arrangement).replace(/_/g, " ").toLowerCase(),
      days && `on ${days}`,
      asText(rp.frequency).replace(/_/g, " ").toLowerCase(),
      asText(rp.hoursPerVisit) && `${asText(rp.hoursPerVisit)} hours per visit`,
      rp.openEnded ? "no fixed end date" : asText(rp.endDate) && `until ${asText(rp.endDate)}`,
      Array.isArray(rp.dates) ? `${rp.dates.length} dates` : "",
    ].filter(Boolean);
    if (bits.length) rows.push({ label: "Pattern", body: bits.join(" · ") });
  }
  if (job.timeFlexibility && job.timeFlexibility !== "EXACT") {
    const tf = job.timeFlexibility;
    rows.push({ label: "Time flexibility", body: tf === "FLEXIBLE_SLIGHT" ? "Slightly flexible" : tf === "DISCUSS" ? "Worker/provider may propose a nearby time" : tf });
  } else if (job.timeFlexibility === "EXACT") {
    rows.push({ label: "Time flexibility", body: "Exact time" });
  }
  if (job.serviceDeliveryMode) rows.push({ label: "Where", body: DELIVERY_LABELS[job.serviceDeliveryMode] ?? job.serviceDeliveryMode });

  // ── Worker requirements / preferences
  const wp = isObj(job.workerPreferences) ? job.workerPreferences : null;
  if (wp) {
    const reqs: string[] = [];
    for (const [k, label] of Object.entries(REQUIREMENT_LABELS)) {
      const v = wp[k];
      if (!v) continue;
      const detail = k === "genderRequired" ? [asText(wp.genderValue), asText(wp.genderReason)].filter(Boolean).join(", ") : typeof v === "string" ? v : "";
      reqs.push(detail ? `${label} (${detail})` : label);
    }
    if (reqs.length) rows.push({ label: "Requirements", body: <List items={reqs} /> });
    const workerType = asText(wp.workerOrProvider);
    if (workerType) rows.push({ label: "Looking for", body: WORKER_TYPE_LABELS[workerType] ?? workerType });
    const mp = isObj(wp.matchPreferences) ? wp.matchPreferences : null;
    if (mp) {
      const items = Object.entries(mp).filter(([, v]) => isObj(v)).map(([k, v]) => {
        const item = v as Json;
        const label = ROUTINE_PREFERENCE_LABELS[k as RoutinePreferenceKey] ?? k;
        return `${label}${asText(item.detail) ? ` (${asText(item.detail)})` : ""} — ${item.tier === "ESSENTIAL" ? "essential" : "preferred"}`;
      });
      if (items.length) rows.push({ label: "Match preferences", body: <List items={items} /> });
    }
    const extras = [
      wp.participantAgeGroup ? `Participant age group: ${asText(wp.participantAgeGroup)}` : "",
      wp.deliveryMode ? `Delivery: ${asText(wp.deliveryMode).replace("_", " ").toLowerCase()}` : "",
      wp.travelRadiusKm ? `Travel radius: ${asText(wp.travelRadiusKm)} km` : "",
      wp.alternativeTimes ? `Alternative times: ${asText(wp.alternativeTimes)}` : "",
      wp.arrivalWindow ? `Arrival window: ${asText(wp.arrivalWindow)}` : "",
      wp.consistencyPreference ? `Consistency: ${asText(wp.consistencyPreference).replace(/_/g, " ").toLowerCase()}` : "",
      wp.participantSpecificTraining ? `Participant-specific training: ${asText(wp.participantSpecificTraining)}` : "",
    ].filter(Boolean);
    const screens = Array.isArray(wp.screeningChecks) ? wp.screeningChecks.map(String) : [];
    if (screens.length) rows.push({ label: "Screening checks", body: <List items={screens} /> });
    const needs = Array.isArray(wp.supportNeeds) ? wp.supportNeeds.map(String) : [];
    if (needs.length) rows.push({ label: "Support needs", body: <List items={needs} /> });
    if (extras.length) rows.push({ label: "Other details", body: <List items={extras} /> });
  }

  // ── Safety information (null for anyone the API does not release it to)
  const sf = isObj(job.safetyFlags) ? job.safetyFlags : null;
  if (sf) {
    const items = Object.entries(SAFETY_LABELS).filter(([k]) => sf[k]).map(([k, label]) => {
      const v = sf[k];
      return typeof v === "string" ? `${label}: ${v}` : label;
    });
    if (sf.privateDetailsSharing) items.push(`Private details shared ${sf.privateDetailsSharing === "AFTER_SHORTLIST" ? "after shortlist" : "after confirmation"}`);
    if (items.length) rows.push({ label: "Safety information", body: <List items={items} /> });
  }

  // ── Funding and rate
  const funding = [
    job.fundingType ? FUNDING_LABELS[job.fundingType] ?? job.fundingType : "",
    job.budgetType === "FIXED_HOURLY" && job.budgetPerHour ? `$${job.budgetPerHour}/hr offered` : job.budgetType ? RATE_LABELS[job.budgetType] ?? "" : "",
  ].filter(Boolean);
  if (funding.length) rows.push({ label: "Funding and rate", body: funding.join(" · ") });

  // ── Response / update preferences (poster-side information)
  if (isOwner) {
    const rpf = isObj(job.responsePreferences) ? job.responsePreferences : null;
    if (rpf) {
      const methods = [
        ...(Array.isArray(rpf.responseMethods) ? rpf.responseMethods.map(String) : []),
        ...(Array.isArray(rpf.responseRoutes) ? rpf.responseRoutes.map((r) => String(r).replace(/_/g, " ").toLowerCase()) : []),
        ...(Array.isArray(rpf.introductorySteps) ? rpf.introductorySteps.map(String) : []),
      ];
      if (methods.length) rows.push({ label: "How professionals respond", body: <List items={methods} /> });
    }
    const cp = isObj(job.contactPreferences) ? job.contactPreferences : null;
    if (cp && Array.isArray(cp.updateMethods) && cp.updateMethods.length) rows.push({ label: "Updates", body: cp.updateMethods.map(String).join(", ") });
  }

  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Request details</CardTitle></CardHeader>
      <CardContent>
        <dl className="m-0 divide-y divide-slate-100">
          {rows.map((r) => <Row key={r.label + String(typeof r.body === "string" ? r.body : "")} label={r.label}>{r.body}</Row>)}
        </dl>
      </CardContent>
    </Card>
  );
}
