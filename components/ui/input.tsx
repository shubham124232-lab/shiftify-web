"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors",
        "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
        "disabled:bg-slate-50 disabled:text-slate-500",
        error ? "border-emergency-500 focus:border-emergency-500 focus:ring-emergency-500" : "border-slate-300",
        className,
      )}
      {...rest}
    />
  );
});
