"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { LayoutGrid, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { ProviderAreaTabs } from "@/components/provider/ProviderAreaTabs";
import { WizardForm, opts, type StepDef, type Values } from "@/components/provider/listing-wizard/WizardForm";

interface Listing { id: string; status: string; suburb: string; state: string | null; serviceCategory: string | null; serviceCategories: string[] | null }
interface Branch { id: string; name: string; isActive: boolean; serviceLines: string[] }
interface Detail { capabilityLimits: string; competencies: string[]; branchIds: string[]; managerUserId: string | null }

const norm = (v: string) => v.trim().toUpperCase().replace(/[\s-]+/g, "_");
const label = (v: string) => JOB_CATEGORIES.find((c) => norm(c.value) === norm(v))?.label ?? v.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const COMPETENCIES = opts(["First Aid", "CPR", "Manual Handling", "Hoist", "Transport", "Medication competency", "Overnight Support", "Complex Care", "Behaviour Support", "NDIS screening", "WWCC", "Driver licence"]);

// Provider "Service lines" (approved demo): one card per service category the organisation offers.
// Add / Edit opens the "Service capability" popup; coverage is stored on the Branches, the capability text on the organisation.
export default function ProviderServiceLinesPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [details, setDetails] = useState<Record<string, Detail>>({});
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ cat: string | null } | null>(null);

  const load = useCallback(() => Promise.all([
    api.get<{ listings: Listing[] }>("/provider/listings?category=SERVICE").catch(() => ({ listings: [] as Listing[] })),
    api.get<{ branches: Branch[] }>("/provider-org/branches").catch(() => ({ branches: [] as Branch[] })),
    api.get<{ serviceLines: Record<string, Detail> }>("/provider-org/service-lines").catch(() => ({ serviceLines: {} as Record<string, Detail> })),
    api.get<{ administrators: { user: { id: string; name: string } }[] }>("/provider-org/administrators").catch(() => ({ administrators: [] })),
  ]).then(([l, b, d, a]) => {
    setListings(l.listings ?? []); setBranches((b.branches ?? []).filter((x) => x.isActive !== false)); setDetails(d.serviceLines ?? {});
    setOwners((a.administrators ?? []).map((x) => ({ id: x.user.id, name: x.user.name })));
  }).catch((e) => { setError(e instanceof Error ? e.message : "Could not load service lines"); setListings([]); }), []);
  useEffect(() => { void load(); }, [load]);

  const lines = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (cat: string, area?: string) => { const k = norm(cat); const s = map.get(k) ?? new Set<string>(); if (area) s.add(area); map.set(k, s); };
    for (const l of listings ?? []) {
      if (l.status === "CLOSED") continue;
      for (const c of l.serviceCategories?.length ? l.serviceCategories : l.serviceCategory ? [l.serviceCategory] : []) add(c, l.suburb);
    }
    for (const b of branches) for (const c of b.serviceLines ?? []) add(c, b.name);
    for (const c of Object.keys(details)) add(c);
    return [...map.entries()].map(([cat, areas]) => ({ cat, areas: [...areas] }));
  }, [listings, branches, details]);

  return (
    <div className="pd-workspace">
      <div className="pd-content">
        <div className="pd-breadcrumb">Provider / Service lines</div>
        <div className="pd-page-head">
          <ProviderAreaTabs />
          <div>
            <h1>Service lines</h1>
            <p>Reuse organisation capability in matching and listing forms.</p>
          </div>
          <div className="pd-buttons">
            <button type="button" className="pd-btn pd-btn-primary" onClick={() => setEditing({ cat: null })}><Plus />Add service line</button>
          </div>
        </div>
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {notice && <div className="pd-notice mb-4">{notice}</div>}
        {listings === null ? <div className="pd-quiet-empty">Loading…</div>
          : lines.length === 0 ? (
            <div className="pd-grid3">
              <div className="pd-empty">
                <LayoutGrid />
                <h3>No service lines yet</h3>
                <p>Add one to reuse it in matching and listings.</p>
              </div>
            </div>
          ) : (
            <div className="pd-grid3">
              {lines.map((l) => (
                <article key={l.cat} className="pd-record-card">
                  <LayoutGrid className="pd-icon-plain" />
                  <h2>{label(l.cat)}</h2>
                  <p className="pd-card-body" style={{ margin: 0 }}>{l.areas.join(", ") || "No coverage set"}</p>
                  <div>{details[l.cat]
                    ? <span className="pd-badge pd-badge-green">Scope review recorded</span>
                    : <span className="pd-badge pd-badge-orange">Capability not recorded</span>}</div>
                  <button type="button" className="pd-btn pd-btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setEditing({ cat: l.cat })}>Edit capability</button>
                </article>
              ))}
            </div>
          )}
      </div>

      {editing && (
        <ServiceCapabilityDialog
          category={editing.cat} branches={branches} detail={editing.cat ? details[editing.cat] : undefined}
          owners={[...(user ? [{ id: user.id, name: `${user.name} (Owner)` }] : []), ...owners]}
          onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); setNotice(m); void load(); }} />
      )}
    </div>
  );
}

