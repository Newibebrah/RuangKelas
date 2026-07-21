"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Room, RoomMember } from "@/types";
import { useAuth } from "./auth-context";

interface RoomContextType {
  rooms: Room[];
  currentRoom: Room | null;
  members: RoomMember[];
  loading: boolean;
  error: string | null;
  setCurrentRoomId: (roomId: string | null) => void;
  createRoom: (name: string, description: string) => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to user's rooms
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "rooms"),
      where("memberIds", "array-contains", user.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const roomList = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Room
        );
        setRooms(roomList);
        setLoading(false);
      },
      () => {
        setError("Gagal memuat daftar kelas");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Subscribe to members of current room
  useEffect(() => {
    if (!currentRoom?.id) return;

    const q = query(
      collection(db, "rooms", currentRoom.id, "members"),
      where("roomId", "==", currentRoom.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as RoomMember
      );
      setMembers(memberList);
    });

    return unsubscribe;
  }, [currentRoom?.id]);

  const setCurrentRoomId = useCallback(async (roomId: string | null) => {
    if (!roomId) {
      setCurrentRoom(null);
      setMembers([]);
      return;
    }
    try {
      const docRef = doc(db, "rooms", roomId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setCurrentRoom({ id: snap.id, ...snap.data() } as Room);
      }
    } catch {
      setError("Gagal memuat detail kelas");
    }
  }, []);

  const createRoom = async (name: string, description: string) => {
    if (!user) throw new Error("Harus login");

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const docRef = await addDoc(collection(db, "rooms"), {
      name,
      description,
      code,
      createdBy: user.id,
      memberIds: [user.id],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "rooms", docRef.id, "members"), {
      roomId: docRef.id,
      userId: user.id,
      role: "admin",
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL || null,
      joinedAt: serverTimestamp(),
    });

    return docRef.id;
  };

  const joinRoom = async (code: string) => {
    if (!user) throw new Error("Harus login");
    setError(null);

    const q = query(
      collection(db, "rooms"),
      where("code", "==", code.toUpperCase())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error("Kode kelas tidak ditemukan");

    const roomDoc = snapshot.docs[0];
    const roomData = roomDoc.data();

    if (roomData.memberIds?.includes(user.id))
      throw new Error("Kamu sudah bergabung di kelas ini");

    await updateDoc(doc(db, "rooms", roomDoc.id), {
      memberIds: [...(roomData.memberIds || []), user.id],
    });

    await addDoc(collection(db, "rooms", roomDoc.id, "members"), {
      roomId: roomDoc.id,
      userId: user.id,
      role: "siswa",
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL || null,
      joinedAt: serverTimestamp(),
    });
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) throw new Error("Harus login");

    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data();

    if (roomData) {
      await updateDoc(roomRef, {
        memberIds: roomData.memberIds?.filter(
          (id: string) => id !== user.id
        ) || [],
      });
    }
  };

  const deleteRoomFn = async (roomId: string) => {
    await deleteDoc(doc(db, "rooms", roomId));
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        currentRoom,
        members,
        loading,
        error,
        setCurrentRoomId,
        createRoom,
        joinRoom,
        leaveRoom,
        deleteRoom: deleteRoomFn,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}
