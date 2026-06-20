"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "genlayer" | "risk" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-amber-bond text-port-black font-semibold border border-amber-bond " +
    "hover:bg-amber-400 hover:border-amber-400 active:scale-[0.98] " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-bond",
  secondary:
    "bg-port-card text-signal font-medium border border-port-border " +
    "hover:border-port-border-bright hover:bg-port-panel active:scale-[0.98] " +
    "disabled:opacity-40 disabled:cursor-not-allowed",
  genlayer:
    "bg-violet-consensus text-signal font-semibold border border-violet-consensus " +
    "hover:bg-violet-700 hover:border-violet-700 active:scale-[0.98] " +
    "shadow-violet-glow " +
    "disabled:opacity-40 disabled:cursor-not-allowed",
  risk:
    "bg-red-failed text-signal font-semibold border border-red-failed " +
    "hover:bg-red-600 hover:border-red-600 active:scale-[0.98] " +
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-fog font-medium border border-transparent " +
    "hover:text-signal hover:border-port-border active:scale-[0.98] " +
    "disabled:opacity-40 disabled:cursor-not-allowed",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-11 px-[18px] text-[14px] gap-2",
  lg: "h-13 px-6 text-[15px] gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-btn",
          "transition-all duration-150 cursor-pointer select-none",
          "font-body",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span className="opacity-70">Loading…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
