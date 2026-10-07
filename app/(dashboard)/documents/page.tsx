"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { api, http } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Doc {
  id: string;
  docType: string;
  fileName: string;
  status: "PENDING" | "UPLOADED" | "VERIFIED" | "REJECTED";
  uploadedAt: string;
  issueDate: string | null;
  expiryDate: string | null;
  rejectionReason: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// SW doc Window 46 — group the list: Requires attention / Expiring soon / Current / Expired.
const DOC_GROUPS = ["Requires attention", "Expiring soon", "Current", "Expired"] as const;
function docGroup(d: Doc): (typeof DOC_GROUPS)[number] {
  if (d.status === "REJECTED") return "Requires attention";
  if (d.expiryDate) {
    const daysLeft = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / DAY_MS);
    if (daysLeft < 0) return "Expired";
    if (daysLeft <= 30) return "Expiring soon";
  }
  return "Current";
}

function expiryInfo(expiryDate: string | null): { label: string; bg: string; color: string } | null {
  if (!expiryDate) return null;
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / DAY_MS);
  if (daysLeft < 0) return { label: "Expired", bg: "var(--td-pink-tint)", color: "var(--td-pink-hover)" };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, bg: "var(--td-grey)", color: "var(--td-ink-800)" };
  return null;
}

const DOC_TYPES = [
  { value: "NDIS_SCREENING", label: "Worker Screening Check" },
  { value: "POLICE_CHECK",   label: "Police Check" },
  { value: "WWCC",           label: "Working with Children Check" },
  { value: "FIRST_AID",      label: "First Aid Certificate" },
  { value: "PUBLIC_LIABILITY_INSURANCE", label: "Public Liability Insurance" },
  { value: "QUALIFICATION_CERTIFICATE", label: "Qualification / Certificate" },
  { value: "OTHER",          label: "Other Document" },
];

const PROVIDER_DOC_TYPES = [
  { value: "PUBLIC_LIABILITY_INSURANCE", label: "Public Liability Insurance" },
  { value: "PROFESSIONAL_INDEMNITY",     label: "Professional Indemnity Insurance" },
  { value: "NDIS_AUDIT",                 label: "NDIS Provider Registration Certificate" },
  { value: "WORKERS_COMP",               label: "Workers Compensation Insurance" },
  { value: "ABN_CONFIRMATION",           label: "ABN / business evidence" },
  { value: "BUSINESS_ADDRESS_EVIDENCE",  label: "Business address evidence" },
  { value: "CONTACT_IDENTITY_EVIDENCE",  label: "Administrator identity evidence" },
  { value: "POLICIES_PROCEDURES",        label: "Policies and procedures" },
  { value: "OTHER",                      label: "Other Document" },
];
const PROVIDER_REQUIRED = ["PUBLIC_LIABILITY_INSURANCE", "PROFESSIONAL_INDEMNITY", "NDIS_AUDIT"];
const WORKER_REQUIRED = ["NDIS_SCREENING", "POLICE_CHECK", "WWCC", "FIRST_AID"];
const ALL_LABELS = [...DOC_TYPES, ...PROVIDER_DOC_TYPES];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  UPLOADED:  { bg: "var(--td-grey)", color: "var(--td-ink-700)", label: "Uploaded" },
  VERIFIED:  { bg: "var(--td-dark-text)", color: "var(--td-white)", label: "Verified" },
  PENDING:   { bg: "var(--td-pink-tint)", color: "var(--td-pink-hover)", label: "Pending" },
  REJECTED:  { bg: "var(--td-pink)", color: "var(--td-white)", label: "Rejected" },
};

