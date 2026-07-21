# RuangKelas

Platform digital manajemen kelas berbasis web. Kelola tugas, kas kelas, pengurus organisasi, dan penugasan PJ mata pelajaran — semua dalam satu tempat.

## Fitur Utama

- **Autentikasi Google** — Login cepat dengan akun Google
- **Manajemen Kelas** — Buat dan gabung kelas dengan kode unik
- **Tugas** — Buat, edit, hapus tugas dengan deadline & notifikasi
- **Kas Kelas** — Tagihan periodik, riwayat transaksi, progres pembayaran per anggota
- **Pengurus** — Struktur organisasi kelas (Ketua, Sekretaris, Bendahara, dll.)
- **Roda Pemilihan** — Spin-the-wheel untuk memilih pengurus atau PJ mata pelajaran
- **PJ Mata Pelajaran** — Tugaskan penanggung jawab per mata pelajaran
- **Notifikasi** — Pemberitahuan tugas baru, tagihan, perubahan peran
- **Responsive** — Tampilan optimal di mobile dan desktop

## Tech Stack

| Teknologi | Keterangan |
|-----------|------------|
| **Next.js 16** | React framework (App Router) |
| **Firebase Auth** | Autentikasi Google |
| **Firebase Firestore** | Database real-time |
| **Firebase Storage** | Penyimpanan file |
| **Tailwind CSS v4** | Utility-first CSS |
| **Framer Motion** | Animasi |
| **React Hook Form + Zod** | Form & validasi |
| **date-fns** | Manipulasi tanggal |
| **Jest + RTL** | Unit testing |

## Menjalankan Lokal

```bash
# 1. Clone repositori
git clone https://github.com/Newibebrah/RuangKelas.git
cd RuangKelas

# 2. Install dependencies
npm install

# 3. Buat file .env.local (isi dari .env.example)
cp .env.example .env.local

# 4. Jalankan development server
npm run dev
```

Buka `http://localhost:3000`.

## Struktur Folder

```
src/
├── app/                    # Halaman (Next.js App Router)
│   ├── page.tsx            # Landing page
│   ├── dashboard/          # Dashboard (daftar kelas)
│   └── room/[roomId]/      # Halaman detail kelas
│       ├── page.tsx        # Beranda kelas
│       ├── tugas/          # Modul Tugas
│       ├── kas/            # Modul Kas
│       └── pengurus/       # Modul Pengurus
├── components/
│   ├── ui/                 # Komponen reusable (Button, Modal, Card, dll.)
│   ├── auth/               # Login, UserMenu, AuthGuard
│   ├── room/               # RoomCard, CreateRoomModal, JoinRoomModal
│   ├── tugas/              # AssignmentCard, AssignmentModal
│   ├── kas/                # PaymentTable, BillSetupModal, MemberProgressCard
│   ├── pengurus/           # ElectionWheel, ElectionModal, SubjectPJSection
│   └── class/actions/      # DeployModal
├── hooks/                  # Custom hooks (useAssignments, useKas, dll.)
├── lib/                    # Firebase config, auth context, room context, upload
└── types/                  # TypeScript interfaces
```

## Scripts

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Development server |
| `npm run build` | Build production |
| `npm run start` | Jalankan production |
| `npm run lint` | ESLint |
| `npm test` | Jest test runner |

## Deploy ke Vercel

Lihat [DEPLOY.md](./DEPLOY.md) untuk panduan deploy lengkap.
