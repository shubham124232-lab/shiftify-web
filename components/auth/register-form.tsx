"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { UserRole } from "@/lib/types";

interface Props {
  role: UserRole;
  roleLabel: string;
  roleTagline: string;
}

export function RegisterForm({ role, roleLabel, roleTagline }: Props) {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const email    = watch("email");
  const phone    = watch("phone");
  const username = watch("username");
  const atLeastOne = Boolean(email || phone || username);

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      const res = await registerUser({
        name:     values.name,
        email:    values.email    || undefined,
        phone:    values.phone    || undefined,
        username: values.username || undefined,
        password: values.password,
        role,
      });
      router.replace(ROLE_DASHBOARD_PATHS[res.user.activeRole]);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-end text-sm">
        <span className="text-slate-500">Already have an account?&nbsp;</span>
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log In</Link>
      </div>

      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          {roleLabel}
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">{roleTagline}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            error={errors.name?.message}
            {...register("name")}
          />
        </Field>

        <Field
          label="Email address"
          htmlFor="email"
          error={errors.email?.message}
          hint="At least one of email, phone, or username is required"
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone (optional)" htmlFor="phone" error={errors.phone?.message}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+61 4xx xxx xxx"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </Field>
          <Field label="Username (optional)" htmlFor="username" error={errors.username?.message}>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="jane_smith"
              error={errors.username?.message}
              {...register("username")}
            />
          </Field>
        </div>

        {!atLeastOne && (
          <p className="text-xs text-amber-600">
            Provide at least one of email, phone, or username to continue.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </Field>
        </div>

        {serverError && (
          <div className="rounded-lg bg-emergency-50 px-3 py-2 text-sm text-emergency-700">
            {serverError}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create {roleLabel} Account
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        By registering you agree to our{" "}
        <a href="#" className="underline hover:text-slate-600">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
      </p>

      <p className="mt-4 text-center text-sm text-slate-500">
        Wrong role?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Go back
        </Link>
      </p>
    </div>
  );
}