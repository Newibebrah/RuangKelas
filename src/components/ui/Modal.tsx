"use client";

import { ReactNode, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX } from "react-icons/hi";
import { useMobile } from "@/lib/mobile-context";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback(
    (e: KeyboardEvent) => {
      if (!modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        }
      }, 100);
      document.addEventListener("keydown", trapFocus);
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", trapFocus);
    };
  }, [isOpen, trapFocus]);

  const { isMobile } = useMobile();

  const sizes: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {isMobile ? (
            <motion.div
              ref={modalRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.9 }}
              onKeyDown={(e) => {
                if (e.key === "Escape") { e.stopPropagation(); onClose(); }
              }}
              className="fixed bottom-0 left-0 right-0 w-full max-h-[90vh] flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-t-2xl shadow-2xl border-t border-white/20 dark:border-slate-700/30"
            >
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-text-muted/30" />
              </div>
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-light shrink-0">
                <h2 className="text-base font-bold text-text-primary font-heading">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Tutup"
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-xl transition-all duration-200 hover:rotate-90"
                >
                  <HiX className="h-5 w-5" />
                </button>
              </div>
              <div className="px-5 py-4 overflow-y-auto">{children}</div>
            </motion.div>
          ) : (
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onKeyDown={(e) => {
                if (e.key === "Escape") { e.stopPropagation(); onClose(); }
              }}
              className={`relative w-full ${sizes[size]} max-h-[85vh] flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.2),0_8px_24px_-6px_rgba(0,0,0,0.1)] border border-white/20 dark:border-slate-700/30 mx-4`}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border-light shrink-0">
                <h2 className="text-lg font-bold text-text-primary font-heading">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Tutup"
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-xl transition-all duration-200 hover:rotate-90 hover:scale-110"
                >
                  <HiX className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-5 overflow-y-auto">{children}</div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
