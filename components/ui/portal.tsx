"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Renders children on document.body so a popup's overlay covers the whole window (sticky headers and
// ancestor stacking contexts can't draw over it) and its fixed positioning is relative to the viewport.
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? createPortal(children, document.body) : null;
}
