"use client";

// Provider PR-OM01 — plan, billing, passes and promotion history in one list.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Item { kind: string; label: string; amountAud: number | null; at: string; detail: string }

export function BillingHistoryCard() {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    api.get<{ history: Item[] }>("/subscriptions/me/history").then((r) => setItems(r.history)).catch(() => setItems([]));
  }, []);
  if (items === null) return null;
  return (
    <div style={{ border: "1px solid var(--clr-border)", borderRadius: 12, padding: "16px 18px", background: "var(--td-white)" }}>
      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, letterSpacing: 0.4, color: "var(--clr-muted)" }}>PLAN, PASS AND PROMOTION HISTORY</p>
      {items.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--clr-muted)" }}>Nothing yet. Plans, Shift Passes, Featured Shifts, listings and Platinum Tile purchases appear here.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((i, n) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, borderTop: n ? "1px solid var(--clr-border)" : "none", paddingTop: n ? 6 : 0 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{i.label}</div>
                <div style={{ fontSize: 11, color: "var(--clr-muted)" }}>{new Date(i.at).toLocaleDateString("en-AU")} · {i.detail}</div>
              </div>
              <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{i.amountAud != null ? `$${i.amountAud.toFixed(2)}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
