import type { Metadata } from "next";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { WebVitalsReporter } from "@/lib/web-vitals";
import { Suspense } from "react";
import { inter, headingFont } from "@/lib/fonts";

const baseUrl = "https://ruang-kelas-beige.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "RuangKelas",
    template: "%s | RuangKelas",
  },
  description: "Platform manajemen kelas digital",
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RuangKelas",
  url: baseUrl,
  description: "Platform manajemen kelas digital untuk pendidikan modern",
  applicationCategory: "EducationalApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`h-full antialiased ${inter.variable} ${headingFont.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  var isDark = t === 'dark';
                  if (!t) isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  var l = localStorage.getItem('locale');
                  if (l === 'id' || l === 'en') document.documentElement.lang = l;
                } catch(e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <WebVitalsReporter />
      </body>
    </html>
  );
}
