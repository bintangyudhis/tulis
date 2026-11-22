"use client";

import { useState } from "react";
import type { PlannerGymDay, PlannerGymItem } from "@prisma/client";
import { DAY_NAMES } from "@/lib/dates";
import BarisItem from "../BarisItem";

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

export default function PapanGym({
  initialDays,
  initialItems,
  todayIndex,
}: {
  initialDays: PlannerGymDay[];
  initialItems: PlannerGymItem[];
  todayIndex: number;
}) {
  const [days, setDays] = useState(initialDays);
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const data = await kirim("/api/gym", "GET");
    setDays(data.days);
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

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const setting = days.find((d) => d.day === day);
          const isRest = setting?.isRest ?? false;
          const dayItems = items.filter((i) => i.day === day);
          return (
            <section
              key={day}
              className={`rounded-xl border bg-panel p-4 ${day === todayIndex ? "border-accent ring-1 ring-accent" : "border-line"}`}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{DAY_NAMES[day - 1]}</h3>
                {day === todayIndex && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
                    Hari ini
                  </span>
                )}
                <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={isRest}
                    onChange={(e) =>
                      jalankan(() =>
                        kirim("/api/gym/day", "PATCH", { day, isRest: e.target.checked }),
                      )
                    }
                    className="h-4 w-4 accent-[#17603f]"
                  />
                  Hari istirahat
                </label>
              </div>

              <NamaSesi
                key={`${day}-${setting?.title ?? ""}`}
                title={setting?.title ?? ""}
                onSave={(title) =>
                  jalankan(() => kirim("/api/gym/day", "PATCH", { day, title }))
                }
              />

              {isRest ? (
                <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">
                  Rest day. Pemulihan juga bagian dari latihan.
                </p>
              ) : (
                <>
                  <ul className="mt-1 divide-y divide-line/60">
                    {dayItems.map((i) => (
                      <BarisItem
                        key={i.id}
                        text={i.detail ? `${i.text} — ${i.detail}` : i.text}
                        onSave={(text) =>
                          jalankan(() =>
                            kirim(`/api/gym/items/${i.id}`, "PATCH", { text }),
                          )
                        }
                        onDelete={() =>
                          jalankan(() => kirim(`/api/gym/items/${i.id}`, "DELETE"))
                        }
                      />
                    ))}
                    {dayItems.length === 0 && (
                      <li className="py-1.5 text-sm text-muted">Belum ada gerakan.</li>
                    )}
                  </ul>
                  <FormGerakan
                    onSubmit={(text, detail) =>
                      jalankan(() =>
                        kirim("/api/gym", "POST", { day, text, detail: detail || null }),
                      )
                    }
                  />
                </>
              )}

              <CatatanHari
                key={`${day}-${setting?.note ?? ""}`}
                note={setting?.note ?? ""}
                onSave={(note) =>
                  jalankan(() => kirim("/api/gym/day", "PATCH", { day, note }))
                }
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Nama sesi latihan hari itu, mis. Leg Day. Tersimpan saat kursor pindah.
function NamaSesi({
  title,
  onSave,
}: {
  title: string;
  onSave: (title: string | null) => Promise<void>;
}) {
  const [value, setValue] = useState(title);
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const v = value.trim();
        if (v !== title) void onSave(v || null);
      }}
      placeholder="Nama sesi, mis. Leg Day"
      maxLength={60}
      aria-label="Nama sesi latihan"
      className="mt-2 w-full rounded-md border border-dashed border-line bg-transparent px-2 py-1.5 text-sm font-extrabold placeholder:font-semibold"
    />
  );
}

function FormGerakan({
  onSubmit,
}: {
  onSubmit: (text: string, detail: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    await onSubmit(text.trim(), detail.trim());
    setText("");
    setDetail("");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2 border-t border-line pt-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Gerakan, mis. Push up"
        className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1.5 text-sm"
      />
      <input
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="3x12"
        className="w-16 rounded-md border border-line bg-panel px-2 py-1.5 text-sm"
        aria-label="Set dan repetisi"
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

function CatatanHari({
  note,
  onSave,
}: {
  note: string;
  onSave: (note: string | null) => Promise<void>;
}) {
  const [value, setValue] = useState(note);
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Catatan hari, mis. fokus dada + trisep"
        className="min-w-0 flex-1 rounded-md border border-dashed border-line bg-transparent px-2 py-1.5 text-xs"
      />
      <button
        onClick={async () => {
          setBusy(true);
          await onSave(value.trim() ? value.trim() : null);
          setBusy(false);
        }}
        disabled={busy}
        className="rounded-md px-2 py-1.5 text-xs font-bold text-accent disabled:opacity-60"
      >
        Simpan
      </button>
    </div>
  );
}
