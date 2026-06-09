'use client';
// Reusable file upload field used inside wizard steps.
// Handles upload internally (R2 presign in prod, local multipart fallback in dev).

import { useRef, useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { UploadOptions } from '@/hooks/useFileUpload';

export interface FileUploadFieldProps {
  label:           string;
  accept?:         string; // e.g. ".pdf,.jpg,.png,.heic"
  maxSizeMb?:      number;
  uploadOptions:   UploadOptions;
  currentValue?:   string | null; // current file URL or doc ID
  onUploaded:      (value: string) => void;
  optional?:       boolean;
  helpText?:       string;
}

const ACCEPTED_COMPLIANCE = '.pdf,.jpg,.jpeg,.png,.heic';
const ACCEPTED_IMAGE      = '.jpg,.jpeg,.png,.heic,.webp';

export function FileUploadField({
  label,
  accept,
  maxSizeMb = 25,
  uploadOptions,
  currentValue,
  onUploaded,
  optional,
  helpText,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, error, progress, uploadFile, reset } = useFileUpload();
  const [localName, setLocalName] = useState<string | null>(null);

  const accepted = accept ?? (uploadOptions.category === 'avatars'
    ? ACCEPTED_IMAGE
    : ACCEPTED_COMPLIANCE);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`File too large. Maximum size is ${maxSizeMb} MB.`);
      return;
    }

    setLocalName(file.name);
    const result = await uploadFile(file, uploadOptions);
    if (result) {
      onUploaded(typeof result === 'string' ? result : result.id);
    }
  }

  const isDone = status === 'done' || !!currentValue;

  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-text)', marginBottom: 5 }}>
        {label}
        {optional && <span style={{ fontWeight: 400, color: 'var(--clr-muted)', marginLeft: 4 }}>(optional)</span>}
      </label>

      {helpText && (
        <p style={{ fontSize: 11, color: 'var(--clr-muted)', marginBottom: 6, marginTop: 0 }}>{helpText}</p>
      )}

      {/* Drop zone / click area */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading' || status === 'presigning' || status === 'registering'}
        style={{
          width: '100%', padding: '14px 16px',
          borderRadius: 10,
          border: isDone ? '1.5px solid #22c55e' : '1.5px dashed var(--clr-border)',
          background: isDone ? '#F0FFF4' : 'var(--clr-surface)',
          cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'all 0.15s',
        }}
      >
        <i
          className={`bi ${isDone ? 'bi-check-circle-fill' : 'bi-cloud-upload-fill'}`}
          style={{ fontSize: 18, color: isDone ? '#22c55e' : 'var(--clr-primary)', flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: isDone ? '#16a34a' : 'var(--clr-text)' }}>
            {isDone
              ? localName ?? 'File uploaded ✓'
              : status === 'idle'
              ? `Upload ${label}`
              : `${status.charAt(0).toUpperCase() + status.slice(1)}…`}
          </div>
          {!isDone && (
            <div style={{ fontSize: 11, color: 'var(--clr-muted)', marginTop: 2 }}>
              {accepted.replace(/\./g, '').toUpperCase().split(',').join(', ')} · max {maxSizeMb} MB
            </div>
          )}
        </div>
        {isDone && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); reset(); setLocalName(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-muted)', fontSize: 14, padding: 0 }}
            title="Remove file"
          >
            <i className="bi bi-x-circle" />
          </button>
        )}
      </button>

      {/* Progress bar */}
      {status !== 'idle' && status !== 'done' && status !== 'error' && (
        <div style={{ height: 3, borderRadius: 2, background: 'var(--clr-surface)', marginTop: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--clr-primary)', transition: 'width 0.3s' }} />
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4, marginBottom: 0 }}>
          <i className="bi bi-exclamation-circle" style={{ marginRight: 4 }} />{error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accepted}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
