"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { HiBell, HiCheck } from "react-icons/hi";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (n: (typeof notifications)[0]) => {
    markAsRead(n.id);
    setOpen(false);
    router.push(n.link);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-surface-hover transition-colors"
      >
        <HiBell className="h-5 w-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 text-[10px] font-bold text-white bg-danger rounded-full ring-2 ring-surface">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface rounded-2xl shadow-dropdown border border-border z-50 max-h-96 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <h3 className="text-sm font-semibold text-text-primary">
              Notifikasi
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">
                Belum ada notifikasi
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border-light last:border-0 ${
                    !n.read ? "bg-primary-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.read ? "text-text-primary" : "font-semibold text-text-primary"} truncate`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-text-muted mt-1">
                        {n.createdAt?.toDate
                          ? formatDistanceToNow(n.createdAt.toDate(), {
                              addSuffix: true,
                              locale: id,
                            })
                          : ""}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
