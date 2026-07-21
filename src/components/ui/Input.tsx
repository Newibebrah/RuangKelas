"use client";

import { InputHTMLAttributes, forwardRef } from "react";

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
          <label className="block text-sm font-medium text-text-primary mb-1.5">
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
            className={`w-full px-3 py-2.5 border rounded-xl text-sm transition-all duration-200 outline-none ${
              error
                ? "border-danger focus:ring-2 focus:ring-danger/20 focus:border-danger"
                : "border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            } ${prefix ? "pl-12" : ""} bg-surface text-text-primary placeholder:text-text-muted ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs font-medium text-danger flex items-center gap-1">
            <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
