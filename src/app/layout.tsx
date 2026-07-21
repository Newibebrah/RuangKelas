import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "RuangKelas - Platform Manajemen Kelas Digital",
  description: "Platform manajemen kelas digital untuk pendidikan modern. Kelola tugas, materi, dan komunikasi kelas dalam satu tempat.",
  keywords: ["kelas", "pendidikan", "manajemen kelas", "tugas", "materi"],
  openGraph: {
    title: "RuangKelas",
    description: "Platform manajemen kelas digital untuk pendidikan modern",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
