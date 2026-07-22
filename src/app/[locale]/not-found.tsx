"use client";
import { Link } from "@/i18n/navigation";
import { useLocale } from "@/lib/locale-context";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-muted px-4">
      <div className="w-20 h-20 rounded-2xl bg-danger-light flex items-center justify-center mb-6">
        <span className="text-3xl font-bold text-danger">404</span>
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">{t('common.pageNotFound')}</h1>
      <p className="text-text-secondary text-center max-w-sm mb-8">
        {t('common.pageNotFoundDesc')}
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
      >
        {t('action.back')} ke {t('nav.beranda')}
      </Link>
    </div>
  );
}
