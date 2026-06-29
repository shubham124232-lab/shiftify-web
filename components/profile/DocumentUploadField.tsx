'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetadataFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'date' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface ExistingDoc {
  id: string;
  docType: string;
  publicUrl?: string | null;
  fileName?: string | null;
  referenceNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  status?: string;
  uploadedAt?: string;
}

interface Props {
  docType: string;
  label: string;
  metadataFields?: MetadataFieldConfig[];
  uploadRequired: boolean;
  existingDoc?: ExistingDoc | null;
  onSaved: (doc: ExistingDoc) => void;
  optional?: boolean;
}

// ── Status chip ───────────────────────────────────────────────────────────────

function StatusChip({ doc }: { doc?: ExistingDoc | null }) {
  if (!doc) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        Not Uploaded
      </span>
    );
  }
  const expired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
  if (expired) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
      Uploaded
    </span>
  );
}

// ── Build a dynamic Zod schema from field configs ────────────────────────────

function buildSchema(fields: MetadataFieldConfig[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let field: z.ZodTypeAny = z.string();
    if (!f.required) field = (field as z.ZodString).optional().or(z.literal(''));
    shape[f.name] = field;
  }
  return z.object(shape);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocumentUploadField({
  docType,
  label,
  metadataFields = [],
  uploadRequired,
  existingDoc,
  onSaved,
  optional = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const schema = buildSchema(metadataFields);
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: metadataFields.reduce<Record<string, string>>((acc, f) => {
      const existing = existingDoc as Record<string, unknown> | undefined;
      acc[f.name] = (existing?.[f.name] as string) ?? '';
      return acc;
    }, {}),
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setUploading(true);
    try {
      const file = fileRef.current?.files?.[0];

      if (uploadRequired && !file && !existingDoc) {
        setError('Please select a file to upload.');
        setUploading(false);
        return;
      }

      // Build metadata payload
      const meta: Record<string, string | undefined> = {};
      for (const f of metadataFields) {
        const val = (values as Record<string, string>)[f.name];
        if (val) meta[f.name] = val;
      }

      if (file && uploadRequired) {
        // 1. Get presigned URL
        const { presignedUrl, publicUrl, key } = await api.post<{
          presignedUrl: string;
          publicUrl: string;
          key: string;
        }>('/upload/document/presign', {
          docType,
          fileName: file.name,
          contentType: file.type,
        });

        // 2. PUT file directly to R2
        const putRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error('Upload to storage failed');

        // 3. Confirm with backend
        const { document: saved } = await api.post<{ document: ExistingDoc }>('/upload/document/confirm', {
          key,
          publicUrl,
          docType,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          ...meta,
        });
        onSaved(saved);
      } else {
        // Metadata-only (no file required, or re-saving metadata without re-uploading)
        const { document: saved } = await api.post<{ document: ExistingDoc }>('/upload/document/confirm', {
          key: existingDoc?.id ?? '',
          publicUrl: existingDoc?.publicUrl ?? '',
          docType,
          fileName: existingDoc?.fileName ?? 'metadata',
          mimeType: 'application/octet-stream',
          sizeBytes: 0,
          ...meta,
        });
        onSaved(saved);
      }

      setShowForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm text-gray-800 truncate">{label}</span>
          {optional && <span className="text-xs text-gray-400">(optional)</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusChip doc={existingDoc} />
          {existingDoc?.publicUrl && (
            <a
              href={existingDoc.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              View
            </a>
          )}
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-xs text-indigo-600 hover:underline"
          >
            {existingDoc ? 'Re-upload' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Existing doc summary */}
      {existingDoc && !showForm && (
        <div className="text-xs text-gray-500 space-y-0.5">
          {existingDoc.referenceNumber && <p>Ref: {existingDoc.referenceNumber}</p>}
          {existingDoc.issueDate && <p>Issued: {existingDoc.issueDate.slice(0, 10)}</p>}
          {existingDoc.expiryDate && <p>Expires: {existingDoc.expiryDate.slice(0, 10)}</p>}
          {existingDoc.uploadedAt && <p>Uploaded: {existingDoc.uploadedAt.slice(0, 10)}</p>}
        </div>
      )}

      {/* Upload / metadata form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
          {/* Metadata fields */}
          {metadataFields.map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {f.type === 'select' ? (
                <select
                  {...register(f.name)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select…</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  {...register(f.name)}
                  type={f.type}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
              {errors[f.name] && (
                <p className="text-xs text-red-600 mt-0.5">
                  {(errors[f.name] as { message?: string })?.message}
                </p>
              )}
            </div>
          ))}

          {/* File input */}
          {uploadRequired && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                File{!existingDoc && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                ref={fileRef}
                type="file"
                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
