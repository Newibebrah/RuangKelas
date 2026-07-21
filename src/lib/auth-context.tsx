"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        setUser({ id: userDoc.id, ...userDoc.data() } as User);
      } else {
        setUser(null);
      }
    } catch {
      setError("Gagal memuat data user");
    }
  };

  const createUserIfNotExists = async (fbUser: FirebaseUser) => {
    const userDoc = await getDoc(doc(db, "users", fbUser.uid));
    if (!userDoc.exists()) {
      const newUser: Omit<User, "id" | "createdAt" | "updatedAt"> = {
        email: fbUser.email || "",
        displayName: fbUser.displayName || "User",
        photoURL: fbUser.photoURL || undefined,
        role: "siswa",
        roomIds: [],
      };
      await setDoc(doc(db, "users", fbUser.uid), {
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await fetchUserData(fbUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await createUserIfNotExists(result.user);
          await fetchUserData(result.user.uid);
        }
      })
      .catch((err: { code?: string; message?: string }) => {
        console.error("Redirect login error:", err.code, err.message);
        if (err.code === "auth/unauthorized-domain") {
          setError("Domain belum terdaftar. Admin: tambahkan domain Vercel ke Firebase Console > Authentication > Settings > Authorized domains.");
        } else if (err.code === "auth/operation-not-supported") {
        } else {
          setError(err.message || "Gagal login. Cek console browser untuk detail.");
        }
      });
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/popup-blocked") {
        try {
          const provider = new GoogleAuthProvider();
          setError("");
          await signInWithRedirect(auth, provider);
        } catch {
          setError("Popup diblokir dan redirect gagal. Coba browser lain.");
        }
      } else if (e.code === "auth/popup-closed-by-user") {
        setError("");
      } else if (e.code === "auth/unauthorized-domain") {
        setError("Domain belum terdaftar. Admin: tambahkan domain Vercel ke Firebase Console > Authentication > Settings > Authorized domains.");
      } else {
        setError(e.message || "Gagal login");
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch {
      setError("Gagal logout");
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