export default function DocumentsPage() {
  const { activeRole } = useAuth();
  const isProvider = activeRole === "PROVIDER";
  const isWorker = activeRole === "SUPPORT_WORKER" || isProvider;
  const docTypes = isProvider ? PROVIDER_DOC_TYPES : DOC_TYPES;
  const requiredTypes = isProvider ? PROVIDER_REQUIRED : WORKER_REQUIRED;
  const [docs,     setDocs]     = useState<Doc[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickedType, setSelType] = useState("");
  // The role can load after first render, so fall back to the first type that role may upload.
  const selType = docTypes.some(t => t.value === pickedType) ? pickedType : docTypes[0].value;
  const [expiryDate, setExpiryDate] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    api.get<{ documents: Doc[] }>("/users/me/documents")
      .then(r => setDocs(r.documents ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // Try R2 presign → upload → register; fall back to multipart POST if R2 not configured
      let presignOk = false;
      try {
        const presign = await api.get<{ uploadUrl: string; fileKey: string; publicUrl: string }>(
          `/upload/presign?category=compliance&fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
        );
        await fetch(presign.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        await api.post("/upload/register-document", {
          docType: selType, fileName: file.name, mimeType: file.type,
          fileKey: presign.fileKey, sizeBytes: file.size,
          expiryDate: expiryDate || undefined,
        });
        presignOk = true;
      } catch {
        // R2 not configured — fall back to multipart
      }
      if (!presignOk) {
        const form = new FormData();
        form.append("file", file);
        form.append("docType", selType);
        if (expiryDate) form.append("expiryDate", expiryDate);
        await http.post("/users/me/documents", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setExpiryDate("");
      load();
    } catch (err: any) {
      setError(err?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this document?")) return;
    try {
      await api.del(`/users/me/documents/${id}`);
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setError(err?.message ?? "Delete failed.");
    }
  }

  return (
    <>
      <PageHeader title="Documents" description="Upload compliance documents required to work on Shiftify." />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Upload card */}
        <Card>
          <CardHeader><CardTitle>Upload a document</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--td-dark-text-soft)", marginBottom: 4 }}>Document type</label>
                <select
                  value={selType}
                  onChange={e => setSelType(e.target.value)}
                  style={{ width: "100%", height: 40, padding: "0 10px", border: "1.5px solid var(--td-border)", borderRadius: 8, fontSize: 14, background: "var(--td-white)" }}
                >
                  {docTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ minWidth: 160 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--td-dark-text-soft)", marginBottom: 4 }}>Expiry date (optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  style={{ width: "100%", height: 40, padding: "0 10px", border: "1.5px solid var(--td-border)", borderRadius: 8, fontSize: 14, background: "var(--td-white)" }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Choose file & upload"}
              </Button>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleUpload} />
            </div>
            <p style={{ fontSize: 12, color: "var(--td-muted)", marginTop: 8 }}>Accepted: PDF, JPG, PNG. Max 10 MB.</p>
          </CardContent>
        </Card>

        {error && (
          <div style={{ background: "var(--td-pink-soft)", border: "1px solid var(--td-pink-tint)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--td-pink-hover)" }}>
            {error}
          </div>
        )}

        {/* Documents list */}
        <Card>
          <CardHeader><CardTitle>My documents ({docs.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p style={{ fontSize: 14, color: "var(--td-muted)" }}>Loading...</p>
            ) : docs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                <p style={{ fontSize: 14, color: "var(--td-muted-dark)", fontWeight: 600 }}>No documents uploaded yet</p>
                <p style={{ fontSize: 13, color: "var(--td-muted)", marginTop: 4 }}>Upload your compliance documents above.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...docs].sort((a, b) => DOC_GROUPS.indexOf(docGroup(a)) - DOC_GROUPS.indexOf(docGroup(b))).map((doc, i, arr) => {
                  const group = docGroup(doc);
                  const showHeading = i === 0 || docGroup(arr[i - 1]) !== group;
                  const s = STATUS_STYLE[doc.status] ?? STATUS_STYLE.PENDING;
                  const typeLabel = ALL_LABELS.find(t => t.value === doc.docType)?.label ?? doc.docType;
                  const expiry = expiryInfo(doc.expiryDate);
                  return (
                    <Fragment key={doc.id}>
                    {showHeading && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--td-muted-dark)", textTransform: "uppercase", letterSpacing: 0.4, marginTop: i === 0 ? 0 : 6 }}>{group}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", border: "1.5px solid var(--td-border)", borderRadius: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--td-grey)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        📄
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--td-ink-800)", marginBottom: 2 }}>{typeLabel}</div>
                        <div style={{ fontSize: 12, color: "var(--td-muted-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</div>
                        <div style={{ fontSize: 11, color: "var(--td-muted)", marginTop: 2 }}>
                          Uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-AU")}
                          {doc.expiryDate && ` · Expires ${new Date(doc.expiryDate).toLocaleDateString("en-AU")}`}
                        </div>
                        {doc.rejectionReason && (
                          <div style={{ fontSize: 12, color: "var(--td-pink-hover)", marginTop: 4 }}>Rejected: {doc.rejectionReason}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                        {expiry && (
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: expiry.bg, color: expiry.color }}>
                            {expiry.label}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--td-muted)", fontSize: 16, padding: 4, flexShrink: 0 }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                    </Fragment>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance checklist — workers & providers only */}
        {isWorker && <Card>
          <CardHeader><CardTitle>{isProvider ? "Required for Providers" : "Required for support workers"}</CardTitle></CardHeader>
          <CardContent>
            {requiredTypes.map(req => {
              const match = docs.find(d => d.docType === req && d.status !== "REJECTED");
              const isExpired = match?.expiryDate ? new Date(match.expiryDate).getTime() < Date.now() : false;
              const have = !!match && !isExpired;
              const label = ALL_LABELS.find(t => t.value === req)?.label ?? req;
              return (
                <div key={req} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--td-grey)" }}>
                  <span style={{ fontSize: 16 }}>{have ? "✅" : isExpired ? "⚠" : "⭕"}</span>
                  <span style={{ fontSize: 13, color: have ? "var(--td-ink-700)" : isExpired ? "var(--td-pink-hover)" : "var(--td-muted-dark)", fontWeight: have || isExpired ? 600 : 400 }}>
                    {label}{isExpired ? " (expired — re-upload needed)" : ""}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>}
      </div>
    </>
  );
}
