"use client";

import { useState } from "react";
import type { PlannerMark } from "@prisma/client";
import { calendarCells, dateLabel, DAY_NAMES, monthLabel, shiftMonth } from "@/lib/dates";
import { WARNA } from "@/lib/warna";

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

export default function PapanKalender({
  initialMonth,
  initialMarks,
  todayStr,
}: {
  initialMonth: string;
  initialMarks: PlannerMark[];
  todayStr: string;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [marks, setMarks] = useState(initialMarks);
  const [selected, setSelected] = useState<string | null>(todayStr.startsWith(initialMonth) ? todayStr : null);
  const [error, setError] = useState<string | null>(null);

  const markMap = new Map(marks.map((m) => [m.date, m]));
  const selMark = selected ? markMap.get(selected) : undefined;

  async function muat(bulan: string) {
    const data = await kirim(`/api/marks?month=${bulan}`, "GET");
    setMarks(data.marks);
  }

  async function gantiBulan(delta: number) {
    const baru = shiftMonth(month, delta);
    setMonth(baru);
    setSelected(null);
    setError(null);
    try {
      await muat(baru);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat.");
    }
  }

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
        <div className="ml-auto flex flex-wrap gap-2 text-xs font-semibold text-muted">
          {Object.entries(WARNA).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-full ${v.chip}`} /> {v.label}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-line bg-panel p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-muted">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-1">
                {d.slice(0, 3)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells(month).map((date, idx) => {
              if (!date) return <div key={idx} />;
              const mark = markMap.get(date);
              const isToday = date === todayStr;
              const isSel = date === selected;
              return (
                <button
                  key={date}
                  onClick={() => setSelected(date)}
                  className={`min-h-16 rounded-lg border p-1.5 text-left align-top transition ${
                    mark ? WARNA[mark.color]?.cell ?? "" : ""
                  } ${isSel ? "border-accent ring-1 ring-accent" : "border-line/70"} ${isToday ? "font-extrabold" : ""}`}
                >
                  <span className="flex items-center gap-1 text-sm">
                    {parseInt(date.slice(8), 10)}
                    {isToday && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </span>
                  {mark && (
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-tight font-medium">
                      {mark.note}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-xl border border-line bg-panel p-4">
          {selected ? (
            <EditorTanda
              key={selected}
              date={selected}
              existing={selMark}
              onDone={async () => {
                setError(null);
                try {
                  await muat(month);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Gagal memuat.");
                }
              }}
            />
          ) : (
            <p className="text-sm text-muted">
              Klik satu tanggal untuk memberi tanda warna, catatan, dan pengingat.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function EditorTanda({
  date,
  existing,
  onDone,
}: {
  date: string;
  existing?: PlannerMark;
  onDone: () => Promise<void>;
}) {
  const [color, setColor] = useState(existing?.color ?? "biru");
  const [note, setNote] = useState(existing?.note ?? "");
  const [reminder, setReminder] = useState(existing?.reminder ?? "none");
  const [remindWhen, setRemindWhen] = useState(existing?.remindWhen ?? "pagi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simpan() {
    setBusy(true);
    setError(null);
    try {
      await kirim("/api/marks", "PUT", {
        date,
        color,
        note,
        reminder: color === "merah" ? reminder : "none",
        remindWhen,
      });
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
    setBusy(false);
  }

  async function hapus() {
    if (!window.confirm("Hapus tanda pada tanggal ini?")) return;
    setBusy(true);
    try {
      await kirim(`/api/marks?date=${date}`, "DELETE");
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
    setBusy(false);
  }

  return (
    <div>
      <h3 className="font-bold">{dateLabel(date)}</h3>
      <p className="mt-3 text-xs font-bold tracking-wide text-muted uppercase">Warna tanda</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {Object.entries(WARNA).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setColor(k)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${color === k ? "border-accent ring-1 ring-accent" : "border-line"}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${v.chip}`} /> {v.label}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-xs font-bold tracking-wide text-muted uppercase">
        Ada apa hari itu
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Mis. deadline laporan, libur kuliah, acara keluarga..."
          className="mt-1.5 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm font-normal normal-case"
        />
      </label>
      {color === "merah" ? (
        <>
          <label className="mt-3 block text-xs font-bold tracking-wide text-muted uppercase">
            Ingatkan saya
            <select
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm font-normal normal-case"
            >
              <option value="none">Tidak usah</option>
              <option value="email">Lewat email</option>
              <option value="whatsapp">Lewat WhatsApp</option>
            </select>
          </label>
          {reminder !== "none" && (
            <label className="mt-3 block text-xs font-bold tracking-wide text-muted uppercase">
              Kapan diingatkan
              <select
                value={remindWhen}
                onChange={(e) => setRemindWhen(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm font-normal normal-case"
              >
                <option value="sebelum">5 jam sebelum hari-H (pukul 19.00 malam sebelumnya)</option>
                <option value="pagi">Pagi hari-H</option>
              </select>
            </label>
          )}
        </>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Pengingat hanya tersedia untuk tanda Penting (merah).
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => void simpan()}
          disabled={busy}
          className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          Simpan tanda
        </button>
        {existing && (
          <button
            onClick={() => void hapus()}
            disabled={busy}
            className="rounded-lg border border-danger px-3 py-2 text-sm font-bold text-danger disabled:opacity-60"
          >
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}
