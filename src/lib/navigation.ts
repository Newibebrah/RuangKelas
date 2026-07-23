import {
  HiAcademicCap,
  HiClipboardList,
  HiBookOpen,
  HiCash,
  HiUserGroup,
  HiUsers,
  HiCog,
  HiCalendar,
  HiDatabase,
  HiClock,
} from "react-icons/hi";
import { ComponentType } from "react";

export interface TabDefinition {
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  getHref: (roomId: string) => string;
  exact: boolean;
  showIf?: "bendahara" | "ketua" | "sekretaris" | "admin";
}

export const roomTabs: TabDefinition[] = [
  { labelKey: "beranda", icon: HiAcademicCap, getHref: (id) => `/room/${id}`, exact: true },
  { labelKey: "tugas", icon: HiClipboardList, getHref: (id) => `/room/${id}/tugas`, exact: false },
  { labelKey: "materi", icon: HiBookOpen, getHref: (id) => `/room/${id}/materi`, exact: false },
  { labelKey: "kas", icon: HiCash, getHref: (id) => `/room/${id}/kas`, exact: false },
  { labelKey: "anggota", icon: HiUserGroup, getHref: (id) => `/room/${id}/anggota`, exact: false },
  { labelKey: "jadwal", icon: HiCalendar, getHref: (id) => `/room/${id}/jadwal`, exact: false },
  { labelKey: "pengurus", icon: HiUsers, getHref: (id) => `/room/${id}/pengurus`, exact: false },
  { labelKey: "riwayat", icon: HiClock, getHref: (id) => `/room/${id}/riwayat`, exact: false },
  { labelKey: "kelolaKas", icon: HiCog, getHref: (id) => `/room/${id}/kelola-kas`, exact: false, showIf: "bendahara" },
  { labelKey: "kelolaData", icon: HiDatabase, getHref: (id) => `/room/${id}/kelola-data`, exact: false, showIf: "admin" },
];
