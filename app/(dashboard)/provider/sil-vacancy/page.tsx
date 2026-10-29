"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The listing form is now a popup on its list page (approved Provider demo); old links and bookmarks land there.
export default function SilVacancyLauncher() {
  const router = useRouter();
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const extra = ["edit", "duplicate"].filter((k) => sp.get(k)).map((k) => `${k}=${sp.get(k)}`);
    router.replace("/provider/housing" + ("?wizard=housing" + (extra.length ? "&" + extra.join("&") : "")));
  }, [router]);
  return null;
}
