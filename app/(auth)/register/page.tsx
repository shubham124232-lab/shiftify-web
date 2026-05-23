"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIGNUP_ROLES, ROLE_LABELS, ROLE_TAGLINES, type SignupRole } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const ROLE_PATHS: Record<SignupRole, string> = {
  PARTICIPANT: "/register/participant",
  SUPPORT_WORKER: "/register/worker",
  PROVIDER: "/register/provider",
  COORDINATOR: "/register/coordinator",
  PLAN_MANAGER: "/register/plan-manager",
};

export default function RegisterRolePickerPage() {
  const router = useRouter();
  const [role, setRole] = useState<SignupRole | null>(null);

  function handleContinue() {
    if (!role) return;
    router.push(ROLE_PATHS[role]);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-end text-sm">
        <span className="text-slate-500">Already have an account?&nbsp;</span>
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log In</Link>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">First, tell us how you&apos;ll use Shiftify</p>

      <div className="mt-6 space-y-3">
        {SIGNUP_ROLES.map((r) => {
          const selected = role === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-colors",
                selected
                  ? "border-brand-600 bg-brand-50"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{ROLE_LABELS[r]}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{ROLE_TAGLINES[r]}</div>
                </div>
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2",
                    selected ? "border-brand-600 bg-brand-600" : "border-slate-300 bg-white",
                  )}
                >
                  {selected ? (
                    <svg viewBox="0 0 20 20" fill="white" className="h-full w-full p-0.5">
                      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L9 11.6l6.3-6.3a1 1 0 0 1 1.4 0z" />
                    </svg>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Button size="lg" className="mt-6 w-full" disabled={!role} onClick={handleContinue}>
        Continue
      </Button>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
