"use client";

import { EditDetailsCard } from "@/components/jobs/EditDetailsCard";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { presignUpload, putFileToR2 } from "@/lib/api/profile";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { ApplyModal } from "@/components/jobs/ApplyModal";
import { CompletionRecordModal } from "@/components/jobs/CompletionRecordModal";
import { ProviderRespondModal } from "@/components/jobs/ProviderRespondModal";
import { ProviderEligibilityCard } from "@/components/jobs/ProviderEligibilityCard";
import { ShiftPassPrompt } from "@/components/jobs/post/shared";
import { SAFETY_CHECKLIST } from "@/lib/constants/safety";
import { RequestDetailsCard } from "@/components/jobs/request-details-card";
import { URGENCY_STYLE } from "@/lib/constants/job-filters";
import { cn } from "@/lib/utils";
import { ProviderLiveRequestPanel } from "@/components/jobs/ProviderLiveRequestPanel";
import { ApplicantOwnerTools } from "@/components/jobs/ApplicantOwnerTools";
import { AddToCalendarButton } from "@/components/jobs/AddToCalendarButton";
import type { LucideIcon } from "lucide-react";
import { ShieldAlert, HeartPulse, Users, KeyRound, PhoneCall, ListChecks, Flag, Send, MessageSquare } from "lucide-react";

interface Applicant {
  id: string; applicantUserId: string; status: string; createdAt: string;
  applicantRole?: string; note?: string | null; introduction?: string | null;
  ownerNote?: string | null; decisionReason?: string | null;
  rateResponse?: string | null; proposedRate?: number | string | null; availabilityType?: string | null;
  applicationData?: {
    providerResponse?: boolean; deliveryOption?: string;
    serviceCapability?: { services?: string; coverage?: string; complexSupports?: string; continuity?: string };
    nominatedWorkers?: { id: string; name: string }[];
    alternativeTime?: string; partialTasks?: string; clarificationQuestion?: string; alternativeProposal?: string;
  } | null;
  applicant: {
    id: string; name: string; avatarUrl?: string | null;
    phoneVerified?: boolean;
    documents?: { docType: string; expiryDate: string | null; status: string }[];
    workerProfile?: { rating: number; totalReviews: number; hourlyRate: number | string | null; servicesOffered: string[] | null; experienceLevel: string | null; suburb: string | null; state: string | null; travelRadiusKm: number | null } | null;
    providerProfile?: { averageRating: number; totalRatings: number; coreServices: string[] | null; businessName?: string | null } | null;
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
  postcode?: string | null;
  workerConfirmedAt?: string | null;
  createdAt?: string;
  liveStats?: { eligibleWorkers: number; responses: number } | null;
  viewerPermissions?: { canShortlist: boolean; canMessage: boolean; canConfirmBookings: boolean; canManageReplacements: boolean };
  promotedFromCancellation?: boolean;
  selectedApplicant?: { id: string; name: string } | null;
  assignedWorker?: { id: string; name: string } | null;
  applications?: Applicant[];
  _count?: { applications: number; messages: number };
  locationNotes?: string | null;
  riskSafetyNotes?: string | null;
  medicalNotes?: string | null;
  behaviourNotes?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  workerPreferences?: ({ safetyFlags?: Record<string, boolean> } & Record<string, unknown>) | null;
  // Posting-journey answers (rendered by RequestDetailsCard).
  selectedTasks?: unknown;
  safetyFlags?: Record<string, unknown> | null;
  fundingType?: string | null;
  budgetType?: string | null;
  budgetPerHour?: number | string | null;
  travelRequired?: string | null;
  timeFlexibility?: string | null;
  requestPurposeCategory?: string | null;
  recurrencePattern?: Record<string, unknown> | null;
  isRecurring?: boolean;
  supportGoal?: string | null;
  serviceDeliveryMode?: string | null;
  responsePreferences?: Record<string, unknown> | null;
  contactPreferences?: Record<string, unknown> | null;
  featuredUntil?: string | null;
  visibilityTarget?: string | null;
  applicationDeadlineAt?: string | null;
  postedByRoleLabel?: string;
  cancelledAt?: string | null;
  cancelledByRole?: string | null;
  cancelReason?: string | null;
  matchSummary?: { met: string[]; missing: string[] };
  meetAndGreets?: MeetAndGreet[];
  changeRequests?: ChangeRequest[];
  closedOutcome?: "FILLED_CONFIRMED" | "CANCELLED" | "NOT_PROCEEDING" | "UNFILLED" | null;
  runningLateNotifiedAt?: string | null;
  runningLateMinutes?: number | null;
  workerPrivateNote?: string | null;
}

interface TeamWorker { id: string; name: string | null; username: string; status?: string; }
interface Review {
  id: string; raterUserId: string; revieweeUserId: string;
  rating: number; comment: string | null; createdAt: string;
  reliabilityRating?: number | null; communicationRating?: number | null; organisationRating?: number | null;
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

// PR-M02 / SW doc status labels shown to the poster for each response.
const APP_STATUS_LABEL: Record<string, string> = {
  INTERESTED: "New", SHORTLISTED: "Shortlisted", SELECTED: "Confirmed", DECLINED: "Declined", WITHDRAWN: "Withdrawn", REQUEST_FILLED: "Filled",
};
const APP_STATUS_COLOR: Record<string, string> = {
  INTERESTED:  "var(--td-ink-800)",
  SHORTLISTED: "var(--td-ink-700)",
  SELECTED:    "var(--td-ink-700)",
  DECLINED:    "var(--td-pink-hover)",
  WITHDRAWN:   "var(--td-muted)",
};

const PROVIDER_DELIVERY_LABEL: Record<string, string> = {
  ORGANISATION_ONLY: "Organisation response — worker nominated later",
  INTERNAL_WORKER:   "Specific internal worker",
  SMALL_TEAM:        "Small team",
  ALTERNATIVE:       "Alternative service proposal",
};
const AVAILABILITY_LABEL: Record<string, string> = {
  YES_EXACT: "Available at the requested time", YES_ADJUSTED: "Available at an adjusted time",
  PARTIAL: "Can cover part of the request", DISCUSS: "Wants to discuss availability", UNAVAILABLE: "Unavailable",
};
const RATE_RESPONSE_LABEL: Record<string, string> = {
  ACCEPT: "accepts the posted rate", QUOTE_AFTER: "quote after discussion", DISCUSS: "to be discussed",
};
const CAPABILITY_LABEL: Record<string, string> = {
  services: "Services", coverage: "Coverage", complexSupports: "Complex supports", continuity: "Continuity",
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
  const [providerEligible, setProviderEligible] = useState(true);
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
  const [organisationRating,  setOrganisationRating]  = useState(0);
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
  const [bookmarked, setBookmarked] = useState(false);
  const [blocking,       setBlocking]       = useState(false);
  const [blocked,        setBlocked]        = useState(false);
  // SW doc Window 44 — block or limit contact.
  const [showBlockPanel, setShowBlockPanel] = useState(false);
  const [blkOption,      setBlkOption]      = useState<"MESSAGES" | "HIDE" | "REPORT_BLOCK">("MESSAGES");
  const [invites,        setInvites]        = useState<JobInvite[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonCategory, setCancelReasonCategory] = useState("");
  const [notifyReplacements, setNotifyReplacements] = useState(true);
  const [cancelSummary, setCancelSummary] = useState<{ promotedTitle: string | null } | null>(null);
  const [compareView, setCompareView] = useState(false);
  // The detail payload carries the top 10 responses; the rest are paged in on demand.
  const [moreApps, setMoreApps] = useState<Applicant[]>([]);
  const [appsPage, setAppsPage] = useState(1);
  const [loadingMoreApps, setLoadingMoreApps] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [cancelAck, setCancelAck] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [changeType, setChangeType] = useState("TIME");
  const [changeReason, setChangeReason] = useState("");
  const [changeAlternative, setChangeAlternative] = useState("");
  const [showMagForm, setShowMagForm] = useState(false);
  const [magType, setMagType] = useState("PHONE");
  const [magTimes, setMagTimes] = useState(["", "", ""]);
  const [magLocation, setMagLocation] = useState("");
  const [magCost, setMagCost] = useState("FREE");
  const [magTopics, setMagTopics] = useState<string[]>([]);
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
    try { if (id && localStorage.getItem(`shiftify_cancel_ack_${id}`)) setCancelAck(true); } catch { /* ignore */ }
  }, [id]);

