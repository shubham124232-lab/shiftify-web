"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { presignUpload, putFileToR2 } from "@/lib/api/profile";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { ApplyModal } from "@/components/jobs/ApplyModal";
import { SAFETY_CHECKLIST } from "@/lib/constants/safety";
import { URGENCY_STYLE } from "@/lib/constants/job-filters";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ShieldAlert, HeartPulse, Users, KeyRound, PhoneCall, ListChecks, Flag, Send, MessageSquare } from "lucide-react";

interface Applicant {
  id: string; applicantUserId: string; status: string; createdAt: string;
  applicant: {
    id: string; name: string; avatarUrl?: string | null;
    workerProfile?: { rating: number; totalReviews: number; hourlyRate: number | string | null; servicesOffered: string[] | null; experienceLevel: string | null; suburb: string | null; state: string | null; travelRadiusKm: number | null } | null;
    providerProfile?: { averageRating: number; totalRatings: number; coreServices: string[] | null } | null;
  };
}
interface Message   { id: string; senderId: string; senderName: string; body: string; createdAt: string; }
interface JobInvite {
  id: string; status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  amountAud: number | string | null; mockReceiptRef: string | null;
  invitedUser: { id: string; name: string; avatarUrl: string | null };
}
interface MeetAndGreet {
  id: string; proposedByUserId: string; type: "PHONE" | "VIDEO" | "IN_PERSON";
  proposedTimes: string[]; location: string | null; cost: "FREE" | "AGREED_RATE" | "DISCUSS";
  topics: string[] | null; status: "PROPOSED" | "CONFIRMED" | "DECLINED"; confirmedTime: string | null;
  proposedBy: { id: string; name: string };
}
interface ChangeRequest {
  id: string; requestedByUserId: string;
  changeType: "TIME" | "DURATION" | "DATE" | "RECURRENCE" | "RATE" | "OTHER";
  reason: string | null; alternative: { details?: string } | string; status: "PENDING" | "ACCEPTED" | "REJECTED";
  requestedBy: { id: string; name: string };
}

interface JobDetail {
  id: string; title: string; description: string | null;
  category: string; urgency: string; suburb: string; state: string;
  scheduledStartAt: string; scheduledEndAt: string | null;
  totalHours: number | null; status: string; postedAt: string;
  postedBy: { id: string; name: string };
  addressLine?: string | null;
  workerConfirmedAt?: string | null;
  promotedFromCancellation?: boolean;
  selectedApplicant?: { id: string; name: string } | null;
  assignedWorker?: { id: string; name: string } | null;
  applications?: Applicant[];
  locationNotes?: string | null;
  riskSafetyNotes?: string | null;
  medicalNotes?: string | null;
  behaviourNotes?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  workerPreferences?: { safetyFlags?: Record<string, boolean> } | null;
  featuredUntil?: string | null;
  meetAndGreets?: MeetAndGreet[];
  changeRequests?: ChangeRequest[];
  closedOutcome?: "FILLED_CONFIRMED" | "CANCELLED" | "NOT_PROCEEDING" | "UNFILLED" | null;
  runningLateNotifiedAt?: string | null;
  runningLateMinutes?: number | null;
  workerPrivateNote?: string | null;
}

interface TeamWorker { id: string; name: string | null; username: string; }
interface Review {
  id: string; raterUserId: string; revieweeUserId: string;
  rating: number; comment: string | null; createdAt: string;
  reliabilityRating?: number | null; communicationRating?: number | null;
  qualityRating?: number | null; privateConcern?: string | null;
  revieweeResponse?: string | null; reportedByReviewee?: boolean;
  rater: { id: string; name: string; avatarUrl?: string | null };
  reviewee: { id: string; name: string; avatarUrl?: string | null };
}
interface Assignment {
  id: string; requestId: string; workerUserId: string;
  status: "ASSIGNED" | "COMPLETED" | "CANCELLED"; assignedAt: string;
  workerUser: { id: string; name: string; avatarUrl?: string | null };
}

// One tint per hero fact, drawn from the existing accent tokens so the four
// tiles are told apart at a glance without introducing new colours.
const HERO_TILE_TONES = [
  { bg: "var(--td-lastmin-soft)", ink: "var(--td-lastmin)" },
  { bg: "var(--td-routine-soft)", ink: "var(--td-routine)" },
  { bg: "var(--td-urgent-soft)",  ink: "var(--td-urgent)" },
  { bg: "var(--td-chip-soft)",    ink: "var(--td-chip-ink)" },
  { bg: "var(--td-rapid-soft)",   ink: "var(--td-rapid)" },
];
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  OPEN:         { bg: "var(--td-pink-tint)", color: "var(--td-pink-hover)" },
  ASSIGNED:     { bg: "var(--td-grey)", color: "var(--td-ink-700)" },
  IN_PROGRESS:  { bg: "var(--td-dark-text)", color: "var(--td-white)" },
  CONFIRMED:    { bg: "var(--td-border)", color: "var(--td-dark-text)" },
  COMPLETED:    { bg: "var(--td-grey-tint)", color: "var(--td-muted-dark)" },
  CANCELLED:    { bg: "var(--td-pink)", color: "var(--td-white)" },
};
// Pricing V2 §8 / 15.2 — must match Backend's FEATURED_SHIFT_CONFIG exactly.
const FEATURED_SHIFT_INFO: Record<string, { priceAud: number; durationLabel: string }> = {
  RAPID:       { priceAud: 19.99, durationLabel: "up to 60 minutes or until filled" },
  URGENT:      { priceAud: 14.99, durationLabel: "up to 24 hours or until filled" },
  LAST_MINUTE: { priceAud: 9.99,  durationLabel: "up to 48 hours or until filled" },
  ROUTINE:     { priceAud: 21.99, durationLabel: "up to 7 days or until filled" },
};

const APP_STATUS_COLOR: Record<string, string> = {
  INTERESTED:  "var(--td-ink-800)",
  SHORTLISTED: "var(--td-ink-700)",
  SELECTED:    "var(--td-ink-700)",
  DECLINED:    "var(--td-pink-hover)",
  WITHDRAWN:   "var(--td-muted)",
};

// SC journey M03 "Compare responses" — shared by the sequential applicant
// list and the side-by-side compare table so the two views never drift.
function applicantDisplay(app: Applicant) {
  const wp = app.applicant.workerProfile;
  const pp = app.applicant.providerProfile;
  const rating = wp?.rating ?? pp?.averageRating ?? 0;
  const reviewCount = wp?.totalReviews ?? pp?.totalRatings ?? 0;
  const rate = wp?.hourlyRate;
  const services = (wp?.servicesOffered ?? pp?.coreServices ?? []) as string[];
  const skillLabels = services.map(s => JOB_CATEGORIES.find(c => c.value === s)?.label ?? s).slice(0, 3);
  const coverage = wp?.state
    ? `Covers ${wp.state}${wp.suburb ? ` (${wp.suburb}` : ""}${wp.travelRadiusKm ? `${wp.suburb ? ", " : " ("}${wp.travelRadiusKm}km radius)` : wp.suburb ? ")" : ""}`
    : null;
  return { wp, pp, rating, reviewCount, rate, skillLabels, coverage };
}

