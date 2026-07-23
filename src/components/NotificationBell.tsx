"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { HiBell, HiCheck, HiTrash } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } =
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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
      >
        <HiBell className="h-5 w-5 text-white/80" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 text-[10px] font-bold text-white bg-danger rounded-full ring-2 ring-white/30"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/20 dark:border-slate-700/30 z-50 max-h-96 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <h3 className="text-sm font-bold text-text-primary font-heading">
                Notifikasi
              </h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-text-muted hover:text-danger transition-colors font-medium"
                    title="Hapus semua"
                  >
                    Hapus semua
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">
                  Belum ada notifikasi
                </p>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group flex items-start gap-1 px-4 py-3 hover:bg-surface-hover/50 transition-colors border-b border-border/30 last:border-0 ${
                      !n.read ? "bg-primary-50/40 dark:bg-primary-900/10" : ""
                    }`}
                  >
                    <button
                      onClick={() => handleClick(n)}
                      className="flex-1 text-left min-w-0"
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
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="p-1.5 text-text-muted hover:text-danger rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-1"
                      title="Hapus notifikasi"
                    >
                      <HiTrash className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