  // Deep links such as /jobs/<id>#job-messages (My Connections → Message) scroll once the page has rendered.
  useEffect(() => {
    if (!job || typeof window === "undefined" || !window.location.hash) return;
    const t = setTimeout(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

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

  // The organisation already named a worker/team in its response — start the picker on that nominee.
  useEffect(() => {
    if (activeRole !== "PROVIDER" || pickedWorkerId || !job || teamWorkers.length === 0) return;
    const mine = job.applications?.find(a => a.applicantUserId === user?.id);
    const data = mine?.applicationData as { nominatedWorkerUserIds?: string[]; nominatedWorkers?: { id: string }[] } | undefined;
    const nominated = data?.nominatedWorkerUserIds?.[0] ?? data?.nominatedWorkers?.[0]?.id;
    if (nominated && teamWorkers.some(w => w.id === nominated && (!w.status || w.status === "ACTIVE"))) setPickedWorkerId(nominated);
  }, [activeRole, job, teamWorkers, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      await api.post("/users/blocks", {
        blockedUserId: otherPartyId,
        blockMessages: blkOption !== "HIDE",
        hideProfile: blkOption !== "MESSAGES",
        reportReason: blkOption === "REPORT_BLOCK" ? "Reported and blocked from the request page" : undefined,
      });
      setBlocked(true);
      setShowBlockPanel(false);
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
        reason: cancelNote.trim() || undefined,
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
    // datetime-local gives "YYYY-MM-DDTHH:mm" (no offset) — the API requires an ISO instant.
    const times = magTimes.map(t => t.trim()).filter(Boolean).map(t => new Date(t).toISOString());
    if (times.length === 0) return;
    setActing(true);
    try {
      await api.post(`/jobs/${id}/meet-and-greet`, {
        type: magType,
        proposedTimes: times,
        location: magLocation.trim() || undefined,
        cost: magCost,
        topics: magTopics.length ? magTopics : undefined,
      });
      setShowMagForm(false);
      setMagTopics([]);
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

  // Live-request controls (SC-O14 / SC-L12) and draft publishing (SC-L11 preview → post).
  const [replUrgency, setReplUrgency] = useState("");
  const [replReuse, setReplReuse] = useState<"ALL" | "TIME" | "REQUIREMENTS" | "RATE" | "NEW">("ALL");
  const [replStart, setReplStart] = useState("");
  const [replHours, setReplHours] = useState("");
  const [replRate, setReplRate] = useState("");
  const [showReplacement, setShowReplacement] = useState(false);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  async function liveAction(path: string, body?: unknown, notice?: string) {
    setActing(true); setLiveNotice(null);
    try {
      if (path === "rebroadcast") await api.post(`/jobs/${id}/rebroadcast`, {});
      else await api.patch(`/jobs/${id}/${path}`, body ?? {});
      if (notice) setLiveNotice(notice);
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  async function repeatSupport() {
    setActing(true);
    try {
      const res = await api.post<{ job: { id: string } }>(`/jobs/${id}/duplicate`, {});
      router.push(`/jobs/${res.job.id}`);
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  // Publishing is the chargeable action for a Coordinator/Provider: once the 10 introductory
  // actions are used the poster is offered a single Shift Pass instead of a dead-end error.
  const [publishNeedsPass, setPublishNeedsPass] = useState(false);

  async function publishDraft() {
    setActing(true);
    setError(null);
    setPublishNeedsPass(false);
    try {
      await api.patch(`/jobs/${id}/publish`, {});
      await loadJob();
    } catch (e: any) {
      if (e instanceof ApiError && e.code === "SUBSCRIPTION_LIMIT") setPublishNeedsPass(true);
      else setError(e.message);
    }
    finally { setActing(false); }
  }

  async function submitReplacement() {
    if (replReuse === "NEW") { router.push("/jobs/post"); return; }
    setFindingReplacement(true);
    try {
      const body: Record<string, unknown> = {};
      if (replUrgency) body.urgency = replUrgency;
      if (replReuse === "TIME") {
        if (replStart) body.scheduledStartAt = new Date(replStart).toISOString();
        if (replHours) body.totalHours = Number(replHours);
      }
      if (replReuse === "RATE" && replRate) body.budgetPerHour = Number(replRate);
      if (replReuse === "REQUIREMENTS") body.asDraft = true;
      const res = await api.post<{ job: { id: string } }>(`/jobs/${id}/replacement`, body);
      router.push(`/jobs/${res.job.id}`);
    } catch (e: any) { setError(e.message); }
    finally { setFindingReplacement(false); }
  }

  async function featureShift() {
    const info = FEATURED_SHIFT_INFO[job?.urgency ?? ""];
    if (info && !window.confirm(
      `Featured Shift — ${(job?.urgency ?? "").replace("_", "-").toLowerCase()} request
Board treatment: pinned and labelled Featured ${info.durationLabel}. It never changes genuine urgency ordering.
Price: $${info.priceAud.toFixed(2)}. Non-refundable once the promotion begins. Continue?`,
    )) return;
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
        organisationRating: organisationRating || undefined,
        privateConcern: privateConcern.trim() || undefined,
      });
      setReviewRating(0);
      setReviewComment("");
      setReliabilityRating(0);
      setCommunicationRating(0);
      setQualityRating(0);
      setOrganisationRating(0);
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

  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});
  async function appAction(applicationId: string, action: "select" | "shortlist" | "decline" | "withdraw") {
    setActing(true);
    try {
      await api.patch(`/jobs/${id}/applications/${applicationId}/${action}`, action === "decline" ? { reason: declineReasons[applicationId] || undefined } : {});
      await loadJob();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  }

  // Tell the sidebar whether this page is one of the viewer's own requests, so "My Requests" (not
  // "Find Support Opportunities") is the highlighted item.
  const ownsThisJob = !!job && user?.id === job.postedBy.id;
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("shiftify:job-owner", { detail: { id, owner: ownsThisJob } }));
  }, [id, ownsThisJob]);

  if (loading) return <div style={{ padding: 40, color: "var(--td-muted)" }}>Loading...</div>;
  if (error && !job) return <div style={{ padding: 40, color: "var(--td-pink-hover)" }}>{error}</div>;
  if (!job) return null;

  const isOwner  = user?.id === job.postedBy.id;
  const canShortlist = job.viewerPermissions?.canShortlist ?? true;
  const canConfirmBookings = job.viewerPermissions?.canConfirmBookings ?? true;
  const canMessage = job.viewerPermissions?.canMessage ?? true;
  const canManageReplacements = job.viewerPermissions?.canManageReplacements ?? true;
  const isWorker = ["SUPPORT_WORKER", "PROVIDER"].includes(activeRole ?? "");
  const urg = URGENCY_STYLE[job.urgency] ?? URGENCY_STYLE.ROUTINE;
  const sta = STATUS_STYLE[job.status]  ?? { bg: "var(--td-grey)", color: "var(--td-dark-text-soft)" };
  const catLabel = JOB_CATEGORIES.find(c => c.value === job.category)?.label ?? job.category;

  // Window 34 — the same change-request form is offered before and after the worker accepts.
  const changeFormEl = (
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
  );
  const canInvoice = ["COMPLETED", "CONFIRMED"].includes(job.status) && ["COORDINATOR", "PROVIDER", "SUPPORT_WORKER"].includes(activeRole as string);
  const allApps: Applicant[] = [
    ...(job.applications ?? []),
    ...moreApps.filter(m => !(job.applications ?? []).some(a => a.id === m.id)),
  ];
  async function loadMoreApps() {
    setLoadingMoreApps(true);
    try {
      const next = appsPage + 1; // page 1 (10 rows) already came with the job detail
      const r = await api.get<{ applications: Applicant[] }>(`/jobs/${id}/applications?page=${next}&limit=10`);
      setMoreApps(prev => [...prev, ...(r.applications ?? [])]);
      setAppsPage(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more responses");
    } finally {
      setLoadingMoreApps(false);
    }
  }
  const ownApp = isWorker ? job.applications?.find(a => a.applicantUserId === user?.id) : null;
  const isConnectedWorker = isWorker && (job.selectedApplicant?.id === user?.id || job.assignedWorker?.id === user?.id);
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
            {job.postedByRoleLabel && <span> · {job.postedByRoleLabel}</span>}
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

          {["ASSIGNED", "IN_PROGRESS"].includes(job.status) && job.workerConfirmedAt && (isOwner || workerPartyId === user?.id) && (
            <div className="mt-4"><AddToCalendarButton id={job.id} title={job.title} start={job.scheduledStartAt} end={job.scheduledEndAt} suburb={job.suburb} /></div>
          )}

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

        {/* Poster cancellation (SW doc Window 36) — what changed, for the worker who was chosen */}
        {isWorker && job.status === "CANCELLED" && (job.selectedApplicant?.id === user?.id || job.assignedWorker?.id === user?.id || ownApp?.status === "SELECTED") && !cancelAck && (
          <Card>
            <CardHeader><CardTitle>This support was cancelled</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cancelled support</dt><dd className="m-0 text-slate-800">{catLabel} · {new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cancelled</dt><dd className="m-0 text-slate-800">{job.cancelledAt ? new Date(job.cancelledAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "—"}{job.cancelledByRole ? ` by the ${job.cancelledByRole === "SUPPORT_WORKER" ? "worker" : "poster"}` : ""}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reason</dt><dd className="m-0 text-slate-800">{job.cancelReason || "No reason shared"}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Applies to</dt><dd className="m-0 text-slate-800">{job.isRecurring ? "This request, including its future sessions" : "This session only"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Payment</dt><dd className="m-0 text-slate-800">Support payment is arranged directly with the payer; any cancellation terms are the ones agreed with them. Shiftify does not take a commission.</dd></div>
              </dl>
              <div className="flex gap-2.5 flex-wrap">
                <Button onClick={() => { try { localStorage.setItem(`shiftify_cancel_ack_${job.id}`, "1"); } catch { /* ignore */ } setCancelAck(true); }}>Acknowledge</Button>
                <Button variant="outline" onClick={() => document.getElementById("job-messages")?.scrollIntoView({ behavior: "smooth" })}>Message</Button>
                <Button variant="outline" onClick={() => router.push("/jobs")}>View other work</Button>
              </div>
            </CardContent>
          </Card>
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
                {job.status === "ASSIGNED" && (
                  <Button size="sm" variant="outline" disabled={acting} onClick={async () => {
                    try { await api.post(`/jobs/${job.id}/messages`, { body: "Support did not start as planned. Please contact me to arrange next steps." }); loadMessages(); setNoteSaved(false); document.getElementById("job-messages")?.scrollIntoView({ behavior: "smooth" }); }
                    catch (e: any) { setError(e.message); }
                  }}>
                    Support did not start
                  </Button>
                )}
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

        <RequestDetailsCard job={job} isOwner={isOwner} />

        {/* Window 18 — profile match summary against the worker's own saved profile */}
        {isWorker && !isOwner && job.matchSummary && (job.matchSummary.met.length > 0 || job.matchSummary.missing.length > 0) && (
          <Card>
            <CardHeader><CardTitle>How this matches your profile</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {job.matchSummary.met.map(l => <span key={`m-${l}`} className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">✓ {l}</span>)}
              {job.matchSummary.missing.map(l => <span key={`x-${l}`} className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">⚠ {l} — to review</span>)}
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

        {/* Replacement support (SC-X01–X03) — cancelled job, outside the automatic 4-hour promotion window */}
        {isOwner && job.status === "CANCELLED" && !job.promotedFromCancellation && canManageReplacements && (
          <Card>
            <CardContent className="pt-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-slate-800">The worker/provider can no longer attend — find a replacement?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Choose how quickly replacement support is needed and what to reuse from the original request.</p>
                </div>
                {!showReplacement && <Button onClick={() => setShowReplacement(true)}>Find replacement</Button>}
              </div>
              {showReplacement && (
                <div className="flex flex-col gap-3 border border-slate-200 rounded-lg p-3.5 bg-slate-50">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">How quickly is replacement support needed?</label>
                    <select value={replUrgency} onChange={e => setReplUrgency(e.target.value)} className="h-9 px-2.5 border border-slate-200 rounded-md text-sm w-full">
                      <option value="">Keep original timing type</option>
                      <option value="RAPID">Rapid — within 60 minutes</option>
                      <option value="URGENT">Urgent — within 4 hours</option>
                      <option value="LAST_MINUTE">Last-Minute — within 48 hours</option>
                      <option value="ROUTINE">Routine replacement — more than 48 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Would you like to reuse the original request?</label>
                    <select value={replReuse} onChange={e => setReplReuse(e.target.value as typeof replReuse)} className="h-9 px-2.5 border border-slate-200 rounded-md text-sm w-full">
                      <option value="ALL">Use all original details</option>
                      <option value="TIME">Change time/duration</option>
                      <option value="REQUIREMENTS">Change requirements</option>
                      <option value="RATE">Change rate</option>
                      <option value="NEW">Start a new request</option>
                    </select>
                  </div>
                  {replReuse === "TIME" && (
                    <div className="flex gap-2.5 flex-wrap">
                      <input type="datetime-local" value={replStart} onChange={e => setReplStart(e.target.value)} className="h-9 px-2.5 border border-slate-200 rounded-md text-sm" />
                      <input type="number" min="0.5" step="0.5" placeholder="Hours" value={replHours} onChange={e => setReplHours(e.target.value)} className="h-9 px-2.5 border border-slate-200 rounded-md text-sm w-28" />
                    </div>
                  )}
                  {replReuse === "RATE" && (
                    <input type="number" min="1" step="0.01" placeholder="Rate per hour ($)" value={replRate} onChange={e => setReplRate(e.target.value)} className="h-9 px-2.5 border border-slate-200 rounded-md text-sm w-48" />
                  )}
                  {replReuse === "REQUIREMENTS" && (
                    <p className="text-xs text-slate-500 m-0">Saved as a draft so you can review it before it goes live.</p>
                  )}
                  <div className="flex gap-2.5">
                    <Button onClick={submitReplacement} disabled={findingReplacement}>
                      {findingReplacement ? "Creating…" : replReuse === "NEW" ? "Start new request" : "Review replacement"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowReplacement(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Draft (SC-L11 / PR-C01) — preview of what will be published; not visible to workers yet */}
        {isOwner && job.status === "DRAFT" && (
          <Card>
            <CardContent className="pt-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-800">Draft — not yet visible to workers</p>
                <p className="text-xs text-slate-500 mt-0.5">Review the details on this page. A request uses one action only when you publish it.</p>
              </div>
              <Button disabled={acting} onClick={publishDraft}>Publish request</Button>
              {publishNeedsPass && (
                <div className="w-full">
                  <ShiftPassPrompt onPurchased={() => { setPublishNeedsPass(false); void publishDraft(); }} onDismiss={() => setPublishNeedsPass(false)} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit essential details (R-11 / U-11 / L-12 / O-14) — poster, draft or open with nobody selected */}
        {isOwner && (job.status === "DRAFT" || (job.status === "OPEN" && !job.selectedApplicant)) && (
          <EditDetailsCard key={`${job.id}-${job.scheduledStartAt}-${job.suburb}`} job={job} onSaved={loadJob} />
        )}

        {/* Provider PR-LV01 live request control centre */}
        {isOwner && job.status === "OPEN" && activeRole === "PROVIDER" && (
          <ProviderLiveRequestPanel urgency={job.urgency} createdAt={job.createdAt ?? job.postedAt} scheduledStartAt={job.scheduledStartAt}
            paused={!!job.visibilityTarget?.startsWith("PAUSED:")} liveStats={job.liveStats} />
        )}

        {/* Live request controls (SC-O14 / SC-L12 / SC-M02) */}
        {isOwner && job.status === "OPEN" && (activeRole === "COORDINATOR" || activeRole === "PROVIDER" || activeRole === "PARTICIPANT") && (
          <Card>
            <CardHeader><CardTitle>Manage live request</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {job.visibilityTarget?.startsWith("PAUSED:") && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 m-0">
                  Paused — hidden from the boards and not accepting new connections.
                </p>
              )}
              <div className="flex gap-2.5 flex-wrap">
                {job.visibilityTarget?.startsWith("PAUSED:") ? (
                  <Button size="sm" variant="outline" disabled={acting} onClick={() => liveAction("resume", {}, "Request resumed.")}>Resume</Button>
                ) : (
                  <Button size="sm" variant="outline" disabled={acting} onClick={() => liveAction("pause", {}, "Request paused.")}>Pause</Button>
                )}
                {activeRole !== "PARTICIPANT" && (
                  <>
                    <Button size="sm" variant="outline" disabled={acting} onClick={() => liveAction("extend", { hours: 24 }, "Response window extended by 24 hours.")}>Extend 24h</Button>
                    <Button size="sm" variant="outline" disabled={acting} onClick={() => liveAction("rebroadcast", undefined, "Rebroadcast sent to matching professionals.")}>Rebroadcast</Button>
                    <Button size="sm" variant="outline" disabled={acting} onClick={repeatSupport}>{activeRole === "PROVIDER" ? "Duplicate as new request" : "Repeat"}</Button>
                  </>
                )}
                {activeRole !== "PARTICIPANT" && (
                  <Button size="sm" variant="outline" disabled={acting} onClick={() => setShowCancelModal(true)}>Close request</Button>
                )}
              </div>
              {liveNotice && <p className="text-xs text-emerald-700 m-0">{liveNotice}</p>}
              {job.applicationDeadlineAt && (
                <p className="text-xs text-slate-500 m-0">Responses accepted until {new Date(job.applicationDeadlineAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Close connection (SW doc Window 38) — marketplace outcome tag, not proof of delivery/payment */}
        {((isOwner && (job.status !== "OPEN" || !!job.selectedApplicant)) || isConnectedWorker) && (
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

        {/* Payment information (SW v3.0 Window 41) — boundary only, no payment tracking */}
        {isConnectedWorker && (
          <Card>
            <CardHeader><CardTitle>Payment information</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <p className="text-sm text-slate-600 m-0">
                Arrange invoicing and payment directly with the participant, nominee, provider, Support Coordinator or Plan Manager as applicable.
              </p>
              <p className="text-xs text-slate-500 m-0">
                Shiftify takes 0% commission and does not deduct a percentage from your agreed support amount.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Owner actions */}
        {isOwner && (
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {job.status === "COMPLETED" && (
                <Button variant="outline" disabled={acting} onClick={() => jobAction("confirm")}>Confirm Completion</Button>
              )}
              {["OPEN", "ASSIGNED"].includes(job.status) && (
                <Button variant="outline" disabled={acting} onClick={() => setShowCancelModal(true)}>Cancel request</Button>
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
        {activeRole === "PROVIDER" && isWorker && !isOwner && !ownApp && job.status === "OPEN" && (
          <ProviderEligibilityCard fundingType={job.fundingType} onEligibility={setProviderEligible} />
        )}
        {isWorker && !isOwner && (!ownApp || ownApp.status === "WITHDRAWN") && job.status === "OPEN" && (
          <Card>
            <CardHeader><CardTitle>{activeRole === "PROVIDER" ? "Respond to this request" : "Connect to this support request"}</CardTitle></CardHeader>
            <CardContent className="flex gap-2.5 items-center">
              <Button onClick={() => setShowApply(true)} disabled={activeRole === "PROVIDER" && !providerEligible}>{activeRole === "PROVIDER" ? "Respond as Provider" : "Connect"}</Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    if (bookmarked) await api.delete(`/jobs/${job.id}/save`);
                    else await api.patch(`/jobs/${job.id}/save`, { saved: true });
                    setBookmarked(!bookmarked);
                  } catch { /* the list page shows save errors; the detail page stays quiet */ }
                }}
              >
                {bookmarked ? "★ Saved" : "☆ Save"}
              </Button>
              <Button variant="ghost" onClick={() => document.getElementById("job-messages")?.scrollIntoView({ behavior: "smooth" })}>Ask a question</Button>
              <Button variant="ghost" onClick={() => document.getElementById("job-report")?.scrollIntoView({ behavior: "smooth" })}>Report concern</Button>
              <span className="text-[13px] text-slate-400">{activeRole === "PROVIDER" ? "Confirm your organisation can service this request, choose how you'd deliver it, and introduce your organisation" : "Review, confirm you're available and meet the requirements, and Connect — takes under a minute"}</span>
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
              {ownApp.status === "WITHDRAWN" ? (activeRole === "PROVIDER" ? "You withdrew your response." : "You withdrew your connection.")
                : ownApp.status === "DECLINED" ? (activeRole === "PROVIDER" ? "Unsuccessful — your organisation response was not taken forward." : "Your connection was not taken forward.")
                : ownApp.status === "SELECTED" ? (activeRole === "PROVIDER" ? "Accepted — your organisation has been selected. Nominate or confirm your delivery arrangement below." : "The initiator has selected you — review the arrangement and accept to confirm the support.")
                : ownApp.status === "REQUEST_FILLED" ? "This request was filled by someone else."
                : activeRole === "PROVIDER" ? `Organisation response ${ownApp.status === "SHORTLISTED" ? "shortlisted" : "submitted"} — waiting for the poster's decision.`
                : ownApp.status === "SHORTLISTED" ? "Connected — awaiting the initiator's decision (you are on their shortlist)." : "Connected — awaiting the initiator's decision. The request stays open until a worker is confirmed."}
            </span>
            {!["SELECTED", "WITHDRAWN", "DECLINED"].includes(ownApp.status) && (
              <Button size="sm" variant="outline" disabled={acting}
                onClick={() => appAction(ownApp.id, "withdraw")}
                style={{ borderColor: "var(--td-pink)", color: "var(--td-pink)" }}>
                Withdraw
              </Button>
            )}
            {!["SELECTED"].includes(ownApp.status) && (
              <Button size="sm" variant="ghost" onClick={() => router.push("/jobs")}>Browse other requests</Button>
            )}
          </div>
        )}

        {/* Provider: assign a team worker after being selected */}
        {needsAssignment && (
          <Card>
            <CardHeader><CardTitle>Allocate to your internal workforce</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {teamWorkers.length === 0 ? (
                <span style={{ fontSize: 13, color: "var(--td-muted)" }}>
                  No internal workers yet — add and activate one from Internal Workforce first.
                </span>
              ) : (
                <>
                  <select
                    value={pickedWorkerId}
                    onChange={e => setPickedWorkerId(e.target.value)}
                    style={{ height: 36, padding: "0 10px", border: "1.5px solid var(--td-border)", borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="">Select a worker...</option>
                    {teamWorkers.filter(w => !w.status || w.status === "ACTIVE").map(w => (
                      <option key={w.id} value={w.id}>{w.name || w.username}</option>
                    ))}
                  </select>
                  <Button size="sm" disabled={!pickedWorkerId || assigning} onClick={assignWorker}>
                    {assigning ? "Sending..." : "Send internal assignment"}
                  </Button>
                  <p className="m-0 basis-full text-xs text-slate-500">
                    The worker must be active and have the required credentials. The participant keeps seeing your organisation as the provider; if you replace the worker later the change is recorded.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Worker's 3-way response to a confirmed selection (SW doc Window 30) */}
        {isWorker && user?.accountType === "MANAGED" && job.assignedWorker?.id === user?.id && job.status === "ASSIGNED" && !job.workerConfirmedAt && (
          <Card>
            <CardHeader><CardTitle>Awaiting your organisation&apos;s confirmation</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 m-0">
                Your organisation confirms this assignment on your behalf. The exact address and participant contact details are released to you once they have confirmed.
              </p>
            </CardContent>
          </Card>
        )}

        {isWorker && user?.accountType !== "MANAGED" && (job.assignedWorker?.id === user?.id || job.selectedApplicant?.id === user?.id) && job.status === "ASSIGNED" && !job.workerConfirmedAt && (
          <Card>
            <CardHeader><CardTitle>Your confirmed support</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Connect Window 4 / Window 30 — the final arrangement, in one place, before the worker accepts */}
              <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Who</dt><dd className="m-0 text-slate-800">{job.postedBy.name}{job.postedByRoleLabel ? ` · ${job.postedByRoleLabel}` : ""}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Service</dt><dd className="m-0 text-slate-800">{catLabel}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Date and time</dt><dd className="m-0 text-slate-800">{new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}{job.scheduledEndAt ? ` → ${new Date(job.scheduledEndAt).toLocaleTimeString("en-AU", { timeStyle: "short" })}` : ""}</dd></div>
                {job.totalHours ? <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Duration</dt><dd className="m-0 text-slate-800">{job.totalHours} hours</dd></div> : null}
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Agreed rate</dt><dd className="m-0 text-slate-800">{job.budgetPerHour ? `$${Number(job.budgetPerHour)}/hr` : job.fundingType ? "Applicable NDIS rate for the funding type" : "To be agreed directly"}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Travel</dt><dd className="m-0 text-slate-800">{({ NONE: "No travel required", LOCAL: "Local travel", MULTI_STOP: "Multiple stops", PARTICIPANT_TRANSPORT: "Transport of the participant", LONG_DISTANCE: "Long distance" } as Record<string, string>)[job.travelRequired ?? ""] ?? "As discussed"}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Recurrence</dt><dd className="m-0 text-slate-800">{job.isRecurring ? "Recurring support" : "One-time"}</dd></div>
                <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Address</dt><dd className="m-0 text-slate-800">{job.addressLine ?? "Released once you accept"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cancellation</dt><dd className="m-0 text-slate-800">You can cancel later from My Support with a reason. Late cancellations are recorded on your reliability profile.</dd></div>
              </dl>
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
              {showChangeForm && changeFormEl}
            </CardContent>
          </Card>
        )}

        {isWorker && user?.accountType !== "MANAGED" && (job.assignedWorker?.id === user?.id || job.selectedApplicant?.id === user?.id) && ["ASSIGNED", "IN_PROGRESS"].includes(job.status) && !!job.workerConfirmedAt && (
          <Card id="job-change">
            <CardHeader><CardTitle>Need to change something?</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-slate-700 m-0">Propose a change without losing the original arrangement. The original stays in place until the poster accepts.</p>
              <div><Button variant="outline" disabled={acting} onClick={() => setShowChangeForm(v => !v)}>Request change</Button></div>
              {showChangeForm && changeFormEl}
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

        {/* Meet-and-greet (SW doc Window 29) — optional introduction for Last-Minute or Routine only,
            offered while OPEN or ASSIGNED-unconfirmed */}
        {["LAST_MINUTE", "ROUTINE"].includes(job.urgency) && ["OPEN", "ASSIGNED"].includes(job.status) && (isOwner || ownApp || job.assignedWorker?.id === user?.id || job.selectedApplicant?.id === user?.id) && (
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
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {([["SUPPORT_NEEDS", "Support needs"], ["SCHEDULE", "Schedule"], ["RATE", "Rate"], ["COMPATIBILITY", "Compatibility"], ["QUESTIONS", "Questions"]] as const).map(([v, label]) => (
                      <label key={v} className="flex items-center gap-1.5 text-sm text-slate-600">
                        <input type="checkbox" checked={magTopics.includes(v)}
                          onChange={e => setMagTopics(arr => e.target.checked ? [...arr, v] : arr.filter(x => x !== v))} />
                        {label}
                      </label>
                    ))}
                  </div>
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
            <CardHeader><CardTitle>Before support</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-slate-600 m-0">You confirmed this support when you accepted. Check in when you arrive — checking in is a simple status update and does not use your location.</p>
              <div className="flex gap-2.5 flex-wrap">
                <Button disabled={acting} onClick={() => jobAction("start")}>Check in</Button>
                <Button variant="outline" onClick={() => document.getElementById("job-messages")?.scrollIntoView({ behavior: "smooth" })}>Message poster</Button>
                <Button variant="outline" onClick={() => document.getElementById("job-report")?.scrollIntoView({ behavior: "smooth" })}>Report issue</Button>
                <Button variant="ghost" disabled={acting} onClick={() => setShowCancelModal(true)} className="text-red-600">Cancel my confirmed support</Button>
              </div>
            </CardContent>
          </Card>
        )}
        {isWorker && (job.assignedWorker?.id === user?.id || job.selectedApplicant?.id === user?.id) && job.status === "IN_PROGRESS" && (
          <Card>
            <CardHeader><CardTitle>During support</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-slate-600 m-0">Keep the essential instructions and contact details handy. Your private note stays visible only to you.</p>
              <div className="flex gap-2.5 flex-wrap">
                <Button disabled={acting} onClick={() => setShowCompletion(true)}>Check out and mark complete</Button>
                <Button variant="outline" onClick={() => document.getElementById("job-messages")?.scrollIntoView({ behavior: "smooth" })}>Message</Button>
                <Button variant="outline" onClick={() => document.getElementById("job-report")?.scrollIntoView({ behavior: "smooth" })}>Report concern</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showCompletion && (
          <CompletionRecordModal job={{ ...job, scheduledEndAt: job.scheduledEndAt, totalHours: job.totalHours }} categoryLabel={catLabel}
            onClose={() => setShowCompletion(false)} onDone={() => { setShowCompletion(false); loadJob(); }} />
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
                    // SW doc Window 45: a worker rates Communication / Request accuracy / Respect (same stored fields).
                    [user?.id === workerPartyId ? "Request accuracy" : "Reliability", reliabilityRating, setReliabilityRating],
                    ["Communication", communicationRating, setCommunicationRating],
                    [user?.id === workerPartyId ? "Respect" : "Quality of support", qualityRating, setQualityRating],
                    ...(user?.id === workerPartyId ? [["Organisation", organisationRating, setOrganisationRating] as const] : []),
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
                    {(r.reliabilityRating || r.communicationRating || r.qualityRating || r.organisationRating) && (
                      <div style={{ fontSize: 11, color: "var(--td-muted)" }}>
                        {[
                          r.reliabilityRating && `${r.raterUserId === workerPartyId ? "Request accuracy" : "Reliability"} ${r.reliabilityRating}★`,
                          r.communicationRating && `Communication ${r.communicationRating}★`,
                          r.qualityRating && `${r.raterUserId === workerPartyId ? "Respect" : "Quality"} ${r.qualityRating}★`,
                          r.organisationRating && `Organisation ${r.organisationRating}★`,
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
        {isOwner && allApps.length > 0 && (
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Responses ({job._count?.applications ?? allApps.length})</CardTitle>
              {allApps.length > 1 && (
                <Button size="sm" variant="outline" onClick={() => setCompareView(v => !v)}>
                  {compareView ? "List view" : "Compare"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {compareView && allApps.length > 1 ? (
                /* SC journey M03 — side-by-side comparison instead of scrolling a sequential list */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[560px]">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-3 font-semibold">Responder</th>
                        <th className="py-2 pr-3 font-semibold">Rating</th>
                        <th className="py-2 pr-3 font-semibold">Rate</th>
                        <th className="py-2 pr-3 font-semibold">Coverage</th>
                        <th className="py-2 pr-3 font-semibold">Skills</th>
                        <th className="py-2 pr-3 font-semibold">Responded</th>
                        <th className="py-2 pr-3 font-semibold">Status</th>
                        {job.status === "OPEN" && <th className="py-2 pr-3 font-semibold">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {allApps.map(app => {
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
                            <td className="py-2.5 pr-3 font-semibold whitespace-nowrap" style={{ color: APP_STATUS_COLOR[app.status] ?? "var(--td-muted)" }}>{APP_STATUS_LABEL[app.status] ?? app.status}</td>
                            {job.status === "OPEN" && (
                              <td className="py-2.5 pr-3">
                                {["INTERESTED", "SHORTLISTED"].includes(app.status) ? (
                                  <div className="flex gap-1.5">
                                    {app.status === "INTERESTED" && canShortlist && (
                                      <Button size="sm" variant="outline" disabled={acting} onClick={() => appAction(app.id, "shortlist")} style={{ borderColor: "var(--td-muted-dark)", color: "var(--td-muted-dark)" }}>Shortlist</Button>
                                    )}
                                    {canConfirmBookings && <Button size="sm" disabled={acting} onClick={() => appAction(app.id, "select")}>Select</Button>}
                                    {canShortlist && <Button size="sm" variant="outline" disabled={acting} onClick={() => appAction(app.id, "decline")} style={{ borderColor: "var(--td-pink)", color: "var(--td-pink)" }}>Decline</Button>}
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
                {allApps.map(app => {
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
                        {app.applicantRole === "PROVIDER" ? (app.applicant.providerProfile?.businessName || app.applicant.name) : app.applicant.name}
                      </Link>
                      {app.applicantRole === "PROVIDER" && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "var(--td-grey)", color: "var(--td-dark-text-soft)" }}>Organisation response</span>
                      )}
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
                      {app.applicationData?.providerResponse && (
                        <div style={{ fontSize: 12, color: "var(--td-ink-700)", marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                          <span>Delivery: {PROVIDER_DELIVERY_LABEL[app.applicationData.deliveryOption ?? ""] ?? "Organisation response"}
                            {(app.applicationData.nominatedWorkers?.length ?? 0) > 0 && ` — ${app.applicationData.nominatedWorkers!.map(w => w.name).join(", ")}`}
                          </span>
                          {app.availabilityType && <span>Response: {AVAILABILITY_LABEL[app.availabilityType] ?? app.availabilityType}</span>}
                          {app.applicationData.alternativeTime && <span>Alternative time: {app.applicationData.alternativeTime}</span>}
                          {app.applicationData.partialTasks && <span>Can cover: {app.applicationData.partialTasks}</span>}
                          {app.applicationData.clarificationQuestion && <span>Needs clarification: {app.applicationData.clarificationQuestion}</span>}
                          {app.applicationData.alternativeProposal && <span>Alternative service proposal (differs from the request): {app.applicationData.alternativeProposal}</span>}
                          {app.rateResponse && (
                            <span>Rate: {app.rateResponse === "OFFER_OWN" && app.proposedRate != null ? `$${Number(app.proposedRate).toFixed(2)}/hr proposed` : (RATE_RESPONSE_LABEL[app.rateResponse] ?? app.rateResponse)}</span>
                          )}
                          {Object.entries(app.applicationData.serviceCapability ?? {}).filter(([, v]) => v).map(([k, v]) => (
                            <span key={k}>{CAPABILITY_LABEL[k] ?? k}: {v}</span>
                          ))}
                        </div>
                      )}
                      {!app.applicationData?.providerResponse && (app.availabilityType || app.rateResponse) && (
                        <div style={{ fontSize: 12, color: "var(--td-ink-700)", marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                          {app.availabilityType && <span>Availability: {AVAILABILITY_LABEL[app.availabilityType] ?? app.availabilityType}</span>}
                          {app.rateResponse && (
                            <span>Rate: {app.rateResponse === "OFFER_OWN" && app.proposedRate != null ? `$${Number(app.proposedRate).toFixed(2)}/hr proposed` : (RATE_RESPONSE_LABEL[app.rateResponse] ?? app.rateResponse)}</span>
                          )}
                        </div>
                      )}
                      {(app.introduction || app.note) && (
                        <div style={{ fontSize: 12, color: "var(--td-ink-700)", marginTop: 4, fontStyle: "italic" }}>“{app.introduction || app.note}”</div>
                      )}
                      <ApplicantOwnerTools jobId={job.id} app={app} jobCategory={job.category} jobSuburb={job.suburb}
                        canAct={job.status === "OPEN" && canShortlist && ["INTERESTED", "SHORTLISTED"].includes(app.status)}
                        declineReason={declineReasons[app.id] ?? ""} onDeclineReason={(v) => setDeclineReasons((p) => ({ ...p, [app.id]: v }))}
                        onSaved={loadJob} />
                      {canMessage && ["INTERESTED", "SHORTLISTED"].includes(app.status) && (
                        <button type="button" className="mt-1 text-xs font-semibold underline" style={{ color: "var(--td-pink)" }}
                          onClick={() => setMsgBody(`Hi ${app.applicant.name.split(" ")[0]}, could you clarify: `)}>
                          Request clarification
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: APP_STATUS_COLOR[app.status] ?? "var(--td-muted)" }}>
                      {APP_STATUS_LABEL[app.status] ?? app.status}
                    </span>
                    {job.status === "OPEN" && ["INTERESTED", "SHORTLISTED"].includes(app.status) && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {app.status === "INTERESTED" && canShortlist && (
                          <Button size="sm" variant="outline" disabled={acting}
                            onClick={() => appAction(app.id, "shortlist")}
                            style={{ borderColor: "var(--td-muted-dark)", color: "var(--td-muted-dark)" }}>
                            Shortlist
                          </Button>
                        )}
                        {canConfirmBookings && (
                          <Button size="sm" disabled={acting} onClick={() => appAction(app.id, "select")}>
                            Select
                          </Button>
                        )}
                        {canShortlist && (
                          <Button size="sm" variant="outline" disabled={acting}
                            onClick={() => appAction(app.id, "decline")}
                            style={{ borderColor: "var(--td-pink)", color: "var(--td-pink)" }}>
                            Decline
                          </Button>
                        )}
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
              {(job._count?.applications ?? 0) > allApps.length && (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <Button size="sm" variant="outline" disabled={loadingMoreApps} onClick={loadMoreApps}>
                    {loadingMoreApps ? "Loading…" : `Show more responses (${(job._count?.applications ?? 0) - allApps.length} more)`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <section id="job-messages" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
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
              disabled={!canMessage}
              onChange={e => setMsgBody(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={canMessage ? "Type a message…" : "The participant has not given you messaging permission"}
              className="h-11 flex-1 rounded-full border border-slate-200 bg-white px-4 text-[13.5px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!canMessage || sending || !msgBody.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Send className="h-[17px] w-[17px]" strokeWidth={2.1} />
            </button>
          </div>
        </section>

        {/* Incident report — pilot safety gate */}
        <section id="job-report" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
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
            {showBlockPanel && otherPartyId && !blocked && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-2.5">
                <p className="m-0 text-sm font-semibold text-slate-800">Block or limit contact</p>
                {([
                  ["MESSAGES", "Block messages", "They can no longer message you. They can still see your profile."],
                  ["HIDE", "Hide profile from this user", "Your profile is hidden from them. Existing messages stay."],
                  ["REPORT_BLOCK", "Report and block", "Blocks messages and hides your profile, and flags the concern to Shiftify."],
                ] as const).map(([v, l, d]) => (
                  <label key={v} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="radio" name="blkOption" checked={blkOption === v} onChange={() => setBlkOption(v)} className="mt-1" />
                    <span><span className="font-semibold">{l}</span><br /><span className="text-xs text-slate-500">{d}</span></span>
                  </label>
                ))}
                <div className="flex gap-2">
                  <Button size="sm" disabled={blocking} onClick={blockOtherParty}>{blocking ? "Blocking…" : "Confirm"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowBlockPanel(false)}>Cancel</Button>
                </div>
              </div>
            )}
            {blocked && !flagSent && <p className="mb-3 mt-0 text-xs text-slate-500">Contact limited. You can review this in Blocked users.</p>}
            {!flagSent && otherPartyId && !blocked && !showBlockPanel && (
              <div className="mb-3"><Button size="sm" variant="outline" onClick={() => { setBlkOption("MESSAGES"); setShowBlockPanel(true); }}>Block or limit contact</Button></div>
            )}
            {flagSent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: 13, color: "var(--td-dark-text-soft)", margin: 0 }}>Reported — an admin has been notified.</p>
                {otherPartyId && (
                  blocked ? (
                    <p style={{ fontSize: 12, color: "var(--td-muted-dark)", margin: 0 }}>This user is now blocked from messaging you and can no longer see your profile.</p>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setBlkOption("REPORT_BLOCK"); setShowBlockPanel(true); }}>Also block this user</Button>
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
                  <option value="SAFETY">Safety</option>
                  <option value="MISLEADING_REQUEST">Misleading request</option>
                  <option value="HARASSMENT">Harassment</option>
                  <option value="PRIVACY">Privacy</option>
                  <option value="PAYMENT_DISPUTE">Payment dispute</option>
                  <option value="INAPPROPRIATE_CONTENT">Inappropriate content</option>
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
                <p className="text-sm text-slate-600 m-0">{isOwner ? "This request has been cancelled and the poster's applicants have been notified." : "Your confirmed support has been cancelled and the poster has been notified."}</p>
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
                <h3 className="text-base font-bold text-slate-800 m-0">{isOwner ? "Cancel this request" : "Cancel your confirmed support"}</h3>
                {!isOwner && <p className="text-xs text-slate-500 m-0">The poster is told straight away and can find a replacement. Late cancellations are recorded on your reliability history.</p>}
                {!isOwner && (() => {
                  const hrs = Math.round((new Date(job.scheduledStartAt).getTime() - Date.now()) / 3_600_000);
                  return (
                    <p className="text-xs m-0 rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-slate-600">
                      Support starts {new Date(job.scheduledStartAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                      {hrs > 0 ? ` — about ${hrs >= 48 ? Math.round(hrs / 24) + " days" : hrs + " hours"} from now.` : " — it has already started."}
                      {hrs < 24 ? " This is short notice and will be recorded on your reliability history." : ""} Any other cancellation terms are the ones agreed with the poster.
                    </p>
                  );
                })()}
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
                <label className="text-xs font-semibold text-slate-500">Note (optional)</label>
                <textarea rows={2} maxLength={500} value={cancelNote} onChange={e => setCancelNote(e.target.value)}
                  className="px-2.5 py-2 border border-slate-200 rounded-lg text-sm resize-y" placeholder="Anything the poster should know" />
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

      {showApply && activeRole === "PROVIDER" && (
        <ProviderRespondModal
          job={{
            id: job.id, title: job.title, suburb: job.suburb, state: job.state,
            scheduledStartAt: job.scheduledStartAt, scheduledEndAt: job.scheduledEndAt,
          }}
          onClose={() => setShowApply(false)}
          onSuccess={() => { setShowApply(false); loadJob(); }}
        />
      )}

      {showApply && activeRole !== "PROVIDER" && (
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