export default function JobDetailPage() {
  const { id }           = useParams<{ id: string }>();
  const router           = useRouter();
  const { user, activeRole } = useAuth();

  const [job,       setJob]       = useState<JobDetail | null>(null);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [msgBody,   setMsgBody]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [acting,    setActing]    = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [teamWorkers,    setTeamWorkers]    = useState<TeamWorker[]>([]);
  const [pickedWorkerId, setPickedWorkerId] = useState("");
  const [assigning,      setAssigning]      = useState(false);
  const [reviews,        setReviews]        = useState<Review[]>([]);
  const [reviewRating,   setReviewRating]   = useState(0);
  const [reviewComment,  setReviewComment]  = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reliabilityRating,   setReliabilityRating]   = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [qualityRating,       setQualityRating]       = useState(0);
  const [privateConcern,      setPrivateConcern]      = useState("");
  const [respondingReviewId, setRespondingReviewId] = useState<string | null>(null);
  const [responseText,       setResponseText]       = useState("");
  const [assignments,    setAssignments]    = useState<Assignment[]>([]);
  const [rosterActing,   setRosterActing]   = useState(false);
  const [showFlagForm,   setShowFlagForm]   = useState(false);
  const [flagCategory,   setFlagCategory]   = useState("SAFETY");
  const [flagDescription, setFlagDescription] = useState("");
  const [flagging,       setFlagging]       = useState(false);
  const [flagSent,       setFlagSent]       = useState(false);
  const [flagDraftId,    setFlagDraftId]    = useState<string | null>(null);
  const [flagEvidence,   setFlagEvidence]   = useState<string[]>([]);
  const [flagUploading,  setFlagUploading]  = useState(false);
  const [flagSavingDraft, setFlagSavingDraft] = useState(false);
  const [flagDraftSaved, setFlagDraftSaved] = useState(false);
  const [blocking,       setBlocking]       = useState(false);
  const [blocked,        setBlocked]        = useState(false);
  const [invites,        setInvites]        = useState<JobInvite[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonCategory, setCancelReasonCategory] = useState("");
  const [notifyReplacements, setNotifyReplacements] = useState(true);
  const [cancelSummary, setCancelSummary] = useState<{ promotedTitle: string | null } | null>(null);
  const [compareView, setCompareView] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeType, setChangeType] = useState("TIME");
  const [changeReason, setChangeReason] = useState("");
  const [changeAlternative, setChangeAlternative] = useState("");
  const [showMagForm, setShowMagForm] = useState(false);
  const [magType, setMagType] = useState("PHONE");
  const [magTimes, setMagTimes] = useState(["", "", ""]);
  const [magLocation, setMagLocation] = useState("");
  const [magCost, setMagCost] = useState("FREE");
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closeOutcome, setCloseOutcome] = useState("FILLED_CONFIRMED");
  const [closeFeedback, setCloseFeedback] = useState("");
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [showRunningLate, setShowRunningLate] = useState(false);
  const [lateMinutes, setLateMinutes] = useState("15");
  const [privateNote, setPrivateNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function loadJob() {
    return api.get<{ job: JobDetail }>(`/jobs/${id}`)
      .then(r => setJob(r.job))
      .catch(e => setError(e.message));
  }

  function loadMessages() {
    api.get<{ messages: Message[] }>(`/jobs/${id}/messages`)
      .then(r => setMessages(r.messages ?? []))
      .catch(() => {});
  }

  function loadReviews() {
    api.get<{ reviews: Review[] }>(`/jobs/${id}/reviews`)
      .then(r => setReviews(r.reviews ?? []))
      .catch(() => {});
  }

  function loadAssignments() {
    // 403s for users with no roster access (not the poster, not on the roster) — ignore silently.
    api.get<{ assignments: Assignment[] }>(`/jobs/${id}/assignments`)
      .then(r => setAssignments(r.assignments ?? []))
      .catch(() => {});
  }

  function loadInvites() {
    // 403 for a non-poster — ignore silently, this section only renders for the owner.
    api.get<{ invites: JobInvite[] }>(`/job-invites/${id}`)
      .then(r => setInvites(r.invites ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (job?.workerPrivateNote != null) setPrivateNote(job.workerPrivateNote);
  }, [job?.workerPrivateNote]);

  useEffect(() => {
    loadJob().finally(() => setLoading(false));
    loadMessages();
    loadReviews();
    loadAssignments();
    if (activeRole === "COORDINATOR" || activeRole === "PROVIDER") loadInvites();
    pollRef.current = setInterval(loadMessages, 30_000);
    // Viewing this job's message thread marks it read for the current user.
    api.patch(`/jobs/${id}/messages/read`, {}).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeRole !== "PROVIDER") return;
    api.get<{ users: TeamWorker[] }>("/linking/workers")
      .then(r => setTeamWorkers(r.users ?? []))
      .catch(() => {});
  }, [activeRole]);

  // Resume an in-progress incident report for this job instead of starting blank.
  useEffect(() => {
    api.get<{ incident: { id: string; category: string; description: string | null; evidenceUrls: string[] } | null }>(`/jobs/${id}/incidents/draft`)
      .then(r => {
        if (!r.incident) return;
        setFlagDraftId(r.incident.id);
        setFlagCategory(r.incident.category);
        setFlagDescription(r.incident.description ?? "");
        setFlagEvidence(r.incident.evidenceUrls ?? []);
        setShowFlagForm(true);
      })
      .catch(() => {});
  }, [id]);

  async function sendMessage() {
    if (!msgBody.trim()) return;
    setSending(true);
    try {
      await api.post(`/jobs/${id}/messages`, { body: msgBody.trim() });
      setMsgBody("");
      loadMessages();
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  }

  async function submitFlag() {
    setFlagging(true);
    try {
      if (flagDraftId) {
        // Finishing a saved draft — completes it and flips DRAFT → OPEN.
        await api.patch(`/jobs/${id}/incidents/${flagDraftId}`, {
          category: flagCategory, description: flagDescription.trim() || undefined, finalize: true,
        });
      } else {
        await api.post(`/jobs/${id}/incidents`, {
          category: flagCategory, description: flagDescription.trim() || undefined, evidenceUrls: flagEvidence,
        });
      }
      setFlagSent(true);
      setShowFlagForm(false);
      setFlagDescription("");
      setFlagDraftId(null);
      setFlagEvidence([]);
    } catch (e: any) { setError(e.message); }
    finally { setFlagging(false); }
  }

  // "Save as draft" — lets the reporter come back later instead of losing the form.
  async function saveFlagDraft() {
    setFlagSavingDraft(true);
    try {
      if (flagDraftId) {
        await api.patch(`/jobs/${id}/incidents/${flagDraftId}`, {
          category: flagCategory, description: flagDescription.trim() || undefined,
        });
      } else {
        const res = await api.post<{ incident: { id: string } }>(`/jobs/${id}/incidents`, {
          category: flagCategory, description: flagDescription.trim() || undefined, evidenceUrls: flagEvidence, isDraft: true,
        });
        setFlagDraftId(res.incident.id);
      }
      setFlagDraftSaved(true);
      setTimeout(() => setFlagDraftSaved(false), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setFlagSavingDraft(false); }
  }

  // Evidence attachment — presign → PUT to R2 → keep the public URL, then either
  // send it with the initial POST or attach it to an existing draft via PATCH.
  async function uploadFlagEvidence(file: File) {
    setFlagUploading(true);
    try {
      const { uploadUrl, publicUrl } = await presignUpload("incident-evidence", file.name, file.type);
      await putFileToR2(uploadUrl, file);
      if (flagDraftId) {
        await api.patch(`/jobs/${id}/incidents/${flagDraftId}`, { evidenceUrls: [publicUrl] });
      }
      setFlagEvidence(prev => [...prev, publicUrl]);
    } catch (e: any) { setError(e.message); }
    finally { setFlagUploading(false); }
  }

  async function blockOtherParty() {
    if (!job || !otherPartyId) return;
    setBlocking(true);
    try {
      await api.post("/users/blocks", { blockedUserId: otherPartyId, blockMessages: true, hideProfile: true });
      setBlocked(true);
    } catch (e: any) { setError(e.message); }
    finally { setBlocking(false); }
  }

  // Provider was selected on this job and needs to hand it to one of their team
  // workers — PATCH /jobs/:id/assign-worker existed on the backend with no UI.
  async function assignWorker() {
    if (!pickedWorkerId) return;
    setAssigning(true);
    try {
      await api.patch(`/jobs/${id}/assign-worker`, { workerUserId: pickedWorkerId });
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setAssigning(false); }
  }

  async function jobAction(action: string, payload: Record<string, any> = {}) {
    setActing(true);
    try {
      await api.patch(`/jobs/${id}/${action}`, payload);
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  // Structured cancellation (SW doc Window 35) — reason category + optional
  // "notify suitable replacement workers" broadcast, replacing the bare cancel call.
  async function submitCancel() {
    setActing(true);
    try {
      const res = await api.patch<{ job: { cancelled: any; promoted: { title: string } | null } }>(`/jobs/${id}/cancel`, {
        reasonCategory: cancelReasonCategory || undefined,
        notifyReplacements,
      });
      const promoted = res.job.promoted;
      setCancelSummary({ promotedTitle: promoted?.title ?? null });
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  // Worker's 3-way response to a confirmed selection (Window 30 "Decline")
  async function declineAssignment() {
    setActing(true);
    try {
      await api.patch(`/jobs/${id}/decline-assignment`, {});
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  // Worker requests a change instead of accepting as-is (Window 34)
  async function submitChangeRequest() {
    if (!changeAlternative.trim()) return;
    setActing(true);
    try {
      await api.post(`/jobs/${id}/change-request`, {
        changeType,
        reason: changeReason.trim() || undefined,
        alternative: { details: changeAlternative.trim() },
      });
      setShowChangeForm(false);
      setChangeReason("");
      setChangeAlternative("");
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  async function respondToChangeRequest(crId: string, action: "ACCEPT" | "REJECT") {
    setActing(true);
    try {
      await api.patch(`/jobs/change-request/${crId}/respond`, { action });
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  // Meet-and-greet propose/respond (Window 29)
  async function submitMeetAndGreet() {
    const times = magTimes.map(t => t.trim()).filter(Boolean);
    if (times.length === 0) return;
    setActing(true);
    try {
      await api.post(`/jobs/${id}/meet-and-greet`, {
        type: magType,
        proposedTimes: times,
        location: magLocation.trim() || undefined,
        cost: magCost,
      });
      setShowMagForm(false);
      setMagTimes(["", "", ""]);
      setMagLocation("");
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  // Close connection (Window 38) — a marketplace-outcome tag, separate from job.status.
  async function submitCloseConnection() {
    setActing(true);
    try {
      await api.patch(`/jobs/${id}/close-connection`, { outcome: closeOutcome, feedback: closeFeedback.trim() || undefined });
      setShowCloseForm(false);
      setCloseFeedback("");
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  // Block or limit contact (Window 44) — from a message sender, block further
  // messages and hide your own profile from them.
  async function blockUser(blockedUserId: string) {
    setBlockingUserId(blockedUserId);
    try {
      await api.post("/users/blocks", { blockedUserId, blockMessages: true, hideProfile: true });
    } catch (e: any) { setError(e.message); }
    finally { setBlockingUserId(null); }
  }

  // Running late (Window 33) — a one-tap notice to the poster, not a GPS check-in.
  async function submitRunningLate() {
    setActing(true);
    try {
      await api.patch(`/jobs/${id}/running-late`, { minutesLate: Number(lateMinutes) });
      setShowRunningLate(false);
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  // Private note (Window 33) — visible only to the worker who wrote it.
  async function savePrivateNote() {
    setActing(true);
    try {
      await api.patch(`/jobs/${id}/worker-note`, { note: privateNote });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  async function respondToMag(magId: string, action: "CONFIRM" | "DECLINE", confirmedTime?: string) {
    setActing(true);
    try {
      await api.patch(`/jobs/meet-and-greet/${magId}/respond`, { action, confirmedTime });
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  const [findingReplacement, setFindingReplacement] = useState(false);
  const [featuring, setFeaturing] = useState(false);
  async function findReplacement() {
    setFindingReplacement(true);
    try {
      const res = await api.post<{ job: { id: string } }>(`/jobs/${id}/replacement`, {});
      router.push(`/jobs/${res.job.id}`);
    } catch (e: any) { setError(e.message); }
    finally { setFindingReplacement(false); }
  }

  async function featureShift() {
    setFeaturing(true);
    try {
      await api.post(`/jobs/${id}/featured-shift`, {});
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setFeaturing(false); }
  }

  async function submitReview() {
    if (!reviewRating) return;
    setSubmittingReview(true);
    try {
      await api.post(`/jobs/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        reliabilityRating: reliabilityRating || undefined,
        communicationRating: communicationRating || undefined,
        qualityRating: qualityRating || undefined,
        privateConcern: privateConcern.trim() || undefined,
      });
      setReviewRating(0);
      setReviewComment("");
      setReliabilityRating(0);
      setCommunicationRating(0);
      setQualityRating(0);
      setPrivateConcern("");
      loadReviews();
    } catch (e: any) { setError(e.message); }
    finally { setSubmittingReview(false); }
  }

  async function submitReviewResponse(reviewId: string) {
    if (!responseText.trim()) return;
    try {
      await api.patch(`/reviews/${reviewId}/respond`, { response: responseText.trim() });
      setRespondingReviewId(null);
      setResponseText("");
      loadReviews();
    } catch (e: any) { setError(e.message); }
  }

  async function reportReview(reviewId: string) {
    if (!confirm("Report this review to Shiftify for review?")) return;
    try {
      await api.post(`/reviews/${reviewId}/report`, { reason: "Reported from job page" });
      loadReviews();
    } catch (e: any) { setError(e.message); }
  }

  async function addToRoster(workerUserId: string) {
    setRosterActing(true);
    try {
      await api.post(`/jobs/${id}/assignments`, { workerUserId });
      loadAssignments();
    } catch (e: any) { setError(e.message); }
    finally { setRosterActing(false); }
  }

  async function updateAssignment(assignmentId: string, status: "COMPLETED" | "CANCELLED") {
    setRosterActing(true);
    try {
      await api.patch(`/jobs/${id}/assignments/${assignmentId}/status`, { status });
      loadAssignments();
    } catch (e: any) { setError(e.message); }
    finally { setRosterActing(false); }
  }

  async function appAction(applicationId: string, action: "select" | "shortlist" | "decline" | "withdraw") {
    setActing(true);
    try {
      await api.patch(`/jobs/${id}/applications/${applicationId}/${action}`, {});
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  if (loading) return <div style={{ padding: 40, color: "var(--td-muted)" }}>Loading...</div>;
  if (error && !job) return <div style={{ padding: 40, color: "var(--td-pink-hover)" }}>{error}</div>;
  if (!job) return null;

  const isOwner  = user?.id === job.postedBy.id;
  const isWorker = ["SUPPORT_WORKER", "PROVIDER"].includes(activeRole ?? "");
  const urg = URGENCY_STYLE[job.urgency] ?? URGENCY_STYLE.ROUTINE;
  const sta = STATUS_STYLE[job.status]  ?? { bg: "var(--td-grey)", color: "var(--td-dark-text-soft)" };
  const catLabel = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;
  const canInvoice = ["COMPLETED", "CONFIRMED"].includes(job.status);
  const ownApp = isWorker ? job.applications?.find(a => a.applicantUserId === user?.id) : null;
  const needsAssignment =
    activeRole === "PROVIDER" &&
    job.status === "ASSIGNED" &&
    job.selectedApplicant?.id === user?.id &&
    !job.assignedWorker;
  const workerPartyId = job.assignedWorker?.id ?? job.selectedApplicant?.id;
  const isReviewParty = job.status === "CONFIRMED" && (user?.id === job.postedBy.id || user?.id === workerPartyId);
  const otherPartyId = isOwner ? workerPartyId : job.postedBy.id;
  const myReview = reviews.find(r => r.raterUserId === user?.id);

  const heroFacts = [
    { label: "Location", value: job.addressLine || `${job.suburb}, ${job.state}` },
    { label: "Starts", value: new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) },
    ...(job.scheduledEndAt
      ? [{ label: "Ends", value: new Date(job.scheduledEndAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) }]
      : []),
    ...(job.totalHours ? [{ label: "Duration", value: `${job.totalHours} hours` }] : []),
    ...(job.assignedWorker ? [{ label: "Assigned to", value: job.assignedWorker.name }] : []),
  ];

  return (
    <>
      {/* Hero — carries identity, status and the shift's key facts. */}
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1100px] px-6 py-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <span aria-hidden>&larr;</span> Back
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.07em] text-white"
              style={{ background: urg.solid }}
            >
              {job.urgency.replace("_", " ")}
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-700 ring-1 ring-inset ring-slate-200">
              {job.status.replace("_", " ")}
            </span>
            <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-500 ring-1 ring-inset ring-slate-200">
              {catLabel}
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl text-[30px] font-bold leading-[1.2] tracking-[-0.02em] text-slate-900">
            {job.title}
          </h1>
          <p className="mt-2 text-[13px] text-slate-500">
            Posted by <span className="font-medium text-slate-900">{job.postedBy.name}</span>
          </p>

          {job.description && (
            <p className="mt-5 max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-slate-600">
              {job.description}
            </p>
          )}

          {/* Each fact gets its own tint so the four read as separate facts, not one block. */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroFacts.map((f, i) => {
              const tone = HERO_TILE_TONES[i % HERO_TILE_TONES.length];
              return (
                <div key={f.label} className="rounded-xl px-4 py-3.5 ring-1 ring-inset ring-black/[0.04]" style={{ background: tone.bg }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: tone.ink }}>
                    {f.label}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold leading-snug text-slate-900">{f.value}</p>
                </div>
              );
            })}
          </div>

          {job.status === "ASSIGNED" && !job.addressLine && (isOwner || workerPartyId === user?.id) && (
            <p className="mt-4 text-[12px] font-medium text-slate-500">
              {job.workerConfirmedAt
                ? "Confirmed — full address released above"
                : isOwner
                  ? "Awaiting worker/provider confirmation — the exact address stays hidden until they accept"
                  : "Accept the assignment below to see the exact address"}
            </p>
          )}
        </div>
      </header>

      <div className="bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-5 px-6 py-7">

        {error && (
          <div className="rounded-xl border border-[var(--td-rapid-soft)] bg-[var(--td-rapid-soft)] px-4 py-3 text-[13px] text-[var(--td-rapid)]">
            {error}
          </div>
        )}

        {job.promotedFromCancellation && (
          <div className="rounded-xl border border-[var(--td-rapid-soft)] bg-[var(--td-rapid-soft)] px-4 py-3 text-[13px] text-[var(--td-rapid)]">
            This request was reposted as urgent after the original worker/provider cancelled close to the start time.
          </div>
        )}

        {/* Before/during support (SW doc Windows 32-33) — worker-only shortcuts */}
        {workerPartyId === user?.id && ["ASSIGNED", "IN_PROGRESS"].includes(job.status) && (
          <Card>
            <CardHeader><CardTitle>Before & during support</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <div className="flex gap-2.5 flex-wrap">
                {job.addressLine && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.addressLine)}`}
                    target="_blank" rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline">Get directions</Button>
                  </a>
                )}
                <Button size="sm" variant="outline" onClick={() => setShowRunningLate(v => !v)}>
                  I'm running late
                </Button>
              </div>

              {job.runningLateNotifiedAt && (
                <p className="text-xs text-amber-700 m-0">
                  You notified the poster you're running about {job.runningLateMinutes} minutes late.
                </p>
              )}

              {showRunningLate && (
                <div className="flex gap-2.5 items-center p-3.5 border border-slate-200 rounded-lg bg-slate-50">
                  <select value={lateMinutes} onChange={e => setLateMinutes(e.target.value)}
                    className="h-9 px-2.5 border border-slate-200 rounded-md text-sm">
                    {[5, 10, 15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} minutes</option>)}
                  </select>
                  <Button size="sm" disabled={acting} onClick={submitRunningLate}>Notify poster</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowRunningLate(false)}>Cancel</Button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Private note (only visible to you)
                </label>
                <textarea value={privateNote} onChange={e => setPrivateNote(e.target.value)}
                  rows={2} placeholder="Jot down anything you want to remember about this shift..."
                  className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm resize-y" />
                <div className="flex items-center gap-2.5 mt-1.5">
                  <Button size="sm" variant="outline" disabled={acting} onClick={savePrivateNote}>Save note</Button>
                  {noteSaved && <span className="text-xs text-green-700">Saved</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment information (SW doc Window 41) — 0%-commission messaging, worker/poster only */}
        {(isOwner || workerPartyId === user?.id) && ["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CONFIRMED"].includes(job.status) && (
          <Card>
            <CardHeader><CardTitle>Payment information</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <p className="text-sm text-slate-600 m-0">
                Shiftify takes <strong>0% commission</strong> — payment is arranged directly between you and the other party at the rate you agreed.
              </p>
              <p className="text-xs text-slate-400 m-0">
                Invoices created on this request are a shared record for your own files, not a payment request processed by Shiftify.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Care & Safety Notes — visible to poster and worker, shown only if any note was provided */}
        {(() => {
          const checkedFlags = SAFETY_CHECKLIST.filter(f => job.workerPreferences?.safetyFlags?.[f.key]);
          const notes = [
            checkedFlags.length > 0 && {
              icon: ListChecks, label: "Safety & property checklist",
              body: <ul className="m-0 list-disc space-y-0.5 pl-4">{checkedFlags.map(f => <li key={f.key}>{f.label}</li>)}</ul>,
            },
            job.riskSafetyNotes  && { icon: ShieldAlert, label: "Risk & safety",        body: job.riskSafetyNotes },
            job.medicalNotes     && { icon: HeartPulse,  label: "Medical considerations", body: job.medicalNotes },
            job.behaviourNotes   && { icon: Users,       label: "Behaviour notes",      body: job.behaviourNotes },
            job.locationNotes    && { icon: KeyRound,    label: "Access & location",    body: job.locationNotes },
            job.emergencyContactName && {
              icon: PhoneCall, label: "Emergency contact for this shift",
              body: [job.emergencyContactName,
                     job.emergencyContactRelationship && `(${job.emergencyContactRelationship})`,
                     job.emergencyContactPhone && `— ${job.emergencyContactPhone}`].filter(Boolean).join(" "),
            },
          ].filter(Boolean) as { icon: LucideIcon; label: string; body: React.ReactNode }[];

          if (notes.length === 0) return null;
          return (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="flex items-center gap-3 bg-[var(--td-rapid-soft)] px-6 py-4">
                <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--td-rapid)]">
                  <ShieldAlert className="h-[18px] w-[18px]" strokeWidth={2.1} />
                </span>
                <div>
                  <h2 className="text-[15px] font-bold leading-tight text-slate-900">Care &amp; safety notes</h2>
                  <p className="mt-0.5 text-[12px] text-slate-500">Read these before the shift starts.</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {notes.map(n => {
                  const Icon = n.icon;
                  return (
                    <div key={n.label} className="flex gap-3.5 px-6 py-4">
                      <Icon aria-hidden className="mt-0.5 h-[15px] w-[15px] shrink-0 text-slate-400" strokeWidth={1.9} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{n.label}</p>
                        <div className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">{n.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* Manual replacement — cancelled job, outside the automatic 4-hour promotion window (SC-04-05) */}
        {isOwner && job.status === "CANCELLED" && !job.promotedFromCancellation && (
          <Card>
            <CardContent className="pt-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-800">Need a replacement for this cancelled request?</p>
                <p className="text-xs text-slate-500 mt-0.5">Creates a new open request with the same details — you can adjust anything before publishing.</p>
              </div>
              <Button onClick={findReplacement} disabled={findingReplacement}>
                {findingReplacement ? "Creating…" : "Find Replacement"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Close connection (SW doc Window 38) — marketplace outcome tag, not proof of delivery/payment */}
        {isOwner && (
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Close connection</CardTitle>
              {(!job.closedOutcome || (job.closedOutcome && !showCloseForm)) && (
                <Button size="sm" variant="outline" onClick={() => {
                  if (job.closedOutcome) { setCloseOutcome(job.closedOutcome); setCloseFeedback(""); }
                  setShowCloseForm(v => !v);
                }}>
                  {job.closedOutcome ? "Edit outcome" : "Save outcome"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {job.closedOutcome && !showCloseForm ? (
                <p className="text-sm text-slate-600 m-0">
                  Marked <strong>{job.closedOutcome.replace("_", " ").toLowerCase()}</strong>. This status isn't proof support was delivered and doesn't approve an invoice or payment.
                </p>
              ) : showCloseForm ? (
                <div className="flex flex-col gap-2.5 p-3.5 border border-slate-200 rounded-lg bg-slate-50">
                  <select value={closeOutcome} onChange={e => setCloseOutcome(e.target.value)}
                    className="h-9 px-2.5 border border-slate-200 rounded-md text-sm">
                    <option value="FILLED_CONFIRMED">Filled and confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="NOT_PROCEEDING">Not proceeding</option>
                    <option value="UNFILLED">Unfilled</option>
                  </select>
                  <textarea value={closeFeedback} onChange={e => setCloseFeedback(e.target.value)}
                    placeholder="Private feedback (optional)" rows={2}
                    className="px-2.5 py-2 border border-slate-200 rounded-md text-sm resize-y" />
                  <div className="flex gap-2.5">
                    <Button size="sm" disabled={acting} onClick={submitCloseConnection}>Save outcome</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCloseForm(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 m-0">Not closed yet — captures only the marketplace outcome, no invoicing or payment approval.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Owner actions */}
        {isOwner && (
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {job.status === "IN_PROGRESS" && (
                <Button variant="outline" disabled={acting} onClick={() => jobAction("confirm")}>Confirm Completion</Button>
              )}
              {["OPEN", "ASSIGNED"].includes(job.status) && (
                <Button variant="outline" disabled={acting} onClick={() => setShowCancelModal(true)}>Cancel Job</Button>
              )}
              {canInvoice && (
                <Button variant="outline" onClick={() => router.push(`/jobs/${id}/invoice`)}>Create Invoice</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Featured Shift (Pricing V2 §8) — poster can pin/label an open request */}
        {isOwner && job.status === "OPEN" && FEATURED_SHIFT_INFO[job.urgency] && (
          <Card>
            <CardContent className="pt-5 flex items-center justify-between gap-4 flex-wrap">
              {job.featuredUntil && new Date(job.featuredUntil) > new Date() ? (
                <div>
                  <p className="text-sm font-semibold text-amber-700">⭐ Featured</p>
                  <p className="text-xs text-slate-500 mt-0.5">Featured until {new Date(job.featuredUntil).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Feature this request — ${FEATURED_SHIFT_INFO[job.urgency].priceAud.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Pins and labels your request {FEATURED_SHIFT_INFO[job.urgency].durationLabel}. Never changes genuine urgency ordering.</p>
                  </div>
                  <Button variant="outline" disabled={featuring} onClick={featureShift}>
                    {featuring ? "Purchasing…" : "Purchase Featured Shift"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Worker: apply or show own application status */}
        {isWorker && !ownApp && job.status === "OPEN" && (
          <Card>
            <CardHeader><CardTitle>Connect to this support request</CardTitle></CardHeader>
            <CardContent className="flex gap-2.5 items-center">
              <Button onClick={() => setShowApply(true)}>Connect</Button>
              <span className="text-[13px] text-slate-400">Review, confirm you're available and meet the requirements, and Connect — takes under a minute</span>
            </CardContent>
          </Card>
        )}

        {isWorker && ownApp && (
          <div style={{
            background: ownApp.status === "WITHDRAWN" ? "var(--td-grey-tint)" : ownApp.status === "DECLINED" ? "var(--td-pink-soft)" : "var(--td-grey-tint)",
            border: `1px solid ${ownApp.status === "WITHDRAWN" ? "var(--td-border)" : ownApp.status === "DECLINED" ? "var(--td-pink-tint)" : "var(--td-border)"}`,
            borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 13, color: APP_STATUS_COLOR[ownApp.status] ?? "var(--td-dark-text-soft)", flex: 1 }}>
              {ownApp.status === "WITHDRAWN" ? "You withdrew your application."
                : ownApp.status === "DECLINED" ? "Your application was declined."
                : ownApp.status === "SELECTED" ? "You have been selected for this job."
                : `Application submitted — status: ${ownApp.status}`}
            </span>
            {!["SELECTED", "WITHDRAWN", "DECLINED"].includes(ownApp.status) && (
              <Button size="sm" variant="outline" disabled={acting}
                onClick={() => appAction(ownApp.id, "withdraw")}
                style={{ borderColor: "var(--td-pink)", color: "var(--td-pink)" }}>
                Withdraw
              </Button>
            )}
          </div>
        )}

        {/* Provider: assign a team worker after being selected */}
        {needsAssignment && (
          <Card>
            <CardHeader><CardTitle>Assign a team worker</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {teamWorkers.length === 0 ? (
                <span style={{ fontSize: 13, color: "var(--td-muted)" }}>
                  No team workers yet — add one from the Team page first.
                </span>
              ) : (
                <>
                  <select
                    value={pickedWorkerId}
                    onChange={e => setPickedWorkerId(e.target.value)}
                    style={{ height: 36, padding: "0 10px", border: "1.5px solid var(--td-border)", borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="">Select a worker...</option>
                    {teamWorkers.map(w => (
                      <option key={w.id} value={w.id}>{w.name || w.username}</option>
                    ))}
                  </select>
                  <Button size="sm" disabled={!pickedWorkerId || assigning} onClick={assignWorker}>
                    {assigning ? "Assigning..." : "Assign"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Worker's 3-way response to a confirmed selection (SW doc Window 30) */}
        {isWorker && (job.assignedWorker?.id === user?.id || job.selectedApplicant?.id === user?.id) && job.status === "ASSIGNED" && !job.workerConfirmedAt && (
          <Card>
            <CardHeader><CardTitle>Your confirmed support</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-slate-700 m-0">
                Accept this assignment to confirm you'll be attending — this releases the exact address and the participant's contact details to you. If something needs to change first, request a change instead of declining outright.
              </p>
              <div className="flex gap-2.5 flex-wrap">
                <Button disabled={acting} onClick={() => jobAction("confirm-assignment")}>
                  {acting ? "Confirming..." : "Accept confirmed support"}
                </Button>
                <Button variant="outline" disabled={acting} onClick={() => setShowChangeForm(v => !v)}>
                  Request change
                </Button>
                <Button variant="outline" disabled={acting} onClick={declineAssignment}
                  className="border-red-500 text-red-500 hover:bg-red-50">
                  Decline
                </Button>
              </div>
              {showChangeForm && (
                <div className="flex flex-col gap-2.5 p-3.5 border border-slate-200 rounded-lg bg-slate-50">
                  <select value={changeType} onChange={e => setChangeType(e.target.value)}
                    className="h-9 px-2.5 border border-slate-200 rounded-md text-sm">
                    <option value="TIME">Time</option>
                    <option value="DURATION">Duration</option>
                    <option value="DATE">Date</option>
                    <option value="RECURRENCE">Recurrence</option>
                    <option value="RATE">Rate</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input value={changeReason} onChange={e => setChangeReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="h-9 px-2.5 border border-slate-200 rounded-md text-sm" />
                  <textarea value={changeAlternative} onChange={e => setChangeAlternative(e.target.value)}
                    placeholder="Proposed new details" rows={2}
                    className="px-2.5 py-2 border border-slate-200 rounded-md text-sm resize-y" />
                  <div className="flex gap-2.5">
                    <Button size="sm" disabled={acting || !changeAlternative.trim()} onClick={submitChangeRequest}>Send request</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowChangeForm(false)}>Keep original</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Change requests thread */}
        {(job.changeRequests?.length ?? 0) > 0 && (
          <Card>
            <CardHeader><CardTitle>Change requests</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {job.changeRequests!.map(cr => (
                <div key={cr.id} className="flex items-center gap-3 px-3.5 py-2.5 border border-slate-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-800">{cr.requestedBy.name} requested a {cr.changeType.toLowerCase()} change</span>
                    <p className="text-xs text-slate-500 mt-0.5 mb-0">{typeof cr.alternative === "string" ? cr.alternative : cr.alternative?.details ?? ""}{cr.reason ? ` — ${cr.reason}` : ""}</p>
                  </div>
                  {isOwner && cr.status === "PENDING" ? (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" disabled={acting} onClick={() => respondToChangeRequest(cr.id, "ACCEPT")}>Accept</Button>
                      <Button size="sm" variant="outline" disabled={acting} onClick={() => respondToChangeRequest(cr.id, "REJECT")}>Reject</Button>
                    </div>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      cr.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" : cr.status === "REJECTED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                    }`}>{cr.status}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Meet-and-greet (SW doc Window 29) — offered while OPEN or ASSIGNED-unconfirmed */}
        {["OPEN", "ASSIGNED"].includes(job.status) && (isOwner || ownApp || job.assignedWorker?.id === user?.id || job.selectedApplicant?.id === user?.id) && (
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Meet-and-greet</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowMagForm(v => !v)}>Propose</Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {showMagForm && (
                <div className="flex flex-col gap-2.5 p-3.5 border border-slate-200 rounded-lg bg-slate-50">
                  <select value={magType} onChange={e => setMagType(e.target.value)}
                    className="h-9 px-2.5 border border-slate-200 rounded-md text-sm">
                    <option value="PHONE">Phone</option>
                    <option value="VIDEO">Video</option>
                    <option value="IN_PERSON">In person</option>
                  </select>
                  {magTimes.map((t, i) => (
                    <input key={i} value={t} onChange={e => setMagTimes(arr => arr.map((v, idx) => idx === i ? e.target.value : v))}
                      placeholder={`Proposed time ${i + 1}${i === 0 ? "" : " (optional)"}`} type="datetime-local"
                      className="h-9 px-2.5 border border-slate-200 rounded-md text-sm" />
                  ))}
                  {magType === "IN_PERSON" && (
                    <input value={magLocation} onChange={e => setMagLocation(e.target.value)}
                      placeholder="Agreed safe location" className="h-9 px-2.5 border border-slate-200 rounded-md text-sm" />
                  )}
                  <select value={magCost} onChange={e => setMagCost(e.target.value)}
                    className="h-9 px-2.5 border border-slate-200 rounded-md text-sm">
                    <option value="FREE">Free</option>
                    <option value="AGREED_RATE">Agreed rate</option>
                    <option value="DISCUSS">To discuss</option>
                  </select>
                  <div className="flex gap-2.5">
                    <Button size="sm" disabled={acting || !magTimes.some(t => t.trim())} onClick={submitMeetAndGreet}>Send proposal</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowMagForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              {(job.meetAndGreets?.length ?? 0) === 0 ? (
                <p className="text-sm text-slate-400 m-0">No meet-and-greet proposed yet.</p>
              ) : job.meetAndGreets!.map(mag => (
                <div key={mag.id} className="flex items-center gap-3 px-3.5 py-2.5 border border-slate-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-800">{mag.proposedBy.name} proposed a {mag.type.replace("_", " ").toLowerCase()} meet-and-greet</span>
                    <p className="text-xs text-slate-500 mt-0.5 mb-0">
                      {mag.status === "CONFIRMED" && mag.confirmedTime
                        ? `Confirmed for ${new Date(mag.confirmedTime).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}`
                        : mag.proposedTimes.map(t => new Date(t).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })).join(" · ")}
                      {mag.location ? ` — ${mag.location}` : ""} · {mag.cost.replace("_", " ").toLowerCase()}
                    </p>
                  </div>
                  {mag.status === "PROPOSED" && mag.proposedByUserId !== user?.id ? (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" disabled={acting} onClick={() => respondToMag(mag.id, "CONFIRM", mag.proposedTimes[0])}>Confirm time</Button>
                      <Button size="sm" variant="outline" disabled={acting} onClick={() => respondToMag(mag.id, "DECLINE")}>Decline</Button>
                    </div>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      mag.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : mag.status === "DECLINED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                    }`}>{mag.status}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {isWorker && (job.assignedWorker?.id === user?.id || job.selectedApplicant?.id === user?.id) && job.status === "ASSIGNED" && job.workerConfirmedAt && (
          <Card>
            <CardHeader><CardTitle>Your actions</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", gap: 10 }}>
              <Button variant="outline" disabled={acting} onClick={() => jobAction("start")}>Mark Started</Button>
            </CardContent>
          </Card>
        )}
        {isWorker && (job.assignedWorker?.id === user?.id || job.selectedApplicant?.id === user?.id) && job.status === "IN_PROGRESS" && (
          <Card>
            <CardHeader><CardTitle>Your actions</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", gap: 10 }}>
              <Button variant="outline" disabled={acting} onClick={() => jobAction("complete")}>Mark Complete</Button>
            </CardContent>
          </Card>
        )}

        {/* Job Roster — additional workers beyond the single assigned-worker flow */}
        {(isOwner || assignments.some(a => a.workerUserId === user?.id)) && assignments.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Job Roster</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assignments.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", border: "1px solid var(--td-grey)", borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--td-dark-text-soft)" }}>{a.workerUser.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color:
                      a.status === "COMPLETED" ? "var(--td-ink-700)" : a.status === "CANCELLED" ? "var(--td-pink-hover)" : "var(--td-ink-800)" }}>
                      {a.status}
                    </span>
                    {a.status === "ASSIGNED" && a.workerUserId === user?.id && (
                      <Button size="sm" variant="outline" disabled={rosterActing} onClick={() => updateAssignment(a.id, "COMPLETED")}>Mark Complete</Button>
                    )}
                    {a.status === "ASSIGNED" && isOwner && (
                      <Button size="sm" variant="outline" disabled={rosterActing} onClick={() => updateAssignment(a.id, "CANCELLED")}>Remove</Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Reviews — visible once the job is confirmed complete */}
        {job.status === "CONFIRMED" && (
          <Card>
            <CardHeader><CardTitle>Reviews</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {isReviewParty && !myReview && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, border: "1.5px solid var(--td-border)", borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--td-dark-text-soft)" }}>Leave a review</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewRating(n)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0,
                          color: n <= reviewRating ? "var(--td-muted-dark)" : "var(--td-border)" }}>
                        ★
                      </button>
                    ))}
                  </div>
                  {([
                    ["Reliability", reliabilityRating, setReliabilityRating],
                    ["Communication", communicationRating, setCommunicationRating],
                    ["Quality of support", qualityRating, setQualityRating],
                  ] as const).map(([label, value, setValue]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--td-muted-dark)", width: 130 }}>{label}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setValue(n)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
                              color: n <= value ? "var(--td-muted-dark)" : "var(--td-border)" }}>
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                    placeholder="Optional comment (visible to the other party)..." maxLength={1000} rows={3}
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--td-border)", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
                  <textarea value={privateConcern} onChange={e => setPrivateConcern(e.target.value)}
                    placeholder="Private concern for Shiftify only (not shown to the other party)..." maxLength={1000} rows={2}
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--td-border)", background: "var(--td-grey-tint)", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
                  <Button size="sm" disabled={!reviewRating || submittingReview} onClick={submitReview}>
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              )}
              {reviews.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--td-muted)", margin: 0 }}>No reviews yet.</p>
              ) : (
                reviews.map(r => (
                  <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 3, paddingBottom: 10, borderBottom: "1px solid var(--td-grey)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--td-dark-text-soft)" }}>
                        {r.rater.name} → {r.reviewee.name}
                      </span>
                      <span style={{ color: "var(--td-muted-dark)", fontSize: 13 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    </div>
                    {(r.reliabilityRating || r.communicationRating || r.qualityRating) && (
                      <div style={{ fontSize: 11, color: "var(--td-muted)" }}>
                        {[
                          r.reliabilityRating && `Reliability ${r.reliabilityRating}★`,
                          r.communicationRating && `Communication ${r.communicationRating}★`,
                          r.qualityRating && `Quality ${r.qualityRating}★`,
                        ].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    {r.comment && <p style={{ fontSize: 13, color: "var(--td-dark-text-soft)", margin: 0 }}>{r.comment}</p>}
                    {r.privateConcern && (
                      <p style={{ fontSize: 12, color: "var(--td-ink-800)", background: "var(--td-grey-tint)", border: "1px solid var(--td-border)", borderRadius: 6, padding: "4px 8px", margin: 0 }}>
                        Private concern (only you can see this): {r.privateConcern}
                      </p>
                    )}
                    {r.revieweeResponse && (
                      <p style={{ fontSize: 12, color: "var(--td-dark-text-soft)", background: "var(--td-grey-tint)", border: "1px solid var(--td-border)", borderRadius: 6, padding: "4px 8px", margin: 0 }}>
                        {r.reviewee.name}&apos;s response: {r.revieweeResponse}
                      </p>
                    )}
                    {r.reportedByReviewee && (
                      <span style={{ fontSize: 11, color: "var(--td-pink-hover)" }}>Reported by {r.reviewee.name}</span>
                    )}
                    {r.revieweeUserId === user?.id && !r.revieweeResponse && (
                      respondingReviewId === r.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <textarea value={responseText} onChange={e => setResponseText(e.target.value)}
                            placeholder="Write a public response…" rows={2}
                            style={{ fontSize: 12, padding: 6, border: "1px solid var(--td-border)", borderRadius: 6 }} />
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button size="sm" onClick={() => submitReviewResponse(r.id)}>Submit</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setRespondingReviewId(null); setResponseText(""); }}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 12 }}>
                          <button type="button" onClick={() => setRespondingReviewId(r.id)}
                            style={{ fontSize: 11, color: "var(--td-ink-700)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Respond</button>
                          {!r.reportedByReviewee && (
                            <button type="button" onClick={() => reportReview(r.id)}
                              style={{ fontSize: 11, color: "var(--td-pink-hover)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Report</button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Invited (owner only, Coordinator free / Provider paid Direct Connect) */}
        {isOwner && job.status === "OPEN" && (activeRole === "COORDINATOR" || activeRole === "PROVIDER") && (
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Invited{invites.length > 0 ? ` (${invites.length})` : ""}</CardTitle>
              <Link href={`/workers/available?forJobId=${id}`}>
                <Button size="sm" variant="outline">Invite someone</Button>
              </Link>
            </CardHeader>
            {invites.length > 0 && (
              <CardContent>
                <div className="flex flex-col gap-2">
                  {invites.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 px-3.5 py-2.5 border border-slate-200 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                        {inv.invitedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800 flex-1 min-w-0 truncate">{inv.invitedUser.name}</span>
                      {inv.amountAud != null && (
                        <span className="text-xs font-semibold text-slate-500">${Number(inv.amountAud).toFixed(2)}{inv.mockReceiptRef ? " charged" : " if accepted"}</span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        inv.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700"
                        : inv.status === "DECLINED" ? "bg-slate-100 text-slate-500"
                        : inv.status === "WITHDRAWN" ? "bg-slate-100 text-slate-400"
                        : "bg-amber-50 text-amber-700"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Applicants (owner only) */}
        {isOwner && job.applications && job.applications.length > 0 && (
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Applicants ({job.applications.length})</CardTitle>
              {job.applications.length > 1 && (
                <Button size="sm" variant="outline" onClick={() => setCompareView(v => !v)}>
                  {compareView ? "List view" : "Compare"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {compareView && job.applications.length > 1 ? (
                /* SC journey M03 — side-by-side comparison instead of scrolling a sequential list */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[560px]">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-3 font-semibold">Applicant</th>
                        <th className="py-2 pr-3 font-semibold">Rating</th>
                        <th className="py-2 pr-3 font-semibold">Rate</th>
                        <th className="py-2 pr-3 font-semibold">Coverage</th>
                        <th className="py-2 pr-3 font-semibold">Skills</th>
                        <th className="py-2 pr-3 font-semibold">Applied</th>
                        <th className="py-2 pr-3 font-semibold">Status</th>
                        {job.status === "OPEN" && <th className="py-2 pr-3 font-semibold">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {job.applications.map(app => {
                        const { rating, reviewCount, rate, skillLabels, coverage } = applicantDisplay(app);
                        return (
                          <tr key={app.id} className="border-b border-slate-100 align-top">
                            <td className="py-2.5 pr-3">
                              <Link href={`/profile/${app.applicantUserId}`} className="font-semibold text-slate-800 hover:underline">{app.applicant.name}</Link>
                            </td>
                            <td className="py-2.5 pr-3 whitespace-nowrap">{reviewCount > 0 ? `★ ${rating.toFixed(1)} (${reviewCount})` : "—"}</td>
                            <td className="py-2.5 pr-3 whitespace-nowrap">{rate != null ? `$${Number(rate).toFixed(0)}/hr` : "—"}</td>
                            <td className="py-2.5 pr-3 text-xs text-slate-600">{coverage ?? "—"}</td>
                            <td className="py-2.5 pr-3">
                              <div className="flex gap-1 flex-wrap">
                                {skillLabels.length > 0 ? skillLabels.map(l => (
                                  <span key={l} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{l}</span>
                                )) : "—"}
                              </div>
                            </td>
                            <td className="py-2.5 pr-3 text-xs whitespace-nowrap">{new Date(app.createdAt).toLocaleDateString("en-AU")}</td>
                            <td className="py-2.5 pr-3 font-semibold whitespace-nowrap" style={{ color: APP_STATUS_COLOR[app.status] ?? "var(--td-muted)" }}>{app.status}</td>
                            {job.status === "OPEN" && (
                              <td className="py-2.5 pr-3">
                                {["INTERESTED", "SHORTLISTED"].includes(app.status) ? (
                                  <div className="flex gap-1.5">
                                    {app.status === "INTERESTED" && (
                                      <Button size="sm" variant="outline" disabled={acting} onClick={() => appAction(app.id, "shortlist")} style={{ borderColor: "var(--td-muted-dark)", color: "var(--td-muted-dark)" }}>Shortlist</Button>
                                    )}
                                    <Button size="sm" disabled={acting} onClick={() => appAction(app.id, "select")}>Select</Button>
                                    <Button size="sm" variant="outline" disabled={acting} onClick={() => appAction(app.id, "decline")} style={{ borderColor: "var(--td-pink)", color: "var(--td-pink)" }}>Decline</Button>
                                  </div>
                                ) : "—"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {job.applications.map(app => {
                  const { rating, reviewCount, rate, skillLabels, coverage } = applicantDisplay(app);
                  const wp = app.applicant.workerProfile;
                  const reviews = reviewCount;
                  return (
                  <div key={app.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1.5px solid var(--td-border)", borderRadius: 10 }}>
                    {app.applicant.avatarUrl ? (
                      <img src={app.applicant.avatarUrl} alt={app.applicant.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--td-border)", color: "var(--td-muted-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {app.applicant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/profile/${app.applicantUserId}`} style={{ fontSize: 14, fontWeight: 600, color: "var(--td-ink-800)", textDecoration: "none" }} className="hover:underline">
                        {app.applicant.name}
                      </Link>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                        {reviews > 0 && (
                          <span style={{ fontSize: 12, color: "var(--td-ink-700)", fontWeight: 600 }}>★ {rating.toFixed(1)} ({reviews})</span>
                        )}
                        {rate != null && (
                          <span style={{ fontSize: 12, color: "var(--td-ink-700)", fontWeight: 600 }}>${Number(rate).toFixed(0)}/hr</span>
                        )}
                        <span style={{ fontSize: 12, color: "var(--td-muted)" }}>{new Date(app.createdAt).toLocaleDateString("en-AU")}</span>
                      </div>
                      {coverage && (
                        <div style={{ fontSize: 11, color: "var(--td-muted-dark)", marginTop: 2 }}>📍 {coverage}</div>
                      )}
                      {skillLabels.length > 0 && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                          {skillLabels.map(label => (
                            <span key={label} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: "var(--td-grey)", color: "var(--td-dark-text-soft)" }}>{label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: APP_STATUS_COLOR[app.status] ?? "var(--td-muted)" }}>
                      {app.status}
                    </span>
                    {job.status === "OPEN" && ["INTERESTED", "SHORTLISTED"].includes(app.status) && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {app.status === "INTERESTED" && (
                          <Button size="sm" variant="outline" disabled={acting}
                            onClick={() => appAction(app.id, "shortlist")}
                            style={{ borderColor: "var(--td-muted-dark)", color: "var(--td-muted-dark)" }}>
                            Shortlist
                          </Button>
                        )}
                        <Button size="sm" disabled={acting} onClick={() => appAction(app.id, "select")}>
                          Select
                        </Button>
                        <Button size="sm" variant="outline" disabled={acting}
                          onClick={() => appAction(app.id, "decline")}
                          style={{ borderColor: "var(--td-pink)", color: "var(--td-pink)" }}>
                          Decline
                        </Button>
                      </div>
                    )}
                    {wp && !["DRAFT", "CANCELLED", "CONFIRMED"].includes(job.status) &&
                      !assignments.some(a => a.workerUserId === app.applicantUserId) && (
                      <Button size="sm" variant="outline" disabled={rosterActing}
                        onClick={() => addToRoster(app.applicantUserId)}>
                        + Add to Roster
                      </Button>
                    )}
                  </div>
                  );
                })}
              </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <MessageSquare className="h-[17px] w-[17px]" strokeWidth={2.1} />
            </span>
            <div className="flex-1">
              <h2 className="text-[15px] font-bold leading-tight text-slate-900">Messages</h2>
              <p className="mt-0.5 text-[12px] text-slate-500">
                {messages.length === 0 ? "Nothing sent yet" : `${messages.length} message${messages.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto px-6 py-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span aria-hidden className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <MessageSquare className="h-5 w-5" strokeWidth={1.9} />
                </span>
                <p className="text-[13px] font-semibold text-slate-900">No messages yet</p>
                <p className="mt-1 text-[12px] text-slate-500">Start the conversation below.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map(m => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
                      <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500">{mine ? "You" : m.senderName}</span>
                        <span>{new Date(m.createdAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" })}</span>
                        {!mine && (
                          <button
                            type="button"
                            onClick={() => blockUser(m.senderId)}
                            disabled={blockingUserId === m.senderId}
                            className="font-semibold text-slate-400 transition-colors hover:text-[var(--td-rapid)]"
                          >
                            {blockingUserId === m.senderId ? "Blocking…" : "Block"}
                          </button>
                        )}
                      </div>
                      <div
                        className={cn(
                          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
                          mine
                            ? "rounded-br-md bg-brand-600 text-white"
                            : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-700",
                        )}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <input
              value={msgBody}
              onChange={e => setMsgBody(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message…"
              className="h-11 flex-1 rounded-full border border-slate-200 bg-white px-4 text-[13.5px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !msgBody.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Send className="h-[17px] w-[17px]" strokeWidth={2.1} />
            </button>
          </div>
        </section>

        {/* Incident report — pilot safety gate */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--td-rapid-soft)] text-[var(--td-rapid)]">
              <Flag className="h-[16px] w-[16px]" strokeWidth={2.1} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold leading-tight text-slate-900">Report an issue</h2>
              <p className="mt-0.5 text-[12px] text-slate-500">Something unsafe or not right about this shift.</p>
            </div>
          </div>
          <div className="px-6 py-5">
            {flagSent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 13, color: "var(--td-dark-text-soft)", margin: 0 }}>Reported — an admin has been notified.</p>
                {otherPartyId && (
                  blocked ? (
                    <p style={{ fontSize: 12, color: "var(--td-muted-dark)", margin: 0 }}>This user is now blocked from messaging you and can no longer see your profile.</p>
                  ) : (
                    <Button size="sm" variant="outline" disabled={blocking} onClick={blockOtherParty}>
                      {blocking ? "Blocking…" : "Also block this user"}
                    </Button>
                  )
                )}
              </div>
            ) : !showFlagForm ? (
              <Button variant="outline" onClick={() => setShowFlagForm(true)}>
                Flag an incident
              </Button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 12, color: "var(--td-pink-hover)", background: "var(--td-pink-soft)", border: "1px solid var(--td-pink-tint)", borderRadius: 8, padding: "8px 12px", margin: 0 }}>
                  If this is a medical emergency or anyone is in immediate danger, call <strong>000</strong> now — don't wait for a report to be reviewed.
                </p>
                <select
                  value={flagCategory}
                  onChange={e => setFlagCategory(e.target.value)}
                  style={{ height: 40, padding: "0 12px", border: "1.5px solid var(--td-border)", borderRadius: 8, fontSize: 14 }}
                >
                  <option value="SAFETY">Safety concern</option>
                  <option value="NO_SHOW">No-show</option>
                  <option value="MISCONDUCT">Misconduct</option>
                  <option value="OTHER">Other</option>
                </select>
                <textarea
                  value={flagDescription}
                  onChange={e => setFlagDescription(e.target.value)}
                  placeholder="What happened? (optional)"
                  rows={3}
                  style={{ padding: 12, border: "1.5px solid var(--td-border)", borderRadius: 8, fontSize: 14, resize: "vertical" }}
                />

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--td-dark-text-soft)", marginBottom: 4 }}>
                    Evidence <span style={{ fontWeight: 400, color: "var(--td-muted)" }}>(optional — photos or documents)</span>
                  </label>
                  {flagEvidence.length > 0 && (
                    <ul style={{ margin: "0 0 6px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                      {flagEvidence.map((url, i) => (
                        <li key={url} style={{ fontSize: 12, color: "var(--td-dark-text-soft)", display: "flex", alignItems: "center", gap: 6 }}>
                          <i className="bi bi-paperclip" /> Attachment {i + 1}
                          <a href={url} target="_blank" rel="noreferrer" style={{ color: "var(--td-dark-text-soft)" }}>view</a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/webp,application/pdf"
                    disabled={flagUploading}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) uploadFlagEvidence(file);
                      e.target.value = "";
                    }}
                    style={{ fontSize: 12 }}
                  />
                  {flagUploading && <p style={{ fontSize: 12, color: "var(--td-muted-dark)", margin: "4px 0 0" }}>Uploading…</p>}
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Button onClick={submitFlag} disabled={flagging}>
                    {flagging ? "Reporting..." : "Submit report"}
                  </Button>
                  <Button variant="outline" onClick={saveFlagDraft} disabled={flagSavingDraft}>
                    {flagSavingDraft ? "Saving…" : "Save as draft"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowFlagForm(false)}>Cancel</Button>
                  {flagDraftSaved && <span style={{ fontSize: 12, color: "var(--td-dark-text-soft)" }}>Draft saved</span>}
                </div>
              </div>
            )}
          </div>
        </section>

        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5"
          onClick={() => { if (!cancelSummary) setShowCancelModal(false); }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md flex flex-col gap-3.5" onClick={e => e.stopPropagation()}>
            {cancelSummary ? (
              /* SW doc Window 36 — poster cancellation summary screen */
              <>
                <h3 className="text-base font-bold text-slate-800 m-0">Request cancelled</h3>
                <p className="text-sm text-slate-600 m-0">This request has been cancelled and the poster's applicants have been notified.</p>
                {cancelSummary.promotedTitle ? (
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 m-0">
                    A replacement request has been posted, and previous applicants plus matching saved searches have been notified.
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 m-0">No replacement request was created.</p>
                )}
                <div className="flex justify-end mt-1">
                  <Button onClick={() => { setShowCancelModal(false); setCancelSummary(null); }}>Done</Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-slate-800 m-0">Cancel this request</h3>
                <label className="text-xs font-semibold text-slate-500">Reason</label>
                <select value={cancelReasonCategory} onChange={e => setCancelReasonCategory(e.target.value)}
                  className="h-10 px-2.5 border border-slate-200 rounded-lg text-sm">
                  <option value="">Select a reason</option>
                  <option value="ILLNESS">Illness</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="SCHEDULING_CONFLICT">Scheduling conflict</option>
                  <option value="UNSAFE_OR_UNSUITABLE">Unsafe or unsuitable</option>
                  <option value="OTHER">Other</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={notifyReplacements} onChange={e => setNotifyReplacements(e.target.checked)} />
                  Notify suitable replacement workers
                </label>
                <div className="flex gap-2.5 justify-end mt-1">
                  <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Back</Button>
                  <Button disabled={acting} onClick={submitCancel} className="border-red-500 text-red-500">
                    {acting ? "Cancelling…" : "Confirm cancellation"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showApply && (
        <ApplyModal
          job={{
            id: job.id, title: job.title, suburb: job.suburb, state: job.state,
            scheduledStartAt: job.scheduledStartAt, scheduledEndAt: job.scheduledEndAt,
            totalHours: job.totalHours, urgency: job.urgency,
          }}
          onClose={() => setShowApply(false)}
          onSuccess={() => { setShowApply(false); loadJob(); }}
        />
      )}
    </>
  );
}
