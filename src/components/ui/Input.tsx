"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { HiExclamationCircle } from "react-icons/hi";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute inset-y-0 left-0 inline-flex items-center px-3 text-text-muted text-sm border-r border-border rounded-l-xl bg-surface-muted">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={`w-full px-3.5 py-2.5 border-2 rounded-xl text-sm transition-all duration-200 outline-none ${
              error
                ? "border-danger/60 focus:ring-4 focus:ring-danger/10 focus:border-danger"
                : "border-border/70 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500"
            } ${prefix ? "pl-14" : ""} bg-surface text-text-primary placeholder:text-text-muted ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs font-medium text-danger flex items-center gap-1">
            <HiExclamationCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
