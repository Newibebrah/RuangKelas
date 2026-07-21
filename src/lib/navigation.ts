import {
  HiAcademicCap,
  HiClipboardList,
  HiBookOpen,
  HiCash,
  HiUserGroup,
  HiUsers,
  HiCog,
} from "react-icons/hi";
import { ComponentType } from "react";

export interface TabDefinition {
  label: string;
  icon: ComponentType<{ className?: string }>;
  getHref: (roomId: string) => string;
  exact: boolean;
  showIf?: "bendahara" | "ketua" | "sekretaris" | "admin";
}

export const roomTabs: TabDefinition[] = [
  { label: "Beranda", icon: HiAcademicCap, getHref: (id) => `/room/${id}`, exact: true },
  { label: "Tugas", icon: HiClipboardList, getHref: (id) => `/room/${id}/tugas`, exact: false },
  { label: "Materi", icon: HiBookOpen, getHref: (id) => `/room/${id}/materi`, exact: false },
  { label: "Kas", icon: HiCash, getHref: (id) => `/room/${id}/kas`, exact: false },
  { label: "Anggota", icon: HiUserGroup, getHref: (id) => `/room/${id}/anggota`, exact: false },
  { label: "Pengurus", icon: HiUsers, getHref: (id) => `/room/${id}/pengurus`, exact: false },
  { label: "Kelola Kas", icon: HiCog, getHref: (id) => `/room/${id}/kelola-kas`, exact: false, showIf: "bendahara" },
];
