'use client';
// Three-phase upload: presign → R2 PUT → register-document row
// Returns uploadFile() fn + status + error

import { useState, useCallback } from 'react';
import { presignUpload, putFileToR2, registerDocument, updateAvatarUrl, type RegisterDocumentPayload } from '@/lib/api/profile';
import type { UploadedDocument } from '@/lib/types/profile';

export type UploadStatus = 'idle' | 'presigning' | 'uploading' | 'registering' | 'done' | 'error';

export interface UseFileUploadReturn {
  status:      UploadStatus;
  error:       string | null;
  progress:    number; // 0-100
  /** Returns publicUrl (string) for avatar/logo, or UploadedDocument for compliance docs */
  uploadFile:  (file: File, opts: UploadOptions) => Promise<UploadedDocument | string | null>;
  reset:       () => void;
}

export interface UploadOptions {
  /** 'compliance' | 'avatar' | 'logo' */
  category: string;
  /** Only for compliance docs */
  docType?:         string;
  referenceNumber?: string;
  issueDate?:       string;
  expiryDate?:      string;
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
        // 1. Get presigned PUT URL
        const { uploadUrl, fileKey, publicUrl } = await presignUpload(
          opts.category,
          file.name,
          file.type,
        );
        setProgress(30);

        // 2. PUT file directly to R2
        setStatus('uploading');
        await putFileToR2(uploadUrl, file);
        setProgress(70);

        // 3. Register with backend
        setStatus('registering');

        if (opts.category === 'avatar' || opts.category === 'logo') {
          // For avatar/logo: just patch users/me with the publicUrl
          await updateAvatarUrl(publicUrl);
          setProgress(100);
          setStatus('done');
          return publicUrl;
        }

        // For compliance docs: register document row
        const payload: RegisterDocumentPayload = {
          fileKey,
          fileName:        file.name,
          mimeType:        file.type,
          sizeBytes:       file.size,
          docType:         opts.docType ?? 'OTHER',
          referenceNumber: opts.referenceNumber,
          issueDate:       opts.issueDate,
          expiryDate:      opts.expiryDate,
        };

        const result = await registerDocument(payload);
        setProgress(100);
        setStatus('done');
        return result.document;
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
