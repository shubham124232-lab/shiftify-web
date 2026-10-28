import { create } from "zustand";

// Provider "Branch workspace" (Provider demo header selector). null = All Branches.
// Kept in localStorage so the choice survives a reload; storage can be blocked, so every access is guarded.
const KEY = "shiftify_branch_workspace";

function read(): string | null {
  try { return typeof window === "undefined" ? null : window.localStorage.getItem(KEY); } catch { return null; }
}

interface BranchWorkspaceState {
  branchId: string | null;
  setBranchId: (id: string | null) => void;
}

export const useBranchWorkspace = create<BranchWorkspaceState>((set) => ({
  branchId: null,
  setBranchId: (id) => {
    try { if (id) window.localStorage.setItem(KEY, id); else window.localStorage.removeItem(KEY); } catch { /* ignore */ }
    set({ branchId: id });
  },
}));

// Restore the saved choice once on the client (called by the selector when it mounts).
export function restoreBranchWorkspace(): void {
  const saved = read();
  if (saved) useBranchWorkspace.setState({ branchId: saved });
}
