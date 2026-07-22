import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "../providers";
import { cookies } from "next/headers";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const cookieStore = await cookies();
  const isMobile = cookieStore.get("mobile")?.value === "true";

  return (
    <NextIntlClientProvider locale={locale} messages={{}}>
      <Providers isMobile={isMobile}>{children}</Providers>
    </NextIntlClientProvider>
  );
}
