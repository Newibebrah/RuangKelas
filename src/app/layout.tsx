import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const baseUrl = "https://ruang-kelas-beige.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "RuangKelas - Platform Manajemen Kelas Digital",
    template: "%s | RuangKelas",
  },
  description:
    "Platform manajemen kelas digital untuk pendidikan modern. Kelola tugas, materi, kas kelas, dan komunikasi dalam satu tempat.",
  keywords: [
    "kelas",
    "pendidikan",
    "manajemen kelas",
    "tugas sekolah",
    "materi pelajaran",
    "kas kelas",
    "platform edukasi",
  ],
  openGraph: {
    title: "RuangKelas - Platform Manajemen Kelas Digital",
    description:
      "Platform manajemen kelas digital untuk pendidikan modern",
    url: baseUrl,
    siteName: "RuangKelas",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "RuangKelas",
    description: "Platform manajemen kelas digital untuk pendidikan modern",
  },
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
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <AnalyticsTracker />
        </Providers>
      </body>
    </html>
  );
}
