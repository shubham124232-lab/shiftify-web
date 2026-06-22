"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const SUBCATEGORIES: Record<string, string[]> = {
  PERSONAL_CARE: ["Morning Routine", "Evening Routine", "Showering / Grooming", "Continence Care", "Dressing Assistance"],
  COMMUNITY_ACCESS: ["Shopping Trips", "Social Outings", "Recreational Activities", "Appointments"],
  DOMESTIC_ASSISTANCE: ["Cleaning", "Laundry", "Meal Prep", "Gardening"],
  TRANSPORT: ["Medical Appointments", "School / Day Program", "Community Activities", "General Transport"],
  OVERNIGHT_SUPPORT: ["Sleepover", "Active Overnight", "Drop-in Check"],
  SIL_SUPPORT: ["24/7 Support", "Shared Living", "Individual SIL"],
  BEHAVIOUR_SUPPORT: ["PBS Implementation", "Crisis Support", "Skill Building"],
  NURSING_COMPLEX_CARE: ["Wound Care", "Medication Management", "Complex Health Needs"],
};

const SHIFT_TYPES = [
  { value: "STANDARD", label: "Standard", desc: "Regular daytime shift" },
  { value: "OVERNIGHT", label: "Overnight", desc: "Night-time active support" },
  { value: "SLEEPOVER", label: "Sleepover", desc: "Sleep on-site, available if needed" },
  { value: "24_HOUR", label: "24-Hour", desc: "Full 24-hour care" },
  { value: "DROP_IN", label: "Drop-in", desc: "Short visit / check-in" },
];

const DELIVERY_MODES = [
  { value: "AT_HOME", label: "At Home", icon: "Home" },
  { value: "COMMUNITY", label: "In Community", icon: "Community" },
  { value: "PROVIDER_PREMISES", label: "Provider Premises", icon: "Premises" },
  { value: "REMOTE", label: "Remote / Online", icon: "Remote" },
];

const FUNDING_TYPES = [
  { value: "SELF_MANAGED",  label: "Self-managed" },
  { value: "PLAN_MANAGED",  label: "Plan-managed" },
  { value: "NDIA_MANAGED",  label: "NDIA-managed" },
  { value: "PRIVATE",       label: "Private" },
  { value: "MIXED",         label: "Mixed" },
  { value: "DISCUSS",       label: "To be discussed" },
];

