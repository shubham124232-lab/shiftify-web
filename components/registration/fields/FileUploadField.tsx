'use client';
// Reusable file upload field used inside wizard steps.
// Handles upload internally (R2 presign in prod, local multipart fallback in dev).
// Optionally renders metadata inputs (referenceNumber, expiryDate, issueDate)
// which are collected locally and passed into the upload payload.

import { useRef, useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { UploadOptions } from '@/hooks/useFileUpload';

export interface FileUploadFieldProps {
  label:                  string;
  accept?:                string;
  maxSizeMb?:             number;
  uploadOptions:          UploadOptions;
  currentValue?:          string | null;
  onUploaded:             (value: string) => void;
  optional?:              boolean;
  helpText?:              string;
  // Metadata collection — inputs shown below upload button, values sent with upload
  showReferenceNumber?:   boolean;
  referenceNumberLabel?:  string;   // default: "Reference / Certificate Number"
  showExpiryDate?:        boolean;
  showIssueDate?:         boolean;
}

const ACCEPTED_COMPLIANCE = '.pdf,.jpg,.jpeg,.png,.heic';
const ACCEPTED_IMAGE      = '.jpg,.jpeg,.png,.heic,.webp';

const metaLabel: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--clr-muted)', marginBottom: 3,
};
const metaInput: React.CSSProperties = {
  width: '100%', height: 36, padding: '0 10px', borderRadius: 8,
  border: '1px solid var(--clr-border)', fontSize: 12, outline: 'none',
  background: '#fff', boxSizing: 'border-box',
};

export function FileUploadField({
  label,
  accept,
  maxSizeMb = 25,
  uploadOptions,
  currentValue,
  onUploaded,
  optional,
  helpText,
  showReferenceNumber,
  referenceNumberLabel = 'Reference / Certificate Number',
  showExpiryDate,
  showIssueDate,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, error, progress, uploadFile, reset } = useFileUpload();
  const [localName, setLocalName] = useState<string | null>(null);

  // Metadata local state — passed into uploadOptions at upload time
  const [refNum,   setRefNum]   = useState('');
  const [expDate,  setExpDate]  = useState('');
  const [issDate,  setIssDate]  = useState('');

  const accepted = accept ?? (uploadOptions.category === 'avatars'
    ? ACCEPTED_IMAGE
    : ACCEPTED_COMPLIANCE);

  const hasMetadata = showReferenceNumber || showExpiryDate || showIssueDate;

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`File too large. Maximum size is ${maxSizeMb} MB.`);
      return;
    }

    const enrichedOptions: UploadOptions = {
      ...uploadOptions,
      ...(showReferenceNumber && refNum   ? { referenceNumber: refNum  } : {}),
      ...(showExpiryDate      && expDate  ? { expiryDate:      expDate  } : {}),
      ...(showIssueDate       && issDate  ? { issueDate:        issDate  } : {}),
    };

    setLocalName(file.name);
    const result = await uploadFile(file, enrichedOptions);
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

      {/* Metadata inputs — shown before upload so user can fill in details */}
      {hasMetadata && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[showReferenceNumber, showIssueDate, showExpiryDate].filter(Boolean).length}, 1fr)`, gap: 8, marginBottom: 8 }}>
          {showReferenceNumber && (
            <div>
              <label style={metaLabel}>{referenceNumberLabel}</label>
              <input
                value={refNum}
                onChange={e => setRefNum(e.target.value)}
                placeholder="Enter number…"
                style={metaInput}
              />
            </div>
          )}
          {showIssueDate && (
            <div>
              <label style={metaLabel}>Issue Date</label>
              <input type="date" value={issDate} onChange={e => setIssDate(e.target.value)} style={metaInput} />
            </div>
          )}
          {showExpiryDate && (
            <div>
              <label style={metaLabel}>Expiry Date</label>
              <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} style={metaInput} />
            </div>
          )}
        </div>
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
