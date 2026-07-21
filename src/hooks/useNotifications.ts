"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppNotification } from "@/types";
import { useAuth } from "@/lib/auth-context";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications", user.id, "items"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as AppNotification
      );
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    });

    return unsub;
  }, [user]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;
      await updateDoc(
        doc(db, "notifications", user.id, "items", notificationId),
        { read: true }
      );
    },
    [user]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        updateDoc(doc(db, "notifications", user.id, "items", n.id), {
          read: true,
        })
      )
    );
  }, [user, notifications]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
