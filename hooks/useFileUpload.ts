'use client';
// Upload strategy:
//   avatars/logos     → presign → R2 PUT → PATCH /users/me (avatarUrl)
//   compliance docs   → presign → R2 PUT → register-document
//                     → POST /users/me/documents (multipart fallback when R2 unavailable)

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';
import {
  presignUpload,
  putFileToR2,
  registerDocument,
  uploadDocumentLocal,
  updateAvatarUrl,
  normalizeDocType,
  type RegisterDocumentPayload,
} from '@/lib/api/profile';
import type { UploadedDocument } from '@/lib/types/profile';

export type UploadStatus = 'idle' | 'presigning' | 'uploading' | 'registering' | 'done' | 'error';

export interface UseFileUploadReturn {
  status:      UploadStatus;
  error:       string | null;
  progress:    number;
  uploadFile:  (file: File, opts: UploadOptions) => Promise<UploadedDocument | string | null>;
  reset:       () => void;
}

export interface UploadOptions {
  category: string;
  docType?:         string;
  referenceNumber?: string;
  issueDate?:       string;
  expiryDate?:      string;
}

function isR2NotConfigured(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.code === 'BAD_REQUEST' && err.message.includes('R2 storage is not configured');
  }
  return err instanceof Error && err.message.includes('R2 storage is not configured');
}

export function useFileUpload(): UseFileUploadReturn {
  const [status,   setStatus]   = useState<UploadStatus>('idle');
  const [error,    setError]    = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setProgress(0);
  }, []);

  const uploadFile = useCallback(
    async (file: File, opts: UploadOptions): Promise<UploadedDocument | string | null> => {
      setStatus('presigning');
      setError(null);
      setProgress(10);

      try {
        if (opts.category === 'avatars' || opts.category === 'logos') {
          const { uploadUrl, publicUrl } = await presignUpload('avatars', file.name, file.type);
          setProgress(30);
          setStatus('uploading');
          await putFileToR2(uploadUrl, file);
          setProgress(80);
          setStatus('registering');
          await updateAvatarUrl(publicUrl);
          setProgress(100);
          setStatus('done');
          return publicUrl;
        }

        const docPayload = {
          docType:         normalizeDocType(opts.docType ?? 'OTHER'),
          referenceNumber: opts.referenceNumber,
          issueDate:       opts.issueDate,
          expiryDate:      opts.expiryDate,
        };

        // Try R2 presign flow first; fall back to local multipart when R2 is not configured.
        try {
          const { uploadUrl, fileKey } = await presignUpload(opts.category, file.name, file.type);
          setProgress(30);

          setStatus('uploading');
          await putFileToR2(uploadUrl, file);
          setProgress(70);

          setStatus('registering');
          const payload: RegisterDocumentPayload = {
            fileKey,
            fileName:  file.name,
            mimeType:  file.type,
            sizeBytes: file.size,
            ...docPayload,
          };
          const result = await registerDocument(payload);
          setProgress(100);
          setStatus('done');
          return result;
        } catch (presignErr) {
          if (!isR2NotConfigured(presignErr)) throw presignErr;

          setStatus('uploading');
          setProgress(50);
          const result = await uploadDocumentLocal(file, docPayload);
          setProgress(100);
          setStatus('done');
          return result;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        setStatus('error');
        return null;
      }
    },
    [],
  );

  return { status, error, progress, uploadFile, reset };
}
