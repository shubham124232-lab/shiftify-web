// Profile API calls — all hit existing backend endpoints.
// PUT /users/me/profile  — upsert any role profile (partial ok, advances profileStep)
// GET /users/me/profile  — fetch current role profile
// GET /upload/presign    — get R2 presigned URL
// POST /upload/register-document — register doc row after upload
// PATCH /users/me        — update avatarUrl

import { api } from '@/lib/api';
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

// ─── Profile upsert ───────────────────────────────────────────────────────────

export async function upsertProfile(data: AnyProfileData): Promise<unknown> {
  return api.put('/users/me/profile', data);
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
  // Backend returns { ok: true, data: { document: UploadedDocument } }
  // api.post unwraps one level → { document: UploadedDocument }
  const res = await api.post<{ document: UploadedDocument }>('/upload/register-document', payload);
  return (res as unknown as { document: UploadedDocument }).document;
}

export async function updateAvatarUrl(avatarUrl: string): Promise<void> {
  await api.patch('/users/me', { avatarUrl });
}

export async function listDocuments(): Promise<UploadedDocument[]> {
  // GET /users/me/documents → { ok, data: UploadedDocument[] }
  // api.get unwraps one level → returns UploadedDocument[] directly
  const res = await api.get<UploadedDocument[]>('/users/me/documents');
  return Array.isArray(res) ? res : [];
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
