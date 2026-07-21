# Panduan Deploy — RuangKelas ke Vercel

## Prasyarat

- Akun [Vercel](https://vercel.com) (hubungkan dengan GitHub)
- Proyek Firebase aktif ([console.firebase.google.com](https://console.firebase.google.com))
- Git sudah diinisialisasi dan code sudah di-push ke GitHub

## Langkah 1: Siapkan Firebase

### 1.1 Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Buat project baru (atau gunakan yang sudah ada)
3. Catat **Project ID**

### 1.2 Aktifkan Authentication

1. Firebase Console → **Authentication** → **Get started**
2. Pilih penyedia **Google** → Enable
3. Masukkan email support (opsional) → **Save**
4. Buka tab **Settings** → **Authorized domains**
5. Tambahkan domain Vercel Anda: `namaproject.vercel.app`
6. Juga tambahkan domain preview: `namaproject-git-*.vercel.app`

### 1.3 Aktifkan Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Pilih mode **Start in test mode** (untuk development)
3. Pilih region terdekat (misal: `asia-southeast2`)

### 1.4 Atur Firestore Security Rules

Buka **Firestore** → **Rules**, paste rules berikut:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> **Catatan:** Izin ini mengizinkan semua user yang login untuk membaca/menulis semua data. Untuk production, perketat rules sesuai kebutuhan.

### 1.5 Aktifkan Storage (opsional, untuk upload file)

1. Firebase Console → **Storage** → **Get started**
2. Set security rules sesuai kebutuhan

### 1.6 Dapatkan Konfigurasi Firebase

1. Firebase Console → **Project Settings** → **General**
2. Scroll ke **Your apps** → Pilih **Web** (</> icon)
3. Daftarkan app (nama: `ruang-kelas-web`)
4. Salin konfigurasi `firebaseConfig`

## Langkah 2: Deploy ke Vercel

### 2.1 Via Vercel Dashboard (direkomendasikan)

1. Buka [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import repositori GitHub `Newibebrah/RuangKelas`
3. Framework preset: **Next.js** (terdeteksi otomatis)
4. **Environment Variables** — tambahkan 6 variabel berikut:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` (dari Firebase config) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `namaproject.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `namaproject` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `namaproject.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (angka dari Firebase config) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:...:web:...` |

5. **Deploy** → Tunggu selesai

### 2.2 Redeploy Setelah Update Code

1. Push code ke GitHub (`git push origin main`)
2. Vercel otomatis redeploy (atau manual: **Deployments** → **Trigger Deployment**)

## Langkah 3: Verifikasi

1. Buka URL Vercel (`https://namaproject.vercel.app`)
2. Klik **Masuk dengan Google** — login harus berhasil
3. Buat kelas, tambah tugas, buat tagihan — semua fitur harus berfungsi
4. Buka **Console browser** (F12) → pastikan tidak ada error merah

## Environment Variables Lengkap

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=namaproject.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=namaproject
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=namaproject.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> Semua variabel HARUS diawali `NEXT_PUBLIC_` agar bisa diakses di browser.

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| **Login gagal: domain belum terdaftar** | Tambahkan domain Vercel ke Firebase Auth → Authorized domains |
| **Gagal memuat data user** | Periksa Firestore security rules; pastikan `request.auth != null` |
| **White screen / error** | Buka Console browser (F12), cek error JavaScript |
| **404 setelah login** | Pastikan redirect URL `/dashboard` benar |
| **Build fail** | Periksa log build Vercel; pastikan semua env vars terisi |
