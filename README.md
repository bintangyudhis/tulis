# Tulis — Planner Pribadi

Situs pribadi satu pengguna di tulis.bintangyudhis.my.id: jadwal harian
(umum, to do list, per jam), jadwal gym, goals bulanan, kalender bertanda
warna dengan pengingat, dan catatan bebas. Semua isi dinamis dari database
dan bisa diganti langsung di halaman masing-masing.

## Menu

- **Beranda**: ringkasan hari ini (jadwal, to do yang bisa dicentang,
  gym hari ini, tanda kalender, progres goals bulan ini).
- **Jadwal Harian**: Senin sampai Minggu dalam tiga jenis: umum (pagi,
  siang, sore, malam), to do list (centang selesai), per jam.
- **Gym**: gerakan per hari, detail set/repetisi, hari istirahat, catatan fokus.
- **Goals Bulanan**: target per bulan dengan centang dan bilah progres.
- **Kalender**: tandai tanggal dengan warna (hijau libur, biru acara, merah
  penting, kuning tenggat, ungu pribadi), catatan hari itu, dan pengingat
  email atau WhatsApp pada pagi hari-H.
- **Catatan**: tulis dan simpan ide atau inspirasi.
- **Print Jadwal**: tabel seminggu penuh siap cetak A4 landscape.
- **Pengaturan**: ganti sandi.

## Masuk

Satu akun, dibuat lewat seed migrasi awal. Centang "ingat perangkat ini"
saat masuk membuat sesi berlaku 180 hari sehingga tidak perlu masuk ulang
di perangkat yang sama.

## Teknologi

Next.js 16 + React 19 + Tailwind CSS 4, Prisma 6 + PostgreSQL (Supabase),
bcrypt untuk hash sandi, sesi berbasis token di database. Semua tanggal
mengikuti WIB (Asia/Jakarta). Deploy di Vercel region sin1; build menjalankan
`prisma migrate deploy` sebelum `next build`.

Env wajib: `DATABASE_URL` (pooler, runtime) dan `DIRECT_URL` (langsung,
migrasi).