const QUALIFICATIONS = [
  "NDIS Worker Screening",
  "Working With Children Check",
  "Police Check",
  "First Aid",
  "CPR",
  "Manual Handling",
  "Medication Assistance",
  "High Intensity Skills",
  "Behaviour Support Training",
  "Mandt / Therapeutic Crisis Intervention",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STEPS = [
  { label: "Service Details" },
  { label: "Schedule" },
  { label: "Location" },
  { label: "Participant Info" },
  { label: "Worker Preferences" },
  { label: "Budget / Funding" },
  { label: "Visibility" },
  { label: "Review" },
];

// ─── Shared field styles ──────────────────────────────────────────────────────

const inp =
  "w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white";
const lbl = "block text-xs font-semibold text-slate-700 mb-1";

// ─── Wizard form shape ────────────────────────────────────────────────────────

interface WizardData {
  // Step 1
  title: string;
  category: string;
  subcategory: string;
  description: string;
  supportGoal: string;
  isRecurring: boolean;
  // Step 2
  shiftType: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  totalHours: string;
  timeFlexibility: string;
  recurringDays: string[];
  recurringFrequency: string;
  applicationDeadline: string;
  urgency: string;
  // Step 3
  suburb: string;
  state: string;
  postcode: string;
  serviceDeliveryMode: string;
  // Step 4
  participantId: string;
  postingAs: string;
  participantContext: string;
  complexityLevel: string;
  personalCareSupportLevel: string;
  mobilityNeeds: string;
  behaviourNotes: string;
  medicalNotes: string;
  riskSafetyNotes: string;
  // Step 5
  workerType: string;
  requiredQualifications: string[];
  genderPreference: string;
  languagePreference: string;
  experienceLevel: string;
  // Step 6
  budgetType: string;
  hourlyRate: string;
  totalBudget: string;
  fundingType: string;
  // Step 7
  visibleTo: string;
  geographicRadius: string;
  allowDirectApplications: boolean;
  allowQuotes: boolean;
  maxApplicants: string;
  showParticipantName: boolean;
  acceptBackupWorker: boolean;
  asDraft: boolean;
}

const defaultData: WizardData = {
  title: "", category: JOB_CATEGORIES[0].value, subcategory: "", description: "", supportGoal: "", isRecurring: false,
  shiftType: "STANDARD", scheduledStartAt: "", scheduledEndAt: "", totalHours: "", timeFlexibility: "EXACT",
  recurringDays: [], recurringFrequency: "WEEKLY", applicationDeadline: "", urgency: "SCHEDULED",
  suburb: "", state: "NSW", postcode: "", serviceDeliveryMode: "AT_HOME",
  participantId: "", postingAs: "SELF", participantContext: "", complexityLevel: "LOW", personalCareSupportLevel: "", mobilityNeeds: "", behaviourNotes: "", medicalNotes: "", riskSafetyNotes: "",
  workerType: "EITHER", requiredQualifications: [], genderPreference: "", languagePreference: "", experienceLevel: "ANY",
  budgetType: "HOURLY", hourlyRate: "", totalBudget: "", fundingType: "PLAN_MANAGED",
  visibleTo: "BOTH", geographicRadius: "25", allowDirectApplications: true, allowQuotes: true, maxApplicants: "", showParticipantName: true, acceptBackupWorker: false, asDraft: false,
};

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: WizardData; onChange: (f: Partial<WizardData>) => void }) {
  const subs = SUBCATEGORIES[data.category] ?? [];
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>Support request title *</label>
        <input className={inp} value={data.title} onChange={e => onChange({ title: e.target.value })} placeholder="e.g. Morning personal care support" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Support category *</label>
          <select className={inp} value={data.category} onChange={e => onChange({ category: e.target.value, subcategory: "" })}>
            {JOB_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        {subs.length > 0 && (
          <div>
            <label className={lbl}>Subcategory</label>
            <select className={inp} value={data.subcategory} onChange={e => onChange({ subcategory: e.target.value })}>
              <option value="">— select —</option>
              {subs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      <div>
        <label className={lbl}>Detailed description *</label>
        <textarea className={`${inp} h-auto py-2`} rows={4} value={data.description} onChange={e => onChange({ description: e.target.value })} placeholder="What exactly is needed? What should the worker know? What routine must be followed? What outcome is expected?" />
      </div>
      <div>
        <label className={lbl}>Support goal / purpose</label>
        <textarea className={`${inp} h-auto py-2`} rows={2} value={data.supportGoal} onChange={e => onChange({ supportGoal: e.target.value })} placeholder="What is the goal or outcome of this support?" />
      </div>
      <div>
        <label className={lbl}>Is this a recurring support need?</label>
        <div className="flex gap-4 mt-1">
          {([{ v: false, l: "One-time / as needed" }, { v: true, l: "Recurring support" }] as { v: boolean; l: string }[]).map(({ v, l }) => (
            <label key={String(v)} className={cn("flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 text-sm font-medium transition-colors", data.isRecurring === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={data.isRecurring === v} onChange={() => onChange({ isRecurring: v })} />
              {l}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ data, onChange }: { data: WizardData; onChange: (f: Partial<WizardData>) => void }) {
  function toggleDay(d: string) {
    const days = data.recurringDays.includes(d) ? data.recurringDays.filter(x => x !== d) : [...data.recurringDays, d];
    onChange({ recurringDays: days });
  }
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>Shift type</label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {SHIFT_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => onChange({ shiftType: t.value })}
              className={cn("border rounded-xl px-3 py-3 text-center text-xs font-medium transition-colors cursor-pointer", data.shiftType === t.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <div className="font-semibold">{t.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Start date &amp; time *</label>
          <input type="datetime-local" className={inp} value={data.scheduledStartAt} onChange={e => onChange({ scheduledStartAt: e.target.value })} />
        </div>
        <div>
          <label className={lbl}>End date &amp; time *</label>
          <input type="datetime-local" className={inp} value={data.scheduledEndAt} onChange={e => onChange({ scheduledEndAt: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Total hours (optional)</label>
          <input type="number" step="0.5" min="0.5" className={inp} value={data.totalHours} onChange={e => onChange({ totalHours: e.target.value })} placeholder="2.5" />
        </div>
        <div>
          <label className={lbl}>Urgency</label>
          <select className={inp} value={data.urgency} onChange={e => onChange({ urgency: e.target.value })}>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SAME_DAY">Urgent — Same Day</option>
            <option value="REPLACEMENT">Emergency Replacement Needed</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>
      </div>
      <div>
        <label className={lbl}>Time flexibility</label>
        <div className="flex gap-3">
          {[{ v: "EXACT", l: "Exact time" }, { v: "FLEXIBLE_AM", l: "Flexible AM" }, { v: "FLEXIBLE_PM", l: "Flexible PM" }, { v: "FLEXIBLE", l: "Fully flexible" }].map(({ v, l }) => (
            <label key={v} className={cn("flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm transition-colors", data.timeFlexibility === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={data.timeFlexibility === v} onChange={() => onChange({ timeFlexibility: v })} />{l}
            </label>
          ))}
        </div>
      </div>
      {data.isRecurring && (
        <div className="space-y-3 border border-brand-100 rounded-xl p-4 bg-brand-50/30">
          <div>
            <label className={lbl}>Frequency</label>
            <select className={inp} value={data.recurringFrequency} onChange={e => onChange({ recurringFrequency: e.target.value })}>
              <option value="WEEKLY">Weekly</option>
              <option value="FORTNIGHTLY">Fortnightly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Days of week</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={cn("h-9 w-12 rounded-lg border text-sm font-medium transition-colors", data.recurringDays.includes(d) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div>
        <label className={lbl}>Application deadline (optional)</label>
        <input type="datetime-local" className={inp} value={data.applicationDeadline} onChange={e => onChange({ applicationDeadline: e.target.value })} />
      </div>
    </div>
  );
}

function Step3({ data, onChange }: { data: WizardData; onChange: (f: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>Service delivery mode</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DELIVERY_MODES.map(m => (
            <button key={m.value} type="button" onClick={() => onChange({ serviceDeliveryMode: m.value })}
              className={cn("border rounded-xl px-3 py-4 text-center text-sm font-medium transition-colors cursor-pointer", data.serviceDeliveryMode === m.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <div className="text-xs font-semibold text-slate-400 mb-1">{m.icon}</div>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className={lbl}>Suburb *</label>
          <input className={inp} value={data.suburb} onChange={e => onChange({ suburb: e.target.value })} placeholder="Parramatta" />
        </div>
        <div>
          <label className={lbl}>State</label>
          <select className={inp} value={data.state} onChange={e => onChange({ state: e.target.value })}>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ width: 120 }}>
        <label className={lbl}>Postcode</label>
        <input className={inp} value={data.postcode} onChange={e => onChange({ postcode: e.target.value })} placeholder="2150" maxLength={4} />
      </div>
    </div>
  );
}

function Step4({ data, onChange, participants }: { data: WizardData; onChange: (f: Partial<WizardData>) => void; participants: { id: string; name: string }[] }) {
  return (
    <div className="space-y-5">
      {/* Who is posting */}
      <div>
        <label className={lbl}>Who is posting this request?</label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "SELF", l: "Participant themselves" },
            { v: "NOMINEE", l: "Nominee" },
            { v: "FAMILY", l: "Family member" },
            { v: "CARER", l: "Carer" },
            { v: "COORDINATOR", l: "Support coordinator" },
            { v: "GUARDIAN", l: "Guardian" },
            { v: "OTHER", l: "Other representative" },
          ].map(({ v, l }) => (
            <label key={v} className={cn("flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm transition-colors", data.postingAs === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={data.postingAs === v} onChange={() => onChange({ postingAs: v })} />{l}
            </label>
          ))}
        </div>
      </div>

      {participants.length > 0 && (
        <div>
          <label className={lbl}>Select participant (coordinator)</label>
          <select className={inp} value={data.participantId} onChange={e => onChange({ participantId: e.target.value })}>
            <option value="">posting as myself</option>
            {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className={lbl}>Participant context / routine notes (optional)</label>
        <textarea className={`${inp} h-auto py-2`} rows={3} value={data.participantContext} onChange={e => onChange({ participantContext: e.target.value })} placeholder="Step-by-step routine, preferred approach, what works best, what must be avoided, cultural/personal factors..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Support complexity level</label>
          <select className={inp} value={data.complexityLevel} onChange={e => onChange({ complexityLevel: e.target.value })}>
            <option value="LOW">Low - minimal support</option>
            <option value="MEDIUM">Medium - some complexity</option>
            <option value="HIGH">High - complex needs</option>
            <option value="VERY_HIGH">Very High - specialist required</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Personal care support level</label>
          <select className={inp} value={data.personalCareSupportLevel} onChange={e => onChange({ personalCareSupportLevel: e.target.value })}>
            <option value="">Select…</option>
            <option value="NONE">None</option>
            <option value="BASIC">Basic assistance</option>
            <option value="MODERATE">Moderate assistance</option>
            <option value="FULL">Full assistance</option>
            <option value="HIGH_INTENSITY">High intensity support</option>
          </select>
        </div>
      </div>
      <div>
        <label className={lbl}>Mobility / physical needs</label>
        <input className={inp} value={data.mobilityNeeds} onChange={e => onChange({ mobilityNeeds: e.target.value })} placeholder="e.g. wheelchair user, hoist required, two-person assist" />
      </div>
      <div>
        <label className={lbl}>Behaviour / sensory notes (optional)</label>
        <textarea className={`${inp} h-auto py-2`} rows={2} value={data.behaviourNotes} onChange={e => onChange({ behaviourNotes: e.target.value })} placeholder="Anxiety support, trauma-informed approach, behaviour support plan in place, sensory sensitivities..." />
      </div>
      <div>
        <label className={lbl}>Medical / health considerations (optional)</label>
        <textarea className={`${inp} h-auto py-2`} rows={2} value={data.medicalNotes} onChange={e => onChange({ medicalNotes: e.target.value })} placeholder="Medication prompting, epilepsy awareness, diabetes care, allergies..." />
      </div>
      <div>
        <label className={lbl}>Risk &amp; safety notes</label>
        <textarea className={`${inp} h-auto py-2`} rows={2} value={data.riskSafetyNotes} onChange={e => onChange({ riskSafetyNotes: e.target.value })} placeholder="Falls risk, seizure risk, behaviour escalation triggers, lone support not suitable, female worker only for personal care..." />
      </div>
    </div>
  );
}

function Step5({ data, onChange }: { data: WizardData; onChange: (f: Partial<WizardData>) => void }) {
  function toggleQual(q: string) {
    const list = data.requiredQualifications.includes(q)
      ? data.requiredQualifications.filter(x => x !== q)
      : [...data.requiredQualifications, q];
    onChange({ requiredQualifications: list });
  }
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>Who should apply?</label>
        <div className="flex gap-3">
          {[{ v: "INDIVIDUAL", l: "Individual Worker" }, { v: "PROVIDER", l: "Provider" }, { v: "EITHER", l: "Either" }].map(({ v, l }) => (
            <label key={v} className={cn("flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 text-sm font-medium transition-colors", data.workerType === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={data.workerType === v} onChange={() => onChange({ workerType: v })} />{l}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={lbl}>Required qualifications / compliance</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {QUALIFICATIONS.map(q => (
            <button key={q} type="button" onClick={() => toggleQual(q)}
              className={cn("h-8 px-3 rounded-full border text-xs font-medium transition-colors", data.requiredQualifications.includes(q) ? "border-brand-500 bg-brand-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              {q}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Gender preference (optional)</label>
          <select className={inp} value={data.genderPreference} onChange={e => onChange({ genderPreference: e.target.value })}>
            <option value="">No preference</option>
            <option value="FEMALE">Female worker preferred</option>
            <option value="MALE">Male worker preferred</option>
            <option value="NON_BINARY">Non-binary preferred</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Experience level required</label>
          <select className={inp} value={data.experienceLevel} onChange={e => onChange({ experienceLevel: e.target.value })}>
            <option value="ANY">Any level</option>
            <option value="BEGINNER">Beginner - new to sector</option>
            <option value="INTERMEDIATE">Intermediate - 1-3 years</option>
            <option value="EXPERIENCED">Experienced - 3+ years</option>
            <option value="EXPERT">Expert / Specialist</option>
          </select>
        </div>
      </div>
      <div>
        <label className={lbl}>Language / cultural preference (optional)</label>
        <input className={inp} value={data.languagePreference} onChange={e => onChange({ languagePreference: e.target.value })} placeholder="e.g. Mandarin-speaking, culturally sensitive to..." />
      </div>
    </div>
  );
}

function Step6({ data, onChange }: { data: WizardData; onChange: (f: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>Funding type</label>
        <div className="flex gap-3">
          {FUNDING_TYPES.map(({ value, label }) => (
            <label key={value} className={cn("flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 text-sm font-medium transition-colors", data.fundingType === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={data.fundingType === value} onChange={() => onChange({ fundingType: value })} />{label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={lbl}>Budget structure</label>
        <div className="flex gap-3">
          {[{ v: "HOURLY", l: "Hourly rate" }, { v: "TOTAL", l: "Total budget" }, { v: "NDIS_RATE", l: "NDIS price guide rate" }].map(({ v, l }) => (
            <label key={v} className={cn("flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 text-sm font-medium transition-colors", data.budgetType === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={data.budgetType === v} onChange={() => onChange({ budgetType: v })} />{l}
            </label>
          ))}
        </div>
      </div>
      {data.budgetType === "HOURLY" && (
        <div>
          <label className={lbl}>Hourly rate (AUD)</label>
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
            <input type="number" min="0" step="0.50" className={`${inp} pl-7`} value={data.hourlyRate} onChange={e => onChange({ hourlyRate: e.target.value })} placeholder="38.00" />
          </div>
        </div>
      )}
      {data.budgetType === "TOTAL" && (
        <div>
          <label className={lbl}>Total budget (AUD)</label>
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
            <input type="number" min="0" step="1" className={`${inp} pl-7`} value={data.totalBudget} onChange={e => onChange({ totalBudget: e.target.value })} placeholder="200.00" />
          </div>
        </div>
      )}
      {data.budgetType === "NDIS_RATE" && (
        <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">Workers will be paid at the current NDIS price guide rate for the selected support category.</p>
      )}
    </div>
  );
}

function Step7({ data, onChange }: { data: WizardData; onChange: (f: Partial<WizardData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>Visible to</label>
        <div className="flex gap-3">
          {[{ v: "WORKERS_ONLY", l: "Workers only" }, { v: "PROVIDERS_ONLY", l: "Providers only" }, { v: "BOTH", l: "Both" }].map(({ v, l }) => (
            <label key={v} className={cn("flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-3 text-sm font-medium transition-colors", data.visibleTo === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
              <input type="radio" className="sr-only" checked={data.visibleTo === v} onChange={() => onChange({ visibleTo: v })} />{l}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className={lbl}>Geographic reach</label>
        <select className={`${inp} w-56`} value={data.geographicRadius} onChange={e => onChange({ geographicRadius: e.target.value })}>
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
          <option value="25">Within 25 km</option>
          <option value="50">Within 50 km</option>
          <option value="0">No distance restriction</option>
          <option value="online">Online applicants allowed</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Maximum applicants (optional)</label>
        <input type="number" min="1" max="50" className={`${inp} w-28`} value={data.maxApplicants} onChange={e => onChange({ maxApplicants: e.target.value })} placeholder="No limit" />
      </div>
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-700">Application &amp; privacy options</label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-600" checked={data.allowDirectApplications} onChange={e => onChange({ allowDirectApplications: e.target.checked })} />
          <div>
            <span className="text-sm font-medium text-slate-800">Allow direct applications</span>
            <p className="text-xs text-slate-400 mt-0.5">Workers/providers can apply directly. Uncheck for invite-only.</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-600" checked={data.allowQuotes} onChange={e => onChange({ allowQuotes: e.target.checked })} />
          <div>
            <span className="text-sm font-medium text-slate-800">Allow quotes / offers from applicants</span>
            <p className="text-xs text-slate-400 mt-0.5">Applicants can propose their own rate instead of accepting your listed budget.</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-600" checked={data.showParticipantName} onChange={e => onChange({ showParticipantName: e.target.checked })} />
          <div>
            <span className="text-sm font-medium text-slate-800">Show participant name on listing</span>
            <p className="text-xs text-slate-400 mt-0.5">If unchecked, listing shows "Anonymous participant" only.</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-600" checked={data.acceptBackupWorker} onChange={e => onChange({ acceptBackupWorker: e.target.checked })} />
          <div>
            <span className="text-sm font-medium text-slate-800">Accept backup / secondary worker applications</span>
            <p className="text-xs text-slate-400 mt-0.5">Workers can apply as backup if another is already confirmed.</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-600" checked={data.asDraft} onChange={e => onChange({ asDraft: e.target.checked })} />
          <div>
            <span className="text-sm font-medium text-slate-800">Save as draft (do not publish yet)</span>
            <p className="text-xs text-slate-400 mt-0.5">You can publish from My Jobs when ready.</p>
          </div>
        </label>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 text-right">{value || <span className="text-slate-300">none</span>}</span>
    </div>
  );
}

function Step8({ data }: { data: WizardData }) {
  const catLabel = JOB_CATEGORIES.find(c => c.value === data.category)?.label ?? data.category;
  const shiftLabel = SHIFT_TYPES.find(s => s.value === data.shiftType)?.label ?? data.shiftType;
  const modeLabel = DELIVERY_MODES.find(m => m.value === data.serviceDeliveryMode)?.label ?? data.serviceDeliveryMode;
  const fundLabel = FUNDING_TYPES.find(f => f.value === data.fundingType)?.label ?? data.fundingType;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Review your request before publishing.</p>
      <div className="bg-slate-50 rounded-xl p-4 divide-y divide-slate-100">
        <ReviewRow label="Title" value={data.title} />
        <ReviewRow label="Category" value={catLabel} />
        {data.subcategory && <ReviewRow label="Subcategory" value={data.subcategory} />}
        <ReviewRow label="Description" value={data.description ? data.description.slice(0, 120) + (data.description.length > 120 ? "…" : "") : ""} />
        <ReviewRow label="Recurring" value={data.isRecurring ? "Yes" : "One-time"} />
        <ReviewRow label="Shift type" value={shiftLabel} />
        <ReviewRow label="Start" value={data.scheduledStartAt ? new Date(data.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : ""} />
        <ReviewRow label="End" value={data.scheduledEndAt ? new Date(data.scheduledEndAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : ""} />
        <ReviewRow label="Urgency" value={data.urgency.replace("_", " ")} />
        <ReviewRow label="Location" value={`${data.suburb}, ${data.state}${data.postcode ? " " + data.postcode : ""}`} />
        <ReviewRow label="Delivery mode" value={modeLabel} />
        <ReviewRow label="Posted by" value={data.postingAs} />
        <ReviewRow label="Complexity" value={data.complexityLevel} />
        {data.personalCareSupportLevel && <ReviewRow label="Personal care level" value={data.personalCareSupportLevel} />}
        <ReviewRow label="Worker type" value={data.workerType} />
        <ReviewRow label="Experience" value={data.experienceLevel} />
        {data.requiredQualifications.length > 0 && <ReviewRow label="Qualifications" value={data.requiredQualifications.join(", ")} />}
        <ReviewRow label="Funding type" value={fundLabel} />
        {data.budgetType === "HOURLY" && data.hourlyRate && <ReviewRow label="Hourly rate" value={`$${data.hourlyRate}/hr`} />}
        {data.budgetType === "TOTAL" && data.totalBudget && <ReviewRow label="Total budget" value={`$${data.totalBudget}`} />}
        <ReviewRow label="Visible to" value={data.visibleTo.replace("_", " ")} />
        <ReviewRow label="Geographic reach" value={data.geographicRadius === "0" ? "No restriction" : data.geographicRadius === "online" ? "Online" : `Within ${data.geographicRadius} km`} />
        <ReviewRow label="Direct applications" value={data.allowDirectApplications ? "Yes" : "Invite only"} />
        <ReviewRow label="Allow quotes" value={data.allowQuotes ? "Yes" : "No"} />
        <ReviewRow label="Status" value={data.asDraft ? "Draft" : "Publish immediately"} />
      </div>
      <div className="mt-4 space-y-2 border border-slate-100 rounded-xl p-4 bg-slate-50">
        <p className="text-xs font-semibold text-slate-700 mb-3">Before submitting, confirm:</p>
        {[
          "I confirm the information provided is accurate",
          "I am authorised to post this request",
          "I understand applicants will rely on this information",
          "I acknowledge safety-sensitive details have been disclosed accurately",
        ].map((txt) => (
          <div key={txt} className="flex items-start gap-2 text-xs text-slate-600">
            <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{txt}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PostJobWizard() {
  const router = useRouter();
  const { activeRole } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(defaultData);
  const [participants, setParticipants] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (activeRole === "COORDINATOR") {
      api.get<{ users: { id: string; name: string }[] }>("/linking/participants")
        .then(r => setParticipants(r.users ?? []))
        .catch(() => {});
    }
  }, [activeRole]);

  function change(fields: Partial<WizardData>) { setData(prev => ({ ...prev, ...fields })); }

  function validateStep(): string | null {
    if (step === 0 && !data.title.trim()) return "Title is required.";
    if (step === 0 && !data.description.trim()) return "Description is required — tell the worker what is needed.";
    if (step === 1 && !data.scheduledStartAt) return "Start date & time is required.";
    if (step === 1 && !data.scheduledEndAt) return "End date & time is required.";
    if (step === 2 && !data.suburb.trim()) return "Suburb is required.";
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() { setError(null); setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function submit() {
    setSaving(true); setError(null);
    try {
      const recurrencePattern = data.isRecurring ? { frequency: data.recurringFrequency, days: data.recurringDays } : undefined;
      const workerPreferences = {
        workerType: data.workerType, requiredQualifications: data.requiredQualifications,
        genderPreference: data.genderPreference || undefined, languagePreference: data.languagePreference || undefined,
        experienceLevel: data.experienceLevel, visibleTo: data.visibleTo,
        geographicRadius: data.geographicRadius || undefined,
        allowDirectApplications: data.allowDirectApplications, allowQuotes: data.allowQuotes,
        maxApplicants: data.maxApplicants ? parseInt(data.maxApplicants) : undefined,
        showParticipantName: data.showParticipantName, acceptBackupWorker: data.acceptBackupWorker,
        complexityLevel: data.complexityLevel,
        personalCareSupportLevel: data.personalCareSupportLevel || undefined,
        mobilityNeeds: data.mobilityNeeds || undefined,
        behaviourNotes: data.behaviourNotes || undefined, medicalNotes: data.medicalNotes || undefined,
        riskSafetyNotes: data.riskSafetyNotes || undefined,
        postingAs: data.postingAs,
        participantContext: data.participantContext || undefined,
      };
      const budget = data.budgetType === "HOURLY" && data.hourlyRate
        ? { type: "HOURLY", amount: parseFloat(data.hourlyRate) }
        : data.budgetType === "TOTAL" && data.totalBudget
        ? { type: "TOTAL", amount: parseFloat(data.totalBudget) }
        : { type: data.budgetType };
      const body: Record<string, unknown> = {
        title: data.title.trim(),
        description: data.description.trim() || data.supportGoal.trim() || undefined,
        category: data.category, subcategory: data.subcategory || undefined, urgency: data.urgency,
        suburb: data.suburb.trim(), state: data.state, postcode: data.postcode.trim() || undefined,
        serviceDeliveryMode: data.serviceDeliveryMode,
        scheduledStartAt: new Date(data.scheduledStartAt).toISOString(),
        scheduledEndAt: new Date(data.scheduledEndAt).toISOString(),
        totalHours: data.totalHours ? parseFloat(data.totalHours) : undefined,
        isRecurring: data.isRecurring, recurrencePattern,
        shiftType: data.shiftType, timeFlexibility: data.timeFlexibility,
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline).toISOString() : undefined,
        fundingType: data.fundingType, budget, workerPreferences, asDraft: data.asDraft,
      };
      if (activeRole === "COORDINATOR" && data.participantId) body.forParticipantUserId = data.participantId;
      const res = await api.post<{ job: { id: string } }>("/jobs", body);
      setSubmittedJobId(res.job.id);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to post request.");
    } finally { setSaving(false); }
  }

  if (activeRole && !["PARTICIPANT", "COORDINATOR"].includes(activeRole)) {
    return (
      <>
        <PageHeader title="Post a Support Request" />
        <div className="px-5 py-8 text-sm text-slate-500">Only participants and support coordinators can post support requests.</div>
      </>
    );
  }

  // Post-submit confirmation screen
  if (submittedJobId) {
    return (
      <>
        <PageHeader title="Request Posted" />
        <div className="mx-auto max-w-lg px-5 py-12 text-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">✓</div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {data.asDraft ? "Draft saved!" : "Support request posted!"}
          </h2>
          <p className="text-sm text-slate-500 mb-1">Request ID: <span className="font-mono font-semibold text-slate-700">{submittedJobId}</span></p>
          <p className="text-sm text-slate-500 mb-8">
            Status: <span className="font-semibold">{data.asDraft ? "Draft" : data.urgency === "EMERGENCY" || data.urgency === "SAME_DAY" ? "Urgent Live" : "Live"}</span>
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`/jobs/${submittedJobId}`}>
              <Button className="w-full">View my request</Button>
            </Link>
            <Link href="/jobs/my">
              <Button variant="outline" className="w-full">My requests board</Button>
            </Link>
            <Button variant="ghost" className="w-full" onClick={() => { setData(defaultData); setStep(0); setSubmittedJobId(null); }}>
              Post another request
            </Button>
          </div>
        </div>
      </>
    );
  }

  const stepComponents = [
    <Step1 key={0} data={data} onChange={change} />,
    <Step2 key={1} data={data} onChange={change} />,
    <Step3 key={2} data={data} onChange={change} />,
    <Step4 key={3} data={data} onChange={change} participants={participants} />,
    <Step5 key={4} data={data} onChange={change} />,
    <Step6 key={5} data={data} onChange={change} />,
    <Step7 key={6} data={data} onChange={change} />,
    <Step8 key={7} data={data} />,
  ];

  return (
    <>
      <PageHeader title="Post a Support Request" description={`Step ${step + 1} of ${STEPS.length} - ${STEPS[step].label}`} />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <button type="button" onClick={() => i < step && setStep(i)}
                className={cn("flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0 transition-colors",
                  i === step ? "bg-brand-600 text-white" : i < step ? "bg-brand-100 text-brand-700 cursor-pointer hover:bg-brand-200" : "bg-slate-100 text-slate-400")}>
                {i < step ? "v" : i + 1}
              </button>
              {i < STEPS.length - 1 && <div className={cn("h-0.5 w-8 shrink-0", i < step ? "bg-brand-400" : "bg-slate-200")} />}
          
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Card>
          <CardContent className="py-6">
            {stepComponents[step]}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submit} disabled={saving}>
              {saving ? "Publishing..." : data.asDraft ? "Save Draft" : "Publish Request"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
