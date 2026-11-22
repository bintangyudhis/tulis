"use client";

import { useMemo, useState } from "react";
import { keInputLocal, labelDeadline, sisaWaktu } from "@/lib/tugas";

export type TugasItem = {
  id: string;
  title: string;
  note: string;
  deadline: string; // ISO
  done: boolean;
};

function chipClass(deadline: Date, done: boolean): string {
  if (done) return "bg-accent-soft text-muted";
  const sisa = deadline.getTime() - Date.now();
  if (sisa < 0) return "bg-red-100 font-bold text-red-800";
  if (sisa <= 6 * 3600 * 1000) return "bg-red-100 font-bold text-red-800";
  if (sisa <= 24 * 3600 * 1000) return "bg-yellow-100 font-bold text-yellow-800";
  return "bg-accent-soft text-ink";
}

export default function PapanTugas({ initialTasks }: { initialTasks: TugasItem[] }) {
  const [tasks, setTasks] = useState<TugasItem[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const aktif = useMemo(
    () =>
      tasks
        .filter((t) => !t.done)
        .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [tasks],
  );
  const selesai = useMemo(() => tasks.filter((t) => t.done), [tasks]);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !deadline) {
      setError("Judul dan tenggat wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), note: note.trim(), deadline }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah tugas.");
      setTasks((prev) => [...prev, { ...data.task, deadline: data.task.deadline }]);
      setTitle("");
      setNote("");
      setDeadline("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah tugas.");
    } finally {
      setBusy(false);
    }
  }

  async function ubah(task: TugasItem, patch: Partial<TugasItem>) {
    const kirim: Record<string, unknown> = { ...patch };
    if (patch.deadline) kirim.deadline = keInputLocal(new Date(patch.deadline));
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kirim),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...data.task } : t)),
      );
    }
  }

  async function hapus(task: TugasItem) {
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  const baris = (t: TugasItem) => {
    const dl = new Date(t.deadline);
    return (
      <li
        key={t.id}
        className="flex flex-wrap items-start gap-3 px-4 py-3"
      >
        <input
          type="checkbox"
          checked={t.done}
          onChange={(e) => ubah(t, { done: e.target.checked })}
          className="mt-1 h-5 w-5 accent-[#17603f]"
          aria-label="Tandai selesai"
        />
        <div className="min-w-0 flex-1">
          <div className={`font-bold ${t.done ? "text-muted line-through" : ""}`}>
            {t.title}
          </div>
          <div className="mt-0.5 text-sm text-muted">{labelDeadline(dl)}</div>
          {t.note && <div className="mt-0.5 text-sm">{t.note}</div>}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${chipClass(dl, t.done)}`}
        >
          {t.done ? "selesai" : sisaWaktu(dl)}
        </span>
        <button
          onClick={() => hapus(t)}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-danger hover:bg-red-50"
        >
          Hapus
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={tambah}
        className="rounded-xl border border-line bg-white p-4"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul tugas atau kerjaan"
            className="rounded-lg border border-line px-3 py-2.5"
            maxLength={200}
          />
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-lg border border-line px-3 py-2.5"
            aria-label="Tenggat waktu"
          />
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan (opsional)"
          className="mt-3 w-full rounded-lg border border-line px-3 py-2.5"
          maxLength={2000}
        />
        {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-3 rounded-lg bg-accent px-5 py-2.5 font-bold text-white disabled:opacity-60"
        >
          Tambah tugas
        </button>
      </form>

      <section className="rounded-xl border border-line bg-white">
        <h2 className="border-b border-line px-4 py-3 font-extrabold">
          Belum selesai ({aktif.length})
        </h2>
        {aktif.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">
            Tidak ada tugas yang menunggu. Santai.
          </p>
        ) : (
          <ul className="divide-y divide-line">{aktif.map(baris)}</ul>
        )}
      </section>

      {selesai.length > 0 && (
        <section className="rounded-xl border border-line bg-white">
          <h2 className="border-b border-line px-4 py-3 font-extrabold text-muted">
            Selesai ({selesai.length})
          </h2>
          <ul className="divide-y divide-line">{selesai.map(baris)}</ul>
        </section>
      )}
    </div>
  );
}
