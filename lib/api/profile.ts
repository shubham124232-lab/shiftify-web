// Profile API calls — all hit existing backend endpoints.
// POST /users/me/profile/{slug} — upsert role-specific profile (partial ok, advances profileStep)
// GET /users/me/profile  — fetch current role profile
// GET /upload/presign    — get R2 presigned URL
// POST /upload/register-document — register doc row after upload
// PATCH /users/me        — update avatarUrl

import { api, http } from '@/lib/api';
import type {
  WorkerProfileData,
  ProviderProfileData,
  CoordinatorProfileData,
  ParticipantProfileData,
  PlanManagerProfileData,
  UploadedDocument,
} from '@/lib/types/profile';

type AnyProfileData =
  | WorkerProfileData
  | ProviderProfileData
  | CoordinatorProfileData
  | ParticipantProfileData
  | PlanManagerProfileData;

const ROLE_SLUG: Record<string, string> = {
  SUPPORT_WORKER: 'worker',
  PROVIDER:       'provider',
  COORDINATOR:    'coordinator',
  PARTICIPANT:    'participant',
  PLAN_MANAGER:   'plan-manager',
};

// ─── Profile upsert ───────────────────────────────────────────────────────────

export async function upsertProfile(role: string, data: AnyProfileData | Record<string, unknown>): Promise<unknown> {
  const slug = ROLE_SLUG[role] ?? role.toLowerCase();
  return api.post(`/users/me/profile/${slug}`, data);
}

export async function getProfile(): Promise<unknown> {
  return api.get('/users/me/profile');
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

export interface PresignResult {
  uploadUrl:  string;
  fileKey:    string;
  publicUrl:  string;
  expiresIn:  number;
}

export async function presignUpload(
  category: string,
  fileName: string,
  contentType: string,
): Promise<PresignResult> {
  return api.get(
    `/upload/presign?category=${encodeURIComponent(category)}&fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}`,
  );
}

export async function putFileToR2(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
}

export interface RegisterDocumentPayload {
  fileKey:         string;
  fileName:        string;
  mimeType:        string;
  sizeBytes:       number;
  docType:         string;
  referenceNumber?: string;
  issueDate?:      string;
  expiryDate?:     string;
}

export async function registerDocument(
  payload: RegisterDocumentPayload,
): Promise<UploadedDocument> {
  const res = await api.post<{ document: UploadedDocument }>('/upload/register-document', payload);
  return (res as unknown as { document: UploadedDocument }).document;
}

/** Map wizard docType labels to backend DocumentType enum values. */
const DOC_TYPE_ALIASES: Record<string, string> = {
  NDIS_REGISTRATION:    'NDIS_AUDIT',
  PUBLIC_LIABILITY:     'PUBLIC_LIABILITY_INSURANCE',
  WORKERS_COMPENSATION: 'WORKERS_COMP',
};

export function normalizeDocType(docType: string): string {
  return DOC_TYPE_ALIASES[docType] ?? docType;
}

function mapDocumentResponse(doc: Record<string, unknown>): UploadedDocument {
  return {
    id:              String(doc.id ?? ''),
    docType:         String(doc.docType ?? ''),
    fileName:        String(doc.fileName ?? ''),
    fileKey:         String(doc.fileKey ?? doc.filePath ?? ''),
    publicUrl:       (doc.publicUrl ?? doc.fileUrl ?? null) as string | null,
    sizeBytes:       Number(doc.sizeBytes ?? 0),
    mimeType:        String(doc.mimeType ?? ''),
    referenceNumber: (doc.referenceNumber ?? null) as string | null,
    issueDate:       (doc.issueDate ?? null) as string | null,
    expiryDate:      (doc.expiryDate ?? null) as string | null,
    status:          (doc.status ?? 'UPLOADED') as UploadedDocument['status'],
    createdAt:       String(doc.createdAt ?? doc.uploadedAt ?? ''),
  };
}

/** Multipart upload to local disk — used when R2 presign is unavailable. */
export async function uploadDocumentLocal(
  file: File,
  payload: Omit<RegisterDocumentPayload, 'fileKey' | 'fileName' | 'mimeType' | 'sizeBytes'>,
): Promise<UploadedDocument> {
  const form = new FormData();
  form.append('file', file);
  form.append('docType', normalizeDocType(payload.docType));
  if (payload.referenceNumber) form.append('referenceNumber', payload.referenceNumber);
  if (payload.issueDate)       form.append('issueDate', payload.issueDate.slice(0, 10));
  if (payload.expiryDate)      form.append('expiryDate', payload.expiryDate.slice(0, 10));

  const res = await http.post<{ data: { document: Record<string, unknown> } }>(
    '/users/me/documents',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  const doc = res.data?.data?.document;
  if (!doc) throw new Error('Upload failed — no document returned');
  return mapDocumentResponse(doc);
}

export async function updateAvatarUrl(avatarUrl: string): Promise<void> {
  await api.patch('/users/me', { avatarUrl });
}

export async function listDocuments(): Promise<UploadedDocument[]> {
  const res = await api.get<{ documents: Record<string, unknown>[] }>('/users/me/documents');
  return (res.documents ?? []).map(mapDocumentResponse);
}

// ─── Wizard progress ─────────────────────────────────────────────────────────

export interface ProfileProgress {
  role:        string;
  profileStep: number;
  totalSteps:  number;
  isComplete:  boolean;
  nextStep:    number;
}

export async function getProfileProgress(): Promise<ProfileProgress> {
  return api.get<ProfileProgress>('/users/me/profile/progress');
}

// ─── Availability slots ───────────────────────────────────────────────────────

export interface AvailabilitySlotPayload {
  dayOfWeek: string;
  startTime: string;
  endTime:   string;
}

export async function replaceAvailabilitySlots(
  slots: AvailabilitySlotPayload[],
): Promise<void> {
  await api.put('/users/me/availability/slots', { slots });
}