function ServiceCapabilityDialog({ category, branches, detail, owners, onClose, onSaved }: {
  category: string | null; branches: Branch[]; detail?: Detail; owners: { id: string; name: string }[]; onClose: () => void; onSaved: (message: string) => void;
}) {
  const initialBranches = category ? branches.filter((b) => (b.serviceLines ?? []).some((c) => norm(c) === category)).map((b) => b.id) : [];
  const [values, setValues] = useState<Values>({
    category: category ?? "", branchIds: detail?.branchIds?.length ? detail.branchIds : initialBranches, managerUserId: detail?.managerUserId ?? "",
    capabilityLimits: detail?.capabilityLimits ?? "", competencies: detail?.competencies ?? [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const draftKey = `shiftify_service_line_draft_${category ?? "new"}`;

  useEffect(() => {
    if (detail) return;
    try { const raw = localStorage.getItem(draftKey); if (raw) { setValues((c) => ({ ...c, ...JSON.parse(raw) })); setNotice("Your saved draft was restored."); } } catch { /* none */ }
  }, [detail, draftKey]);

  const steps: StepDef[] = [{
    title: "Service capability", intro: "Registration scope is checked separately from profile entry.",
    fields: [
      { key: "category", label: "Service category", type: "select", options: JOB_CATEGORIES.map((c) => ({ v: norm(c.value), l: c.label })), required: true },
      { key: "branchIds", label: "Branch coverage", type: "checks", options: branches.map((b) => ({ v: b.id, l: b.name })), required: branches.length > 0 },
      { key: "managerUserId", label: "Responsible manager", type: "select", options: owners.map((o) => ({ v: o.id, l: o.name })) },
      { key: "capabilityLimits", label: "Capability and limits", type: "textarea", required: true, placeholder: "Current organisational capability" },
      { key: "competencies", label: "Staff competencies", type: "checks", options: COMPETENCIES },
    ],
  }];

  async function save() {
    for (const f of steps[0].fields) if (f.required && (values[f.key] === "" || values[f.key] === undefined || (Array.isArray(values[f.key]) && values[f.key].length === 0))) { setError(`${f.label} is required.`); return; }
    setBusy(true); setError(null);
    try {
      await api.put(`/provider-org/service-lines/${encodeURIComponent(values.category)}`, {
        capabilityLimits: values.capabilityLimits, competencies: values.competencies, branchIds: values.branchIds, managerUserId: values.managerUserId || null,
      });
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      onSaved(category ? "Service capability updated." : "Service line added.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the service line."); }
    finally { setBusy(false); }
  }

  return (
    <WizardForm
      title="Service capability" steps={steps} values={values} setValues={setValues} onClose={onClose} busy={busy} error={error} notice={notice}
      onSaveDraft={() => { try { localStorage.setItem(draftKey, JSON.stringify(values)); setNotice("Draft saved on this device."); } catch { setError("Could not save the draft on this device."); } }}
      submitLabel="Save and continue" onSubmit={() => void save()} />
  );
}
