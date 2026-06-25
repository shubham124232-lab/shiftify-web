"use client";
// Plan Manager Dashboard — spec-complete
// Tabs: Overview | Browse Requests | Referrals | Participants | Service Gaps | Connections

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/src/lib/api";
import { useAuthStore } from "@/src/lib/auth-store";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PmStats {
  activeParticipantCases: number;
  openReferrals: number;
  urgentReferrals: number;
  unfilledReferrals: number;
  recentInvoiceCount: number;
  unreadMessages: number;
}

interface Invoice {
  id: string;
  hours: string | null;
  note: string | null;
  sentAt: string;
  sender: { id: string; name: string };
  participant: { id: string; name: string } | null;
  job: { id: string; title: string; suburb: string; scheduledStartAt: string } | null;
}

interface Connection {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  initiatedBy: string;
  createdAt: string;
  client: { id: string; name: string; email: string };
}

interface DashboardSummary {
  role: "PLAN_MANAGER";
  stats: PmStats;
  recentInvoices: Invoice[];
  connectionCounts: { pending: number; accepted: number; declined: number };
  unreadNotifications: number;
}

interface LoadBoardRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  totalHours: number | null;
  createdAt: string;
  forParticipant: { id: string; name: string } | null;
  postedBy: { id: string; name: string };
  _count: { applications: number };
  isLinkedParticipant: boolean;
}

interface Referral {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  suburb: string;
  state: string;
  scheduledStartAt: string;
  totalHours: number | null;
  createdAt: string;
  forParticipant: { id: string; name: string } | null;
  _count: { applications: number };
}

interface LinkedParticipant {
  connectionId: string;
  linkedSince: string;
  openJobs: number;
  invoiceCount: number;
  participant: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    participantProfile: {
      ndisNumber: string | null;
      fundingManagementType: string | null;
      primaryDisability: string | null;
      ndisStartDate: string | null;
      ndisEndDate: string | null;
    } | null;
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "red" | "amber" | "green" | "indigo";
}) {
  const accentClass = {
    red: "text-red-600",
    amber: "text-amber-600",
    green: "text-green-600",
    indigo: "text-indigo-600",
  }[accent ?? "indigo"];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-gray-900 mb-3">{children}</h2>;
}

function Badge({ label, color }: { label: string; color?: string }) {
  const colorClass = color ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, string> = {
    EMERGENCY: "bg-red-100 text-red-700",
    URGENT:    "bg-amber-100 text-amber-700",
    SCHEDULED: "bg-blue-100 text-blue-700",
    FLEXIBLE:  "bg-gray-100 text-gray-600",
  };
  return <Badge label={urgency} color={map[urgency]} />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN:       "bg-blue-100 text-blue-700",
    ASSIGNED:   "bg-indigo-100 text-indigo-700",
    COMPLETED:  "bg-green-100 text-green-700",
    CANCELLED:  "bg-red-100 text-red-700",
    PENDING:    "bg-amber-100 text-amber-700",
    ACCEPTED:   "bg-green-100 text-green-700",
    DECLINED:   "bg-red-100 text-red-700",
  };
  return <Badge label={status} color={map[status]} />;
}

// ── Link Participant Modal ─────────────────────────────────────────────────────

function LinkParticipantModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [targetUserId, setTargetUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!targetUserId.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/pm/connect", { planManagerUserId: targetUserId.trim() });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Link Participant</h2>
        <p className="text-sm text-gray-500">
          Enter the participant's user ID to send them a connection request. They will need to accept before you can manage their account.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Participant User ID</label>
          <input
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Paste participant user ID…"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !targetUserId.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Post Referral Modal ────────────────────────────────────────────────────────

function PostReferralModal({
  participants,
  onClose,
  onSuccess,
}: {
  participants: LinkedParticipant[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    participantUserId: "",
    title: "",
    description: "",
    category: "DAILY_ACTIVITIES",
    suburb: "",
    state: "NSW",
    scheduledStartAt: "",
    scheduledEndAt: "",
    urgency: "SCHEDULED",
    totalHours: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.participantUserId || !form.title || !form.description || !form.suburb || !form.scheduledStartAt || !form.scheduledEndAt) {
      setError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/pm/referral", {
        ...form,
        totalHours: form.totalHours ? Number(form.totalHours) : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post referral");
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES = [
    "DAILY_ACTIVITIES", "COMMUNITY_ACCESS", "PERSONAL_CARE", "DOMESTIC_ASSISTANCE",
    "TRANSPORT", "RESPITE", "OVERNIGHT", "COMPLEX_CARE", "PSYCHOSOCIAL",
    "SIL", "SDA", "ALLIED_HEALTH", "BEHAVIOUR_SUPPORT", "OTHER",
  ];
  const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 my-4">
        <h2 className="text-lg font-semibold text-gray-900">Post Referral / Sourcing Request</h2>
        <p className="text-sm text-gray-500">Post a provider sourcing request on behalf of a linked participant.</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Participant *</label>
          <select
            value={form.participantUserId}
            onChange={(e) => set("participantUserId", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select linked participant…</option>
            {participants.map((p) => (
              <option key={p.participant.id} value={p.participant.id}>
                {p.participant.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Request Title *</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Provider Needed for Ongoing Community Access Support"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Describe the support need, participant context, provider requirements…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <select
              value={form.urgency}
              onChange={(e) => set("urgency", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="FLEXIBLE">Flexible</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suburb *</label>
            <input
              value={form.suburb}
              onChange={(e) => set("suburb", e.target.value)}
              placeholder="e.g. Parramatta"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date/Time *</label>
            <input
              type="datetime-local"
              value={form.scheduledStartAt}
              onChange={(e) => set("scheduledStartAt", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date/Time *</label>
            <input
              type="datetime-local"
              value={form.scheduledEndAt}
              onChange={(e) => set("scheduledEndAt", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours (optional)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={form.totalHours}
            onChange={(e) => set("totalHours", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post Referral"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = "overview" | "browse" | "referrals" | "participants" | "service-gaps" | "connections";

export default function PlanManagerDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [linkedParticipants, setLinkedParticipants] = useState<LinkedParticipant[]>([]);
  const [loadBoard, setLoadBoard] = useState<LoadBoardRequest[]>([]);
  const [loadBoardTotal, setLoadBoardTotal] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralTotal, setReferralTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Filters
  const [lbCategory, setLbCategory] = useState("");
  const [lbUrgency, setLbUrgency] = useState("");
  const [lbSuburb, setLbSuburb] = useState("");
  const [lbPage, setLbPage] = useState(1);
  const [refStatus, setRefStatus] = useState("");
  const [refPage, setRefPage] = useState(1);

  // Modals
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  const loadCore = useCallback(async () => {
    const [summaryRes, connectionsRes, participantsRes] = await Promise.all([
      api.get<{ summary: DashboardSummary }>("/dashboard/summary"),
      api.get<{ connections: Connection[] }>("/pm/connections"),
      api.get<{ participants: LinkedParticipant[] }>("/pm/participants"),
    ]);
    setSummary(summaryRes.summary);
    setConnections(connectionsRes.connections);
    setLinkedParticipants(participantsRes.participants);
  }, []);

  const loadLoadBoard = useCallback(async () => {
    const params = new URLSearchParams({ page: String(lbPage), limit: "20" });
    if (lbCategory) params.set("category", lbCategory);
    if (lbUrgency)  params.set("urgency",  lbUrgency);
    if (lbSuburb)   params.set("suburb",   lbSuburb);
    const res = await api.get<{ requests: LoadBoardRequest[]; total: number }>(`/pm/load-board?${params}`);
    setLoadBoard(res.requests);
    setLoadBoardTotal(res.total);
  }, [lbPage, lbCategory, lbUrgency, lbSuburb]);

  const loadReferrals = useCallback(async () => {
    const params = new URLSearchParams({ page: String(refPage), limit: "20" });
    if (refStatus) params.set("status", refStatus);
    const res = await api.get<{ referrals: Referral[]; total: number }>(`/pm/referrals?${params}`);
    setReferrals(res.referrals);
    setReferralTotal(res.total);
  }, [refPage, refStatus]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadCore();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [loadCore]);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.activeRole !== "PLAN_MANAGER") { router.push("/dashboard"); return; }
    void loadAll();
  }, [user, router, loadAll]);

  useEffect(() => {
    if (activeTab === "browse") void loadLoadBoard();
  }, [activeTab, loadLoadBoard]);

  useEffect(() => {
    if (activeTab === "referrals") void loadReferrals();
  }, [activeTab, loadReferrals]);

  const respondToConnection = async (connectionId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      await api.patch(`/pm/connections/${connectionId}/respond`, { action });
      void loadAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  const stats = summary?.stats;
  const pendingConnections = connections.filter((c) => c.status === "PENDING");
  const acceptedConnections = connections.filter((c) => c.status === "ACCEPTED");

  // Service gaps = linked participant requests with no applications
  const serviceGaps = loadBoard.filter(
    (r) => r.isLinkedParticipant && r._count.applications === 0,
  );

  const CATEGORIES = [
    "DAILY_ACTIVITIES", "COMMUNITY_ACCESS", "PERSONAL_CARE", "DOMESTIC_ASSISTANCE",
    "TRANSPORT", "RESPITE", "OVERNIGHT", "COMPLEX_CARE", "PSYCHOSOCIAL",
    "SIL", "SDA", "ALLIED_HEALTH", "BEHAVIOUR_SUPPORT",
  ];

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview",      label: "Overview" },
    { key: "browse",        label: "Browse Requests" },
    { key: "referrals",     label: "My Referrals",  badge: referralTotal || undefined },
    { key: "participants",  label: "Participants",   badge: linkedParticipants.length || undefined },
    { key: "service-gaps",  label: "Service Gaps",  badge: stats?.unfilledReferrals || undefined },
    { key: "connections",   label: "Connections",   badge: pendingConnections.length || undefined },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {showLinkModal && (
        <LinkParticipantModal
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => void loadAll()}
        />
      )}
      {showReferralModal && (
        <PostReferralModal
          participants={linkedParticipants}
          onClose={() => setShowReferralModal(false)}
          onSuccess={() => { void loadReferrals(); void loadAll(); }}
        />
      )}

      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Plan Manager Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {summary && summary.unreadNotifications > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-600">
                {summary.unreadNotifications}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowReferralModal(true)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Post Referral
            </button>
            <Link
              href="/profile/plan-manager"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Active Cases"      value={stats.activeParticipantCases} accent="indigo" />
            <StatCard label="Open Referrals"    value={stats.openReferrals}          accent="indigo" />
            <StatCard label="Urgent"            value={stats.urgentReferrals}        accent="red" />
            <StatCard label="Unfilled Gaps"     value={stats.unfilledReferrals}      accent="amber" />
            <StatCard label="Pending Requests"  value={summary?.connectionCounts.pending ?? 0} accent="amber" />
            <StatCard label="Recent Invoices"   value={stats.recentInvoiceCount} />
          </div>
        )}

        {/* Quick action bar */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("browse")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            Browse Requests
          </button>
          <button
            type="button"
            onClick={() => { setShowReferralModal(true); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            Post Referral
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("participants")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            View Participants
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("service-gaps")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            Service Gaps
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex gap-0 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Overview tab ───────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Pending connection requests */}
            {pendingConnections.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-3">
                  {pendingConnections.length} pending connection request{pendingConnections.length !== 1 ? "s" : ""}
                </h3>
                <div className="space-y-2">
                  {pendingConnections.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between bg-white rounded-lg border border-amber-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{conn.client.name}</p>
                        <p className="text-xs text-gray-500">{conn.client.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => respondToConnection(conn.id, "ACCEPT")}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                          Accept
                        </button>
                        <button type="button" onClick={() => respondToConnection(conn.id, "DECLINE")}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent invoices */}
            <div>
              <SectionTitle>Recent Invoices</SectionTitle>
              {(summary?.recentInvoices ?? []).length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  No invoices yet. Invoices from providers will appear here.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">From</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Participant</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Job</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(summary?.recentInvoices ?? []).slice(0, 10).map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{new Date(inv.sentAt).toLocaleDateString("en-AU")}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{inv.sender.name}</td>
                          <td className="px-4 py-3 text-gray-600">{inv.participant?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{inv.job?.title ?? "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{inv.hours ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Linked participant quick view */}
            {linkedParticipants.length > 0 && (
              <div>
                <SectionTitle>Linked Participants</SectionTitle>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {linkedParticipants.slice(0, 6).map((lp) => (
                    <div key={lp.connectionId} className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="font-medium text-gray-900 text-sm">{lp.participant.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {lp.participant.participantProfile?.ndisNumber ? `NDIS: ${lp.participant.participantProfile.ndisNumber}` : lp.participant.email ?? ""}
                      </p>
                      <div className="mt-2 flex gap-3 text-xs text-gray-600">
                        <span>{lp.openJobs} open jobs</span>
                        <span>{lp.invoiceCount} invoices</span>
                      </div>
                      <Link
                        href={`/dashboard/plan-manager/participants/${lp.participant.id}`}
                        className="mt-2 block text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View case →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Browse Requests tab ────────────────────────────────────────────── */}
        {activeTab === "browse" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Browse Support Requests</SectionTitle>
              <span className="text-sm text-gray-500">{loadBoardTotal} requests</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                value={lbCategory}
                onChange={(e) => { setLbCategory(e.target.value); setLbPage(1); void loadLoadBoard(); }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
              <select
                value={lbUrgency}
                onChange={(e) => { setLbUrgency(e.target.value); setLbPage(1); void loadLoadBoard(); }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All urgency</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="URGENT">Urgent</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="FLEXIBLE">Flexible</option>
              </select>
              <input
                value={lbSuburb}
                onChange={(e) => setLbSuburb(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setLbPage(1); void loadLoadBoard(); } }}
                placeholder="Filter by suburb…"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer self-center">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    // Filter to linked participants only — toggle by clearing category
                    if (e.target.checked) setLbCategory("linked");
                    else setLbCategory("");
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                My participants only
              </label>
            </div>

            {loadBoard.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                No open requests found.
              </div>
            ) : (
              <div className="space-y-3">
                {loadBoard.map((req) => (
                  <div
                    key={req.id}
                    className={`bg-white rounded-xl border p-4 ${req.isLinkedParticipant ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm">{req.title}</p>
                          {req.isLinkedParticipant && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 font-medium">
                              My participant
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {req.category.replace(/_/g, " ")} · {req.suburb}, {req.state}
                          {req.forParticipant ? ` · for ${req.forParticipant.name}` : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <UrgencyBadge urgency={req.urgency} />
                        <span className="text-xs text-gray-400">{req._count.applications} responses</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(req.scheduledStartAt).toLocaleDateString("en-AU")}
                        {req.totalHours ? ` · ${req.totalHours}h` : ""}
                      </span>
                      <span className="text-xs text-gray-400">Posted by {req.postedBy.name}</span>
                      <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowReferralModal(true);
                          }}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Refer provider
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                disabled={lbPage <= 1}
                onClick={() => { setLbPage((p) => p - 1); void loadLoadBoard(); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {lbPage}</span>
              <button
                type="button"
                disabled={lbPage * 20 >= loadBoardTotal}
                onClick={() => { setLbPage((p) => p + 1); void loadLoadBoard(); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Referrals tab ──────────────────────────────────────────────────── */}
        {activeTab === "referrals" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>My Referrals</SectionTitle>
              <div className="flex gap-3">
                <select
                  value={refStatus}
                  onChange={(e) => { setRefStatus(e.target.value); setRefPage(1); void loadReferrals(); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowReferralModal(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  + Post Referral
                </button>
              </div>
            </div>

            {referrals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                No referrals posted yet. Post a referral to source providers for linked participants.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Participant</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Urgency</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Responses</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{ref.title}</td>
                        <td className="px-4 py-3 text-gray-600">{ref.forParticipant?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{ref.category.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3"><UrgencyBadge urgency={ref.urgency} /></td>
                        <td className="px-4 py-3"><StatusBadge status={ref.status} /></td>
                        <td className="px-4 py-3 text-gray-600 text-center">{ref._count.applications}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(ref.createdAt).toLocaleDateString("en-AU")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <button type="button" disabled={refPage <= 1}
                onClick={() => { setRefPage((p) => p - 1); void loadReferrals(); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {refPage} · {referralTotal} total</span>
              <button type="button" disabled={refPage * 20 >= referralTotal}
                onClick={() => { setRefPage((p) => p + 1); void loadReferrals(); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Participants tab ───────────────────────────────────────────────── */}
        {activeTab === "participants" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Linked Participants</SectionTitle>
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                + Link Participant
              </button>
            </div>

            {linkedParticipants.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                No linked participants yet. Send a connection request or wait for participants to find you.
              </div>
            ) : (
              <div className="space-y-3">
                {linkedParticipants.map((lp) => (
                  <div key={lp.connectionId} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{lp.participant.name}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          {lp.participant.email && <span>{lp.participant.email}</span>}
                          {lp.participant.participantProfile?.ndisNumber && (
                            <span>NDIS: {lp.participant.participantProfile.ndisNumber}</span>
                          )}
                          {lp.participant.participantProfile?.fundingManagementType && (
                            <span>{lp.participant.participantProfile.fundingManagementType.replace(/_/g, " ")}</span>
                          )}
                          {lp.participant.participantProfile?.primaryDisability && (
                            <span>{lp.participant.participantProfile.primaryDisability}</span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-4 text-xs text-gray-600">
                          <span className={lp.openJobs > 0 ? "font-medium text-amber-600" : ""}>
                            {lp.openJobs} open jobs
                          </span>
                          <span>{lp.invoiceCount} invoices</span>
                          <span>Linked since {new Date(lp.linkedSince).toLocaleDateString("en-AU")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link
                          href={`/dashboard/plan-manager/participants/${lp.participant.id}`}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          View case
                        </Link>
                        <button
                          type="button"
                          onClick={() => setShowReferralModal(true)}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          Post referral
                        </button>
                      </div>
                    </div>

                    {/* NDIS plan dates */}
                    {(lp.participant.participantProfile?.ndisStartDate || lp.participant.participantProfile?.ndisEndDate) && (
                      <div className="mt-2 flex gap-4 text-xs text-gray-400">
                        {lp.participant.participantProfile.ndisStartDate && (
                          <span>Plan start: {new Date(lp.participant.participantProfile.ndisStartDate).toLocaleDateString("en-AU")}</span>
                        )}
                        {lp.participant.participantProfile.ndisEndDate && (
                          <span>Plan end: {new Date(lp.participant.participantProfile.ndisEndDate).toLocaleDateString("en-AU")}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Service Gaps tab ───────────────────────────────────────────────── */}
        {activeTab === "service-gaps" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Service Gaps — Unfilled Needs</SectionTitle>
              <p className="text-sm text-gray-500">Open requests with no provider responses yet</p>
            </div>
            {!loadBoard.length ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                Load the Browse Requests tab first to populate service gaps.
              </div>
            ) : serviceGaps.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                No unfilled service gaps for your linked participants.
              </div>
            ) : (
              <div className="space-y-3">
                {serviceGaps.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{req.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {req.category.replace(/_/g, " ")} · {req.suburb}, {req.state}
                          {req.forParticipant ? ` · for ${req.forParticipant.name}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <UrgencyBadge urgency={req.urgency} />
                        <span className="text-xs text-red-500 font-medium">No responses</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        Start: {new Date(req.scheduledStartAt).toLocaleDateString("en-AU")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowReferralModal(true)}
                        className="ml-auto rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
                      >
                        Post sourcing request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Connections tab ────────────────────────────────────────────────── */}
        {activeTab === "connections" && (
          <div className="space-y-6">
            {pendingConnections.length > 0 && (
              <div>
                <SectionTitle>Pending Requests</SectionTitle>
                <div className="space-y-3">
                  {pendingConnections.map((conn) => (
                    <div key={conn.id} className="bg-white rounded-xl border border-amber-200 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{conn.client.name}</p>
                        <p className="text-xs text-gray-500">{conn.client.email}</p>
                        <StatusBadge status="PENDING" />
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => respondToConnection(conn.id, "ACCEPT")}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                          Accept
                        </button>
                        <button type="button" onClick={() => respondToConnection(conn.id, "DECLINE")}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionTitle>All Connections ({connections.length})</SectionTitle>
              {connections.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
                  No connections yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <div key={conn.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{conn.client.name}</p>
                        <p className="text-xs text-gray-500">{conn.client.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Since {new Date(conn.createdAt).toLocaleDateString("en-AU")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={conn.status} />
                        {conn.status === "ACCEPTED" && (
                          <Link
                            href={`/dashboard/plan-manager/participants/${conn.client.id}`}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            View case
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowLinkModal(true)}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                + Send new connection request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
