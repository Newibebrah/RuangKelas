"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  query,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  QueryConstraint,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UseFirestorePaginationOptions<T> {
  collectionName: string;
  constraints: QueryConstraint[];
  pageSize: number;
  mapDoc: (doc: { id: string; data: () => Record<string, unknown> }) => T;
  onError?: (error: string) => void;
}

export function useFirestorePagination<T>({
  collectionName,
  constraints: baseConstraints,
  pageSize,
  mapDoc,
  onError,
}: UseFirestorePaginationOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const collectionRef = collection(db, collectionName);

  const loadFirstPage = useCallback(() => {
    setLoading(true);
    setError(null);
    setHasMore(true);
    lastDocRef.current = null;

    const constraintsWithLimit = [...baseConstraints, limit(pageSize)];
    const q = query(collectionRef, ...constraintsWithLimit);

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs;
        const data = docs.map((d) => mapDoc({ id: d.id, data: () => d.data() as Record<string, unknown> }));
        setItems(data);
        setLoading(false);
        lastDocRef.current = docs[docs.length - 1] || null;
        setHasMore(docs.length >= pageSize);
      },
      async () => {
        try {
          const snap = await getDocs(q);
          const docs = snap.docs;
          const data = docs.map((d) => mapDoc({ id: d.id, data: () => d.data() as Record<string, unknown> }));
          setItems(data);
          setLoading(false);
          lastDocRef.current = docs[docs.length - 1] || null;
          setHasMore(docs.length >= pageSize);
        } catch {
          const msg = `Gagal memuat ${collectionName}`;
          setError(msg);
          onError?.(msg);
          setLoading(false);
        }
      }
    );

    unsubscribeRef.current = unsub;
    return unsub;
  }, [collectionName, JSON.stringify(baseConstraints), pageSize, mapDoc, onError]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocRef.current) return;
    setLoadingMore(true);

    const constraintsWithLimit = [...baseConstraints, startAfter(lastDocRef.current), limit(pageSize)];
    const q = query(collectionRef, ...constraintsWithLimit);

    try {
      const snap = await getDocs(q);
      const docs = snap.docs;
      const data = docs.map((d) => mapDoc({ id: d.id, data: () => d.data() as Record<string, unknown> }));
      setItems((prev) => [...prev, ...data]);
      lastDocRef.current = docs[docs.length - 1] || null;
      setHasMore(docs.length >= pageSize);
    } catch {
      setError(`Gagal memuat lebih banyak ${collectionName}`);
    } finally {
      setLoadingMore(false);
    }
  }, [baseConstraints, collectionName, hasMore, loadingMore, mapDoc, pageSize]);

  useEffect(() => {
    const unsub = loadFirstPage();
    return () => {
      if (typeof unsub === "function") unsub();
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [loadFirstPage]);

  return { items, loading, loadingMore, hasMore, error, loadMore, reload: loadFirstPage };
}
