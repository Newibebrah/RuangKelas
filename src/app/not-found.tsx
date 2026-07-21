import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-muted px-4">
      <div className="w-20 h-20 rounded-2xl bg-danger-light flex items-center justify-center mb-6">
        <span className="text-3xl font-bold text-danger">404</span>
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-text-secondary text-center max-w-sm mb-8">
        Halaman yang kamu cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
