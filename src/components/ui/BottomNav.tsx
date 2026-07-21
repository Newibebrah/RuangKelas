"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HiAcademicCap,
  HiClipboardList,
  HiCash,
  HiUsers,
} from "react-icons/hi";

interface BottomNavProps {
  roomId: string;
}

const tabs = [
  { label: "Beranda", getHref: (id: string) => `/room/${id}`, icon: HiAcademicCap, exact: true },
  { label: "Tugas", getHref: (id: string) => `/room/${id}/tugas`, icon: HiClipboardList, exact: false },
  { label: "Kas", getHref: (id: string) => `/room/${id}/kas`, icon: HiCash, exact: false },
  { label: "Pengurus", getHref: (id: string) => `/room/${id}/pengurus`, icon: HiUsers, exact: false },
];

export function BottomNav({ roomId }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const href = tab.getHref(roomId);
          const isActive = tab.exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={tab.label}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
