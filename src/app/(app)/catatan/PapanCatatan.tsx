"use client";

import { useRef, useState } from "react";
import type { PlannerNote } from "@prisma/client";

async function kirim(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Gagal menyimpan.");
  }
  return res.json();
}

// Kecilkan foto sampai paling besar 200 KB: turunkan kualitas JPEG
// dulu, lalu ukuran dimensinya, sampai muat. Hasilnya data URL.
async function kompresFoto(file: File): Promise<string> {
  const MAKS = 200 * 1024;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Berkas bukan gambar yang valid."));
      el.src = url;
    });
    let skala = Math.min(
      1,
      1600 / Math.max(img.naturalWidth, img.naturalHeight),
    );
    for (let putaran = 0; putaran < 6; putaran++) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * skala));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * skala));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Browser tidak mendukung pemrosesan foto.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const q of [0.85, 0.7, 0.55, 0.4]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", q),
        );
        if (blob && blob.size <= MAKS) {
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () =>
              reject(new Error("Gagal membaca hasil kompres."));
            reader.readAsDataURL(blob);
          });
        }
      }
      skala *= 0.7;
    }
    throw new Error("Foto tidak bisa dikecilkan sampai 200 KB.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PapanCatatan({ initial }: { initial: PlannerNote[] }) {
  const [notes, setNotes] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const selected = notes.find((n) => n.id === selectedId) ?? null;
  const [title, setTitle] = useState(selected?.title ?? "");
  const [content, setContent] = useState(selected?.content ?? "");
  const [category, setCategory] = useState(selected?.category ?? "");
  const [image, setImage] = useState<string | null>(selected?.image ?? null);
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mengompres, setMengompres] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const kategoriList = Array.from(
    new Set(notes.map((n) => n.category).filter((k): k is string => !!k)),
  ).sort();
  const tampil =
    filter === null
      ? notes
      : notes.filter((n) => (n.category ?? "") === filter);

  function muatKeEditor(n: PlannerNote) {
    setSelectedId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setCategory(n.category ?? "");
    setImage(n.image ?? null);
    setSavedAt(null);
  }

  async function reload(keepId?: string) {
    const data = await kirim("/api/notes", "GET");
    setNotes(data.notes);
    if (keepId) {
      const n = (data.notes as PlannerNote[]).find((x) => x.id === keepId);
      if (n) muatKeEditor(n);
    }
  }

  async function baru() {
    setBusy(true);
    setError(null);
    try {
      const data = await kirim("/api/notes", "POST", { title: "Catatan baru", content: "" });
      setFilter(null);
      await reload(data.note.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat catatan.");
    }
    setBusy(false);
  }

  async function simpan() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await kirim(`/api/notes/${selected.id}`, "PATCH", {
        title,
        content,
        category: category.trim() || null,
        image,
      });
      await reload(selected.id);
      setSavedAt(new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
    setBusy(false);
  }

  async function hapus() {
    if (!selected) return;
    if (!window.confirm("Hapus catatan ini?")) return;
    setBusy(true);
    try {
      await kirim(`/api/notes/${selected.id}`, "DELETE");
      setSelectedId(null);
      setTitle("");
      setContent("");
      setCategory("");
      setImage(null);
      const data = await kirim("/api/notes", "GET");
      setNotes(data.notes);
      const first = (data.notes as PlannerNote[])[0];
      if (first) muatKeEditor(first);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
    setBusy(false);
  }

  async function pilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMengompres(true);
    setError(null);
    try {
      setImage(await kompresFoto(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses foto.");
    }
    setMengompres(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <section className="rounded-xl border border-line bg-panel p-3">
        <button
          onClick={() => void baru()}
          disabled={busy}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          + Catatan baru
        </button>
        {kategoriList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter(null)}
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                filter === null ? "bg-accent text-white" : "border border-line text-muted"
              }`}
            >
              Semua
            </button>
            {kategoriList.map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  filter === k ? "bg-accent text-white" : "border border-line text-muted"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        )}
        <ul className="mt-3 space-y-1">
          {tampil.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => muatKeEditor(n)}
                className={`w-full rounded-lg px-3 py-2 text-left ${n.id === selectedId ? "bg-accent-soft" : "hover:bg-paper"}`}
              >
                <span className="flex items-center gap-2">
                  {n.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.image}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded object-cover"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{n.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {n.content.slice(0, 60) || "Kosong"}
                    </span>
                  </span>
                </span>
                {n.category && (
                  <span className="mt-1 inline-block rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-accent">
                    {n.category}
                  </span>
                )}
              </button>
            </li>
          ))}
          {tampil.length === 0 && (
            <li className="px-2 py-3 text-sm text-muted">Belum ada catatan.</li>
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-panel p-4">
        {selected ? (
          <div key={selected.id}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul catatan"
              className="w-full border-b border-line pb-2 text-xl font-extrabold outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Kategori, mis. Kuliah"
                maxLength={40}
                list="daftar-kategori"
                className="w-52 rounded-md border border-line bg-panel px-3 py-2 text-sm"
              />
              <datalist id="daftar-kategori">
                {kategoriList.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => void pilihFoto(e)}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={mengompres}
                className="rounded-md border border-line px-3 py-2 text-sm font-bold disabled:opacity-60"
              >
                {mengompres
                  ? "Mengompres foto..."
                  : image
                    ? "Ganti foto"
                    : "Lampirkan foto"}
              </button>
              {image && (
                <button
                  onClick={() => setImage(null)}
                  className="rounded-md px-2 py-2 text-sm font-bold text-danger"
                >
                  Hapus foto
                </button>
              )}
              <span className="text-xs text-muted">
                Foto otomatis dikompres ke maksimal 200 KB.
              </span>
            </div>
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Lampiran foto catatan"
                className="mt-3 max-h-72 w-auto max-w-full rounded-lg border border-line object-contain"
              />
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis apa saja di sini: ide, inspirasi, hal yang harus diingat..."
              rows={16}
              className="mt-3 w-full resize-y rounded-lg border border-line bg-paper/50 px-3 py-2 text-sm leading-relaxed"
            />
            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => void simpan()}
                disabled={busy}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                Simpan
              </button>
              <button
                onClick={() => void hapus()}
                disabled={busy}
                className="rounded-lg border border-danger px-3 py-2 text-sm font-bold text-danger disabled:opacity-60"
              >
                Hapus
              </button>
              {savedAt && <span className="text-xs text-muted">Tersimpan {savedAt} WIB</span>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Pilih catatan di kiri atau buat catatan baru untuk mulai menulis.
          </p>
        )}
      </section>
    </div>
  );
}
