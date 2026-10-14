"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useBranchWorkspace, restoreBranchWorkspace } from "@/lib/store/branchWorkspace";

// Header selector: scope the Services, Housing, Internal Team and Administrators pages to one Branch.
export function BranchWorkspaceSelect() {
  const { branchId, setBranchId } = useBranchWorkspace();
  const [branches, setBranches] = useState<{ id: string; name: string }[] | null>(null);

  useEffect(() => {
    restoreBranchWorkspace();
    api.get<{ branches: { id: string; name: string; isActive: boolean }[] }>("/provider-org/branches")
      .then((r) => setBranches((r.branches ?? []).filter((b) => b.isActive)))
      .catch(() => setBranches([]));
  }, []);

  // A saved Branch that no longer exists falls back to All Branches.
  useEffect(() => {
    if (branches && branchId && !branches.some((b) => b.id === branchId)) setBranchId(null);
  }, [branches, branchId, setBranchId]);

  if (!branches || branches.length === 0) return null;
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
      <select
        aria-label="Branch workspace"
        value={branchId ?? ""}
        onChange={(e) => setBranchId(e.target.value || null)}
        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
      >
        <option value="">All Branches</option>
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </label>
  );
}
