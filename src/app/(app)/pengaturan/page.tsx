import FormSandi from "./FormSandi";

export default function PengaturanPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Pengaturan</h1>
      <p className="mt-1 text-sm text-muted">
        Akun masuk: <span className="font-mono font-semibold">admin</span>. Sandi
        awal sesuai yang kamu minta saat situs dibuat; ganti di sini kapan pun
        kamu mau.
      </p>
      <h2 className="mt-8 font-extrabold">Ganti sandi</h2>
      <FormSandi />
    </div>
  );
}
