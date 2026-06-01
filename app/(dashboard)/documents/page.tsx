"use client";

import { useState, useEffect, useRef } from "react";
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
  rejectionReason: string | null;
}

const DOC_TYPES = [
  { value: "NDIS_SCREENING", label: "NDIS Worker Screening" },
  { value: "POLICE_CHECK",   label: "Police Check" },
  { value: "WWCC",           label: "Working with Children Check" },
  { value: "FIRST_AID",      label: "First Aid Certificate" },
  { value: "INSURANCE",      label: "Public Liability Insurance" },
  { value: "QUALIFICATION",  label: "Qualification / Certificate" },
  { value: "OTHER",          label: "Other Document" },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  UPLOADED: { bg: "#dbeafe", color: "#1d4ed8", label: "Uploaded" },
  VERIFIED: { bg: "#dcfce7", color: "#15803d", label: "Verified" },
  REJECTED: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
  PENDING:  { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
};

export default function DocumentsPage() {
  const { activeRole } = useAuth();
  const isWorker = activeRole === "SUPPORT_WORKER" || activeRole === "PROVIDER";
  const [docs,     setDocs]     = useState<Doc[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selType,  setSelType]  = useState(DOC_TYPES[0].value);
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
        });
        presignOk = true;
      } catch {
        // R2 not configured — fall back to multipart
      }
      if (!presignOk) {
        const form = new FormData();
        form.append("file", file);
        form.append("docType", selType);
        await http.post("/users/me/documents", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Document type</label>
                <select
                  value={selType}
                  onChange={e => setSelType(e.target.value)}
                  style={{ width: "100%", height: 40, padding: "0 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#fff" }}
                >
                  {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
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
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Accepted: PDF, JPG, PNG. Max 10 MB.</p>
          </CardContent>
        </Card>

        {error && (
          <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>
            {error}
          </div>
        )}

        {/* Documents list */}
        <Card>
          <CardHeader><CardTitle>My documents ({docs.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p style={{ fontSize: 14, color: "#94a3b8" }}>Loading...</p>
            ) : docs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>No documents uploaded yet</p>
                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Upload your compliance documents above.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {docs.map(doc => {
                  const s = STATUS_STYLE[doc.status] ?? STATUS_STYLE.PENDING;
                  const typeLabel = DOC_TYPES.find(t => t.value === doc.docType)?.label ?? doc.docType;
                  return (
                    <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", border: "1.5px solid #e2e8f0", borderRadius: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        📄
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>{typeLabel}</div>
                        <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{new Date(doc.uploadedAt).toLocaleDateString("en-AU")}</div>
                        {doc.rejectionReason && (
                          <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>Rejected: {doc.rejectionReason}</div>
                        )}
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, flexShrink: 0 }}>
                        {s.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, padding: 4, flexShrink: 0 }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance checklist — workers & providers only */}
        {isWorker && <Card>
          <CardHeader><CardTitle>Required for support workers</CardTitle></CardHeader>
          <CardContent>
            {["NDIS_SCREENING", "POLICE_CHECK", "WWCC", "FIRST_AID"].map(req => {
              const have = docs.some(d => d.docType === req && d.status !== "REJECTED");
              const label = DOC_TYPES.find(t => t.value === req)?.label ?? req;
              return (
                <div key={req} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 16 }}>{have ? "✅" : "⭕"}</span>
                  <span style={{ fontSize: 13, color: have ? "#15803d" : "#64748b", fontWeight: have ? 600 : 400 }}>{label}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>}
      </div>
    </>
  );
}
