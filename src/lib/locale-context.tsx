"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

type Locale = "id" | "en";

interface Messages {
  [key: string]: string | Messages;
}

const localeData: Record<Locale, Messages> = {
  id: {
    app: { name: "RuangKelas", tagline: "Platform Manajemen Kelas Digital" },
    nav: { dashboard: "Dashboard", tugas: "Tugas", materi: "Materi", kas: "Kas", anggota: "Anggota", pengurus: "Pengurus", kelolaKas: "Kelola Kas", beranda: "Beranda" },
    action: { save: "Simpan", cancel: "Batal", delete: "Hapus", edit: "Edit", add: "Tambah", search: "Cari", download: "Download", upload: "Upload", back: "Kembali", next: "Lanjut", close: "Tutup" },
    auth: { login: "Masuk", logout: "Keluar", profile: "Profil", editProfile: "Edit Profil", accessDenied: "Akses Terbatas", pleaseLogin: "Silakan masuk untuk mengakses halaman ini" },
    kas: { title: "Kas Kelas", income: "Pemasukan", expense: "Pengeluaran", balance: "Saldo Kas", manage: "Kelola Kas", totalIncome: "Total Pemasukan", totalExpense: "Total Pengeluaran", addTransaction: "Tambah Transaksi", history: "Riwayat Transaksi", noTransaction: "Belum ada transaksi", paymentStatus: "Status Pembayaran Anggota", memberProgress: "Progres Anggota", arrears: "tertunda" },
    common: { loading: "Memuat...", error: "Terjadi Kesalahan", retry: "Coba Lagi", empty: "Belum ada data", noResult: "Tidak ditemukan", search: "Cari..." },
    theme: { light: "Terang", dark: "Gelap" },
    lang: { id: "Indonesia", en: "English" },
  },
  en: {
    app: { name: "RuangKelas", tagline: "Digital Classroom Management Platform" },
    nav: { dashboard: "Dashboard", tugas: "Assignments", materi: "Materials", kas: "Finance", anggota: "Members", pengurus: "Management", kelolaKas: "Manage Finance", beranda: "Home" },
    action: { save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", add: "Add", search: "Search", download: "Download", upload: "Upload", back: "Back", next: "Next", close: "Close" },
    auth: { login: "Login", logout: "Logout", profile: "Profile", editProfile: "Edit Profile", accessDenied: "Access Denied", pleaseLogin: "Please login to access this page" },
    kas: { title: "Class Finance", income: "Income", expense: "Expense", balance: "Balance", manage: "Manage Finance", totalIncome: "Total Income", totalExpense: "Total Expense", addTransaction: "Add Transaction", history: "Transaction History", noTransaction: "No transactions yet", paymentStatus: "Member Payment Status", memberProgress: "Member Progress", arrears: "pending" },
    common: { loading: "Loading...", error: "Something went wrong", retry: "Try Again", empty: "No data yet", noResult: "No results found", search: "Search..." },
    theme: { light: "Light", dark: "Dark" },
    lang: { id: "Indonesia", en: "English" },
  },
};

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (path: string) => string;
}

function getNestedValue(obj: Messages, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "id" || stored === "en") {
      document.documentElement.lang = stored;
      setLocaleState(stored);
    } else {
      const detected = navigator.language?.startsWith("id") ? "id" : "en";
      document.documentElement.lang = detected;
      setLocaleState(detected);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (path: string) => getNestedValue(localeData[locale], path),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within a LocaleProvider");
  return context;
}
