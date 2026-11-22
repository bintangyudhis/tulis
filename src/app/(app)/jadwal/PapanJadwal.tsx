"use client";

import { useState } from "react";
import type { PlannerSchedule } from "@prisma/client";
import { DAY_NAMES, PERIODS } from "@/lib/dates";
import BarisItem from "../BarisItem";

type Kind = "general" | "todo" | "time";

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

function KartuHari({
  day,
  today,
  children,
}: {
  day: number;
  today: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border bg-panel p-4 ${today ? "border-accent ring-1 ring-accent" : "border-line"}`}
    >
      <h3 className="flex items-center gap-2 font-bold">
        {DAY_NAMES[day - 1]}
        {today && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
            Hari ini
          </span>
        )}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export default function PapanJadwal({
  initial,
  todayIndex,
}: {
  initial: PlannerSchedule[];
  todayIndex: number;
}) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const data = await kirim("/api/schedule", "GET");
    setItems(data.items);
  }

  async function jalankan(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  }

  const byKind = (kind: Kind, day: number) =>
    items.filter((i) => i.kind === kind && i.day === day);

  const urutGeneral = (list: PlannerSchedule[]) =>
    [...list].sort(
      (a, b) =>
        PERIODS.indexOf((a.period ?? "pagi") as (typeof PERIODS)[number]) -
          PERIODS.indexOf((b.period ?? "pagi") as (typeof PERIODS)[number]) ||
        a.sort - b.sort,
    );
  const urutJam = (list: PlannerSchedule[]) =>
    [...list].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

  return (
    <div className="space-y-10">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Bagian
        judul="Jadwal Umum"
        keterangan="Kegiatan per bagian hari: pagi, siang, sore, malam."
      >
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <KartuHari key={day} day={day} today={day === todayIndex}>
            <ul className="divide-y divide-line/60">
              {urutGeneral(byKind("general", day)).map((i) => (
                <BarisItem
                  key={i.id}
                  text={i.text}
                  prefix={
                    <span className="mt-0.5 w-12 shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-center text-[11px] font-bold text-accent capitalize">
                      {i.period}
                    </span>
                  }
                  onSave={(text) =>
                    jalankan(() => kirim(`/api/schedule/${i.id}`, "PATCH", { text }))
                  }
                  onDelete={() =>
                    jalankan(() => kirim(`/api/schedule/${i.id}`, "DELETE"))
                  }
                />
              ))}
              {byKind("general", day).length === 0 && (
                <li className="py-1.5 text-sm text-muted">Belum ada jadwal.</li>
              )}
            </ul>
            <FormTambah
              fields={["period", "text"]}
              onSubmit={(v) =>
                jalankan(() =>
                  kirim("/api/schedule", "POST", {
                    day,
                    kind: "general",
                    period: v.period,
                    text: v.text,
                  }),
                )
              }
            />
          </KartuHari>
        ))}
      </Bagian>

      <Bagian
        judul="To Do List"
        keterangan="Daftar tugas per hari, centang kalau sudah selesai."
      >
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <KartuHari key={day} day={day} today={day === todayIndex}>
            <ul className="divide-y divide-line/60">
              {byKind("todo", day).map((i) => (
                <BarisItem
                  key={i.id}
                  text={i.text}
                  done={i.done}
                  onToggle={(done) =>
                    jalankan(() => kirim(`/api/schedule/${i.id}`, "PATCH", { done }))
                  }
                  onSave={(text) =>
                    jalankan(() => kirim(`/api/schedule/${i.id}`, "PATCH", { text }))
                  }
                  onDelete={() =>
                    jalankan(() => kirim(`/api/schedule/${i.id}`, "DELETE"))
                  }
                />
              ))}
              {byKind("todo", day).length === 0 && (
                <li className="py-1.5 text-sm text-muted">Belum ada tugas.</li>
              )}
            </ul>
            <FormTambah
              fields={["text"]}
              onSubmit={(v) =>
                jalankan(() =>
                  kirim("/api/schedule", "POST", { day, kind: "todo", text: v.text }),
                )
              }
            />
          </KartuHari>
        ))}
      </Bagian>

      <Bagian
        judul="Jadwal Per Jam"
        keterangan="Kegiatan dengan jam pasti, urut dari paling pagi."
      >
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <KartuHari key={day} day={day} today={day === todayIndex}>
            <ul className="divide-y divide-line/60">
              {urutJam(byKind("time", day)).map((i) => (
                <BarisItem
                  key={i.id}
                  text={i.text}
                  prefix={
                    <span className="mt-0.5 w-12 shrink-0 font-mono text-sm font-semibold text-accent">
                      {(i.time ?? "").replace(":", ".")}
                    </span>
                  }
                  onSave={(text) =>
                    jalankan(() => kirim(`/api/schedule/${i.id}`, "PATCH", { text }))
                  }
                  onDelete={() =>
                    jalankan(() => kirim(`/api/schedule/${i.id}`, "DELETE"))
                  }
                />
              ))}
              {byKind("time", day).length === 0 && (
                <li className="py-1.5 text-sm text-muted">Belum ada jadwal jam.</li>
              )}
            </ul>
            <FormTambah
              fields={["time", "text"]}
              onSubmit={(v) =>
                jalankan(() =>
                  kirim("/api/schedule", "POST", {
                    day,
                    kind: "time",
                    time: v.time,
                    text: v.text,
                  }),
                )
              }
            />
          </KartuHari>
        ))}
      </Bagian>
    </div>
  );
}

function Bagian({
  judul,
  keterangan,
  children,
}: {
  judul: string;
  keterangan: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-extrabold">{judul}</h2>
      <p className="mt-0.5 text-sm text-muted">{keterangan}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function FormTambah({
  fields,
  onSubmit,
}: {
  fields: ("period" | "time" | "text")[];
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    period: "pagi",
    time: "07:00",
    text: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.text.trim()) return;
    setBusy(true);
    await onSubmit(values);
    setValues((v) => ({ ...v, text: "" }));
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2 border-t border-line pt-3">
      {fields.includes("period") && (
        <select
          value={values.period}
          onChange={(e) => setValues((v) => ({ ...v, period: e.target.value }))}
          className="rounded-md border border-line bg-panel px-2 py-1.5 text-sm capitalize"
          aria-label="Waktu"
        >
          {PERIODS.map((p) => (
            <option key={p} value={p} className="capitalize">
              {p}
            </option>
          ))}
        </select>
      )}
      {fields.includes("time") && (
        <input
          type="time"
          value={values.time}
          onChange={(e) => setValues((v) => ({ ...v, time: e.target.value }))}
          className="rounded-md border border-line bg-panel px-2 py-1.5 font-mono text-sm"
          aria-label="Jam"
        />
      )}
      <input
        value={values.text}
        onChange={(e) => setValues((v) => ({ ...v, text: e.target.value }))}
        placeholder="Tambah..."
        className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
      >
        +
      </button>
    </form>
  );
}
