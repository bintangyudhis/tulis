"use client";

import { useState } from "react";
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

export default function PapanCatatan({ initial }: { initial: PlannerNote[] }) {
  const [notes, setNotes] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const selected = notes.find((n) => n.id === selectedId) ?? null;
  const [title, setTitle] = useState(selected?.title ?? "");
  const [content, setContent] = useState(selected?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function reload(keepId?: string) {
    const data = await kirim("/api/notes", "GET");
    setNotes(data.notes);
    if (keepId) {
      const n = (data.notes as PlannerNote[]).find((x) => x.id === keepId);
      if (n) {
        setSelectedId(n.id);
        setTitle(n.title);
        setContent(n.content);
      }
    }
  }

  function pilih(n: PlannerNote) {
    setSelectedId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setSavedAt(null);
  }

  async function baru() {
    setBusy(true);
    setError(null);
    try {
      const data = await kirim("/api/notes", "POST", { title: "Catatan baru", content: "" });
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
      await kirim(`/api/notes/${selected.id}`, "PATCH", { title, content });
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
      const data = await kirim("/api/notes", "GET");
      setNotes(data.notes);
      const first = (data.notes as PlannerNote[])[0];
      if (first) pilih(first);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
    setBusy(false);
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
        <ul className="mt-3 space-y-1">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => pilih(n)}
                className={`w-full rounded-lg px-3 py-2 text-left ${n.id === selectedId ? "bg-accent-soft" : "hover:bg-paper"}`}
              >
                <span className="block truncate text-sm font-bold">{n.title}</span>
                <span className="block truncate text-xs text-muted">
                  {n.content.slice(0, 60) || "Kosong"}
                </span>
              </button>
            </li>
          ))}
          {notes.length === 0 && (
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
