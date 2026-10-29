"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The listing form is now a popup on its list page (approved Provider demo); old links and bookmarks land there.
export default function PostServiceLauncher() {
  const router = useRouter();
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const extra = ["edit", "duplicate"].filter((k) => sp.get(k)).map((k) => `${k}=${sp.get(k)}`);
    router.replace("/provider/services" + ("?wizard=service" + (extra.length ? "&" + extra.join("&") : "")));
  }, [router]);
  return null;
}
