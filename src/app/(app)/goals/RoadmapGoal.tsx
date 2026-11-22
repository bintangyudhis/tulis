"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlannerGoal, PlannerGoalDayItem } from "@prisma/client";
import { labelTanggalRoadmap, rentangRoadmap, tambahHari } from "@/lib/dates";

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

function BarisButir({
  item,
  onToggle,
  onSave,
  onDelete,
}: {
  item: PlannerGoalDayItem;
  onToggle: (done: boolean) => Promise<void>;
  onSave: (text: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

  if (editing) {
    return (
      <li className="flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          maxLength={300}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (draft.trim()) void onSave(draft.trim()).then(() => setEditing(false));
            }
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={() => {
            if (draft.trim() && draft.trim() !== item.text)
              void onSave(draft.trim());
            setEditing(false);
          }}
          className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1 text-sm"
        />
      </li>
    );
  }
  return (
    <li className="group flex items-start gap-1.5">
      <input
        type="checkbox"
        checked={item.done}
        onChange={(e) => void onToggle(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#17603f]"
        aria-label="Tandai butir selesai"
      />
      <button
        onClick={() => {
          setDraft(item.text);
          setEditing(true);
        }}
        title="Klik untuk mengubah"
        className={`min-w-0 flex-1 text-left text-sm leading-snug ${
          item.done ? "text-muted line-through" : ""
        }`}
      >
        {item.text}
      </button>
      <button
        onClick={() => void onDelete()}
        title="Hapus butir"
        className="shrink-0 px-1 text-sm font-bold text-muted opacity-0 group-hover:opacity-100 hover:text-danger"
      >
        ×
      </button>
    </li>
  );
}

// Roadmap harian satu goal dalam bentuk kartu per hari. Rentangnya bebas:
// tanggal mulai dan jumlah hari ditentukan pemilik, boleh lintas bulan
// sampai satu tahun. Tiap kartu hari bisa berisi banyak butir rencana.
export default function RoadmapGoal({
  goal,
  todayStr,
  onGoalUpdated,
}: {
  goal: PlannerGoal;
  todayStr: string;
  onGoalUpdated: () => Promise<void>;
}) {
  const rentang = rentangRoadmap(goal);
  const [items, setItems] = useState<PlannerGoalDayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDraft, setStartDraft] = useState(rentang.start);
  const [daysDraft, setDaysDraft] = useState(String(rentang.days));
  const [addDrafts, setAddDrafts] = useState<Map<string, string>>(new Map());
  const [savingRange, setSavingRange] = useState(false);

  const tanggal = useMemo(
    () =>
      Array.from({ length: rentang.days }, (_, i) => tambahHari(rentang.start, i)),
    [rentang.start, rentang.days],
  );
  const perTanggal = useMemo(() => {
    const map = new Map<string, PlannerGoalDayItem[]>();
    for (const it of items) {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    }
    return map;
  }, [items]);

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const data = await kirim(`/api/goals/${goal.id}/days`, "GET");
        if (hidup) setItems(data.items);
      } catch (err) {
        if (hidup)
          setError(err instanceof Error ? err.message : "Gagal memuat roadmap.");
      } finally {
        if (hidup) setLoading(false);
      }
    })();
    return () => {
      hidup = false;
    };
  }, [goal.id]);

  async function jalan(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  }

  async function tambahButir(date: string) {
    const teks = (addDrafts.get(date) ?? "").trim();
    if (!teks) return;
    await jalan(async () => {
      const data = await kirim("/api/goal-day-items", "POST", {
        goalId: goal.id,
        date,
        text: teks,
      });
      setItems((prev) => [...prev, data.item]);
      setAddDrafts((prev) => new Map(prev).set(date, ""));
    });
  }

  async function ubahButir(id: string, body: { done?: boolean; text?: string }) {
    await jalan(async () => {
      const data = await kirim(`/api/goal-day-items/${id}`, "PATCH", body);
      setItems((prev) => prev.map((it) => (it.id === id ? data.item : it)));
    });
  }

  async function hapusButir(id: string) {
    await jalan(async () => {
      await kirim(`/api/goal-day-items/${id}`, "DELETE");
      setItems((prev) => prev.filter((it) => it.id !== id));
    });
  }

  async function terapkanRentang(start: string | null, days: number | null) {
    setSavingRange(true);
    await jalan(async () => {
      await kirim(`/api/goals/${goal.id}`, "PATCH", {
        roadmapStart: start,
        roadmapDays: days,
      });
      await onGoalUpdated();
    });
    setSavingRange(false);
  }

  async function simpanRentang() {
    const days = parseInt(daysDraft, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDraft)) {
      setError("Tanggal mulai wajib diisi.");
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > 366) {
      setError("Jumlah hari harus 1 sampai 366.");
      return;
    }
    await terapkanRentang(startDraft, days);
  }

  const totalButir = items.length;
  const butirSelesai = items.filter((i) => i.done).length;
  const hariTerisi = perTanggal.size;
  const tanggalAkhir = tambahHari(rentang.start, rentang.days - 1);

  return (
    <div className="py-2">
      <div className="rounded-lg border border-line bg-paper p-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-muted">
            Tanggal mulai
            <input
              type="date"
              value={startDraft}
              onChange={(e) => setStartDraft(e.target.value)}
              className="mt-1 block rounded-md border border-line bg-panel px-2 py-1.5 text-sm text-ink"
            />
          </label>
          <label className="text-xs font-semibold text-muted">
            Jumlah hari
            <input
              type="number"
              min={1}
              max={366}
              value={daysDraft}
              onChange={(e) => setDaysDraft(e.target.value)}
              className="mt-1 block w-24 rounded-md border border-line bg-panel px-2 py-1.5 text-sm text-ink"
            />
          </label>
          <div className="flex gap-1 pb-0.5">
            {[30, 60, 90, 180, 365].map((n) => (
              <button
                key={n}
                onClick={() => setDaysDraft(String(n))}
                className={`rounded-md px-2 py-1 text-xs font-bold ${
                  daysDraft === String(n)
                    ? "bg-accent text-white"
                    : "border border-line bg-panel text-muted"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={() => void simpanRentang()}
            disabled={savingRange}
            className="rounded-md bg-accent px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Terapkan
          </button>
          {(goal.roadmapStart !== null || goal.roadmapDays !== null) && (
            <button
              onClick={() => void terapkanRentang(null, null)}
              disabled={savingRange}
              className="rounded-md px-2 py-2 text-xs font-semibold text-muted hover:text-ink disabled:opacity-60"
            >
              Ikuti bulan goal
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          Rentang aktif: {labelTanggalRoadmap(rentang.start)} sampai{" "}
          {labelTanggalRoadmap(tanggalAkhir)} ({rentang.days} hari).
        </p>
      </div>

      <p className="mt-3 text-xs font-semibold text-muted">
        {butirSelesai} dari {totalButir} butir selesai · {hariTerisi} dari{" "}
        {rentang.days} hari terisi. Klik teks butir untuk mengubahnya.
      </p>
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-2 text-sm text-muted">Memuat roadmap...</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tanggal.map((tgl, i) => {
            const butir = perTanggal.get(tgl) ?? [];
            const isToday = tgl === todayStr;
            return (
              <section
                key={tgl}
                className={`flex flex-col rounded-xl border bg-white p-3 ${
                  isToday ? "border-accent ring-2 ring-accent/40" : "border-line"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2 border-b border-line pb-2">
                  <span className="text-sm font-extrabold">Day {i + 1}</span>
                  <span className="text-xs text-muted">
                    {labelTanggalRoadmap(tgl)}
                  </span>
                </div>
                <ul className="mt-2 flex-1 space-y-1.5">
                  {butir.map((it) => (
                    <BarisButir
                      key={it.id}
                      item={it}
                      onToggle={(done) => ubahButir(it.id, { done })}
                      onSave={(text) => ubahButir(it.id, { text })}
                      onDelete={() => hapusButir(it.id)}
                    />
                  ))}
                  {butir.length === 0 && (
                    <li className="text-xs text-muted">Belum ada rencana.</li>
                  )}
                </ul>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void tambahButir(tgl);
                  }}
                  className="mt-2 flex gap-1.5 border-t border-line pt-2"
                >
                  <input
                    value={addDrafts.get(tgl) ?? ""}
                    onChange={(e) =>
                      setAddDrafts((prev) => new Map(prev).set(tgl, e.target.value))
                    }
                    placeholder="Tambah rencana..."
                    maxLength={300}
                    className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1.5 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-bold text-white"
                  >
                    Tambah
                  </button>
                </form>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
