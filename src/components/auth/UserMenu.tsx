"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { HiLogout, HiUser, HiPencil } from "react-icons/hi";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-hover transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Menu pengguna — ${user.displayName}`}
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName}
            width={32}
            height={32}
            className="rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center ring-2 ring-primary-200">
            <HiUser className="h-4 w-4 text-primary-600" />
          </div>
        )}
        <span className="text-sm font-medium text-text-primary hidden sm:block">
          {user.displayName}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl shadow-dropdown border border-border z-20 py-1 overflow-hidden"
            role="menu"
            aria-label="Menu pengguna"
          >
            <div className="px-4 py-3 border-b border-border-light">
              <p className="text-sm font-semibold text-text-primary">
                {user.displayName}
              </p>
              {user.username && (
                <p className="text-xs text-primary-600 font-medium">@{user.username}</p>
              )}
              <p className="text-xs text-text-muted">{user.email}</p>
              {user.bio && (
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{user.bio}</p>
              )}
              <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-semibold bg-primary-50 text-primary-600 rounded-lg capitalize">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => {
                router.push("/profile");
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              role="menuitem"
            >
              <HiPencil className="h-4 w-4" />
              Edit Profil
            </button>
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-danger transition-colors"
              role="menuitem"
            >
              <HiLogout className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
