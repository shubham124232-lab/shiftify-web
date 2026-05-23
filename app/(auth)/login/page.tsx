"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ROLE_DASHBOARD_PATHS, SIGNUP_ROLES, ROLE_LABELS } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils/cn";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<(typeof SIGNUP_ROLES)[number] | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const user = await login(values.identifier, values.password);
      const next = params.get("next");
      router.replace(next || ROLE_DASHBOARD_PATHS[user.activeRole]);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Login failed");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-end text-sm">
        <span className="text-slate-500">Don&apos;t have an account?&nbsp;</span>
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">Sign Up</Link>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Log in to your Shiftify account</p>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">I am a</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SIGNUP_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                selectedRole === r
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Role selection is just a hint; your role is determined by your account.</p>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">or continue with email / phone / username</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email, phone, or username" htmlFor="identifier" error={errors.identifier?.message}>
          <Input
            id="identifier"
            type="text"
            autoComplete="username"
            placeholder="you@example.com"
            error={errors.identifier?.message}
            {...register("identifier")}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
        </Field>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Keep me signed in
          </label>
          <Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <div className="rounded-lg bg-emergency-50 px-3 py-2 text-sm text-emergency-700">{serverError}</div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Log In
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">or sign in with</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-600 disabled:opacity-60"
          title="OAuth coming later"
        >
          Google
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-600 disabled:opacity-60"
          title="OAuth coming later"
        >
          Apple
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">Create one free</Link>
      </p>
    </div>
  );
}
