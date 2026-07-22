"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import { useLocale as useNextIntlLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

type Locale = "id" | "en";

interface Messages {
  [key: string]: string | Messages;
}

const localeData: Record<Locale, Messages> = {
  id: {
    app: { name: "RuangKelas", tagline: "Platform Manajemen Kelas Digital", heroTitle: "Kelola Kelas Jadi Lebih Mudah", heroDesc: "Platform digital untuk mengelola kelas, tugas, kas kelas, dan pengurus organisasi. Semua dalam satu tempat." },
    nav: { dashboard: "Dashboard", tugas: "Tugas", materi: "Materi", kas: "Kas", anggota: "Anggota", pengurus: "Pengurus", kelolaKas: "Kelola Kas", beranda: "Beranda", myClasses: "Kelas Saya" },
    action: { save: "Simpan", cancel: "Batal", delete: "Hapus", edit: "Edit", add: "Tambah", search: "Cari", download: "Download", upload: "Upload", back: "Kembali", next: "Lanjut", close: "Tutup", join: "Gabung", createClass: "Buat Kelas", joinClass: "Gabung Kelas", createBill: "Buat Tagihan", showMore: "Tampilkan lebih banyak", remaining: "tersisa" },
    auth: { login: "Masuk", logout: "Keluar", profile: "Profil", editProfile: "Edit Profil", accessDenied: "Akses Terbatas", pleaseLogin: "Silakan masuk untuk mengakses halaman ini" },
    kas: { title: "Kas Kelas", income: "Pemasukan", expense: "Pengeluaran", balance: "Saldo Kas", manage: "Kelola Kas", totalIncome: "Total Pemasukan", totalExpense: "Total Pengeluaran", addTransaction: "Tambah Transaksi", history: "Riwayat Transaksi", noTransaction: "Belum ada transaksi", paymentStatus: "Status Pembayaran Anggota", memberProgress: "Progres Anggota", arrears: "Tunggakan", paid: "lunas", membersArrears: "anggota tertunda", noBill: "Belum ada tagihan", noBillManageDesc: "Buat tagihan di menu Kelola Kas untuk mulai memantau pembayaran anggota", noBillNotManageDesc: "Bendahara belum membuat tagihan", noTxManageDesc: "Catat transaksi di menu Kelola Kas", noTxNotManageDesc: "Belum ada transaksi kas", manageDesc: "Pantau pemasukan, pengeluaran, dan pembayaran anggota", accessDeniedDesc: "Halaman ini hanya dapat diakses oleh Bendahara, Ketua, dan Sekretaris.", legacyIncome: "Pemasukan (Kas Lama)", legacyExpense: "Pengeluaran (Kas Lama)", legacyBalance: "Saldo (Kas Lama)", newTransactions: "Transaksi Baru", collected: "Uang Terkumpul", paymentTable: "Tabel Pembayaran Tagihan", categoryPlaceholder: "Contoh: Iuran, Alat Tulis, dll", viewReportDesc: "Lihat laporan keuangan kelas", frequencyWeekly: "minggu", frequencyMonthly: "bulan", addTransactionNew: "Tambah Transaksi Baru", type: "Tipe", amount: "Jumlah", description: "Deskripsi", category: "Kategori (opsional)", descriptionPlaceholder: "Deskripsi transaksi", noMemberPaymentDesc: "Tambahkan anggota kelas untuk memantau pembayaran" },
    common: { loading: "Memuat...", error: "Terjadi Kesalahan", retry: "Coba Lagi", empty: "Belum ada data", noResult: "Tidak ditemukan", search: "Cari...", redirecting: "Mengarahkan ke dashboard...", emptyClass: "Belum ada kelas", roomNotFound: "Kelas tidak ditemukan", roomNotFoundDesc: "Kelas yang kamu cari mungkin sudah dihapus", code: "Kode:", loadingClass: "Memuat kelas...", failedLoad: "Gagal Memuat Data", loadingKas: "Memuat data kas...", emptyMembers: "Belum ada anggota", memberCount: "anggota terdaftar", confirmDelete: "Apakah Anda yakin ingin menghapus transaksi ini?", pageNotFound: "Halaman Tidak Ditemukan", pageNotFoundDesc: "Halaman yang kamu cari tidak ada atau telah dipindahkan.", loadingMateri: "Memuat materi...", loadingAnggota: "Memuat anggota..." },
    theme: { light: "Terang", dark: "Gelap" },
    lang: { id: "Indonesia", en: "English" },
    dashboard: { subtitle: "Kelola kelas yang kamu ikuti atau buat", emptyDesc: "Buat kelas baru atau gabung dengan kode kelas yang sudah ada" },
    profile: { maxPhotoSize: "Maks 2MB", email: "Email", fullName: "Nama Lengkap", fullNamePlaceholder: "Nama lengkap Anda", username: "Username (opsional)", bio: "Bio", optional: "(opsional)", bioPlaceholder: "Tulis sesuatu tentang diri Anda" },
    room: { latestMembers: "Anggota Terbaru", activeTasks: "Tugas Aktif", saldoKas: "Saldo Kas" },
    pengurus: { title: "Pengurus", structure: "Struktur Pengurus", structureDesc: "Struktur organisasi kelas", election: "Roda Pemilihan", empty: "Belum ada pengurus", emptyManageDesc: "Gunakan roda pemilihan untuk memilih pengurus", emptyNotManageDesc: "Ketua belum mengisi struktur pengurus" },
    materi: { desc: "Bahan ajar dan materi pembelajaran", share: "Bagikan Materi" },
    tugas: { desc: "Daftar tugas dan tenggat waktu", newTask: "Tugas Baru", empty: "Belum ada tugas", emptyManageDesc: "Buat tugas pertama untuk kelas ini", emptyNotManageDesc: "Belum ada tugas yang diberikan" },
  },
  en: {
    app: { name: "RuangKelas", tagline: "Digital Classroom Management Platform", heroTitle: "Manage Classes Made Easier", heroDesc: "A digital platform for managing classes, assignments, class finances, and organizational management. All in one place." },
    nav: { dashboard: "Dashboard", tugas: "Assignments", materi: "Materials", kas: "Finance", anggota: "Members", pengurus: "Management", kelolaKas: "Manage Finance", beranda: "Home", myClasses: "My Classes" },
    action: { save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", add: "Add", search: "Search", download: "Download", upload: "Upload", back: "Back", next: "Next", close: "Close", join: "Join", createClass: "Create Class", joinClass: "Join Class", createBill: "Create Bill", showMore: "Show more", remaining: "remaining" },
    auth: { login: "Login", logout: "Logout", profile: "Profile", editProfile: "Edit Profile", accessDenied: "Access Denied", pleaseLogin: "Please login to access this page" },
    kas: { title: "Class Finance", income: "Income", expense: "Expense", balance: "Balance", manage: "Manage Finance", totalIncome: "Total Income", totalExpense: "Total Expense", addTransaction: "Add Transaction", history: "Transaction History", noTransaction: "No transactions yet", paymentStatus: "Member Payment Status", memberProgress: "Member Progress", arrears: "pending", paid: "Paid", membersArrears: "members pending", noBill: "No bill yet", noBillManageDesc: "Create a bill in Manage Finance to start tracking member payments", noBillNotManageDesc: "Treasurer hasn't created a bill yet", noTxManageDesc: "Record transactions in Manage Finance", noTxNotManageDesc: "No finance transactions yet", manageDesc: "Monitor income, expenses, and member payments", accessDeniedDesc: "This page can only be accessed by Treasurer, Chairperson, and Secretary.", legacyIncome: "Income (Legacy)", legacyExpense: "Expense (Legacy)", legacyBalance: "Balance (Legacy)", newTransactions: "New Transactions", collected: "Collected", paymentTable: "Bill Payment Table", categoryPlaceholder: "E.g., Dues, Stationery, etc.", viewReportDesc: "View class financial reports", frequencyWeekly: "week", frequencyMonthly: "month", addTransactionNew: "Add New Transaction", type: "Type", amount: "Amount", description: "Description", category: "Category (optional)", descriptionPlaceholder: "Transaction description", noMemberPaymentDesc: "Add class members to track payments" },
    common: { loading: "Loading...", error: "Something went wrong", retry: "Try Again", empty: "No data yet", noResult: "No results found", search: "Search...", redirecting: "Redirecting to dashboard...", emptyClass: "No classes yet", roomNotFound: "Class not found", roomNotFoundDesc: "The class you're looking for may have been deleted", code: "Code:", loadingClass: "Loading class...", failedLoad: "Failed to Load Data", loadingKas: "Loading finance data...", emptyMembers: "No members yet", memberCount: "members registered", confirmDelete: "Are you sure you want to delete this transaction?", pageNotFound: "Page Not Found", pageNotFoundDesc: "The page you're looking for doesn't exist or has been moved.", loadingMateri: "Loading materials...", loadingAnggota: "Loading members..." },
    theme: { light: "Light", dark: "Dark" },
    lang: { id: "Indonesia", en: "English" },
    dashboard: { subtitle: "Manage classes you follow or create", emptyDesc: "Create a new class or join with an existing class code" },
    profile: { maxPhotoSize: "Max 2MB", email: "Email", fullName: "Full Name", fullNamePlaceholder: "Your full name", username: "Username (optional)", bio: "Bio", optional: "(optional)", bioPlaceholder: "Write something about yourself" },
    room: { latestMembers: "Latest Members", activeTasks: "Active Tasks", saldoKas: "Balance" },
    pengurus: { title: "Management", structure: "Management Structure", structureDesc: "Class organization structure", election: "Election Wheel", empty: "No management yet", emptyManageDesc: "Use the election wheel to select management", emptyNotManageDesc: "Chairperson hasn't filled the management structure" },
    materi: { desc: "Teaching materials and learning resources", share: "Share Material" },
    tugas: { desc: "List of assignments and deadlines", newTask: "New Assignment", empty: "No assignments yet", emptyManageDesc: "Create the first assignment for this class", emptyNotManageDesc: "No assignments have been given" },
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

function setLangAttr(locale: string) {
  document.documentElement.lang = locale;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useNextIntlLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = useCallback(
    (l: Locale) => {
      localStorage.setItem("locale", l);
      setLangAttr(l);
      router.replace(pathname, { locale: l });
    },
    [router, pathname]
  );

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
