"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlannerGoalDay } from "@prisma/client";
import { hariSingkat, jumlahHari } from "@/lib/dates";

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

// Roadmap harian satu goal: Day 1 sampai akhir bulan, tiap hari bisa
// diisi rencana (mis. materi belajar) dan dicentang bila sudah jalan.
export default function RoadmapGoal({
  goalId,
  month,
  todayStr,
}: {
  goalId: string;
  month: string;
  todayStr: string;
}) {
  const [entries, setEntries] = useState<Map<string, PlannerGoalDay>>(new Map());
  const [drafts, setDrafts] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalHari = jumlahHari(month);
  const tanggal = useMemo(
    () =>
      Array.from({ length: totalHari }, (_, i) =>
        `${month}-${String(i + 1).padStart(2, "0")}`,
      ),
    [month, totalHari],
  );

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const data = await kirim(`/api/goals/${goalId}/days`, "GET");
        if (!hidup) return;
        const map = new Map<string, PlannerGoalDay>();
        const dmap = new Map<string, string>();
        for (const d of data.days as PlannerGoalDay[]) {
          map.set(d.date, d);
          dmap.set(d.date, d.text);
        }
        setEntries(map);
        setDrafts(dmap);
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
  }, [goalId]);

  async function simpan(date: string, text: string, done: boolean) {
    setError(null);
    try {
      const data = await kirim("/api/goal-days", "PUT", {
        goalId,
        date,
        text,
        done,
      });
      setEntries((prev) => {
        const next = new Map(prev);
        if (data.deleted) next.delete(date);
        else next.set(date, data.day);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  }

  const terisi = entries.size;
  const selesai = [...entries.values()].filter((d) => d.done).length;

  if (loading) return <p className="py-2 text-sm text-muted">Memuat roadmap...</p>;

  return (
    <div className="py-2">
      <p className="text-xs font-semibold text-muted">
        Roadmap harian: {terisi} dari {totalHari} hari terisi, {selesai} selesai.
        Tulis rencana tiap hari, perubahan tersimpan saat kursor pindah.
      </p>
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <ul className="mt-2 divide-y divide-line/50">
        {tanggal.map((tgl, i) => {
          const entry = entries.get(tgl);
          const isToday = tgl === todayStr;
          return (
            <li
              key={tgl}
              className={`flex items-center gap-2 py-1.5 ${isToday ? "-mx-2 rounded-lg bg-accent-soft px-2" : ""}`}
            >
              <span className="w-14 shrink-0 font-mono text-xs font-bold">
                Day {i + 1}
              </span>
              <span className="hidden w-28 shrink-0 text-xs text-muted sm:block">
                {hariSingkat(tgl)}
              </span>
              <input
                type="checkbox"
                checked={entry?.done ?? false}
                disabled={!entry}
                onChange={(e) =>
                  void simpan(tgl, drafts.get(tgl) ?? "", e.target.checked)
                }
                className="h-4.5 w-4.5 shrink-0 accent-[#17603f] disabled:opacity-30"
                aria-label={`Tandai Day ${i + 1} selesai`}
              />
              <input
                value={drafts.get(tgl) ?? ""}
                onChange={(e) =>
                  setDrafts((prev) => new Map(prev).set(tgl, e.target.value))
                }
                onBlur={(e) => {
                  const teks = e.target.value.trim();
                  if (teks !== (entry?.text ?? ""))
                    void simpan(tgl, teks, entry?.done ?? false);
                }}
                placeholder="Rencana hari ini..."
                maxLength={500}
                className={`min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1.5 text-sm ${
                  entry?.done ? "text-muted line-through" : ""
                }`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
