"use client";

import { Fragment, useState } from "react";
import type { PlannerGoal } from "@prisma/client";
import { monthLabel, shiftMonth } from "@/lib/dates";
import BarisItem from "../BarisItem";
import RoadmapGoal from "./RoadmapGoal";

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

export default function PapanGoals({
  initialMonth,
  initialItems,
  todayStr,
}: {
  initialMonth: string;
  initialItems: PlannerGoal[];
  todayStr: string;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [items, setItems] = useState(initialItems);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function muat(bulan: string) {
    const data = await kirim(`/api/goals?month=${bulan}`, "GET");
    setItems(data.items);
  }

  async function jalankan(fn: () => Promise<unknown>, bulan = month) {
    setError(null);
    try {
      await fn();
      await muat(bulan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  }

  async function gantiBulan(delta: number) {
    const baru = shiftMonth(month, delta);
    setMonth(baru);
    await jalankan(async () => {}, baru);
  }

  const selesai = items.filter((i) => i.done).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void gantiBulan(-1)}
          className="rounded-lg border border-line bg-panel px-3 py-2 text-sm font-bold"
        >
          ← Bulan lalu
        </button>
        <h2 className="text-lg font-extrabold">{monthLabel(month)}</h2>
        <button
          onClick={() => void gantiBulan(1)}
          className="rounded-lg border border-line bg-panel px-3 py-2 text-sm font-bold"
        >
          Bulan depan →
        </button>
        <span className="ml-auto font-mono text-sm text-muted">
          {selesai}/{items.length} selesai
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: items.length ? `${(selesai / items.length) * 100}%` : "0%" }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <section className="mt-5 rounded-xl border border-line bg-panel p-4">
        <ul className="divide-y divide-line/60">
          {items.map((i) => (
            <Fragment key={i.id}>
              <BarisItem
                text={i.text}
                done={i.done}
                onToggle={(done) =>
                  jalankan(() => kirim(`/api/goals/${i.id}`, "PATCH", { done }))
                }
                onSave={(t) => jalankan(() => kirim(`/api/goals/${i.id}`, "PATCH", { text: t }))}
                onDelete={() => jalankan(() => kirim(`/api/goals/${i.id}`, "DELETE"))}
              />
              <li className="pb-1">
                <button
                  onClick={() => setOpenId(openId === i.id ? null : i.id)}
                  className="text-xs font-bold text-accent hover:underline"
                >
                  {openId === i.id ? "Tutup roadmap harian" : "Roadmap harian (Day 1 - akhir bulan)"}
                </button>
                {openId === i.id && (
                  <RoadmapGoal goalId={i.id} month={month} todayStr={todayStr} />
                )}
              </li>
            </Fragment>
          ))}
          {items.length === 0 && (
            <li className="py-2 text-sm text-muted">
              Belum ada goal untuk bulan ini. Tulis target pertamamu di bawah.
            </li>
          )}
        </ul>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            setBusy(true);
            await jalankan(() =>
              kirim("/api/goals", "POST", { month, text: text.trim() }),
            );
            setText("");
            setBusy(false);
          }}
          className="mt-3 flex gap-2 border-t border-line pt-3"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tambah goal bulan ini..."
            className="min-w-0 flex-1 rounded-md border border-line bg-panel px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Tambah
          </button>
        </form>
      </section>
    </div>
  );
}
