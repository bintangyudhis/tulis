import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { jakartaNow, monthLabel, PERIODS } from "@/lib/dates";
import { WARNA } from "@/lib/warna";
import { labelDeadline, sisaWaktu } from "@/lib/tugas";
import TodoHariIni from "./TodoHariIni";

function chipDeadline(deadline: Date): string {
  const sisa = deadline.getTime() - Date.now();
  if (sisa < 0 || sisa <= 6 * 3600 * 1000)
    return "bg-red-100 font-bold text-red-800";
  if (sisa <= 24 * 3600 * 1000) return "bg-yellow-100 font-bold text-yellow-800";
  return "bg-accent-soft text-ink";
}

export default async function BerandaPage() {
  await connection();
  const now = jakartaNow();
  const [jadwal, gymDay, gymItems, mark, goals, tugasAktif] = await Promise.all([
    prisma.plannerSchedule.findMany({
      where: { day: now.dayIndex },
      orderBy: [{ kind: "asc" }, { sort: "asc" }],
    }),
    prisma.plannerGymDay.findUnique({ where: { day: now.dayIndex } }),
    prisma.plannerGymItem.findMany({
      where: { day: now.dayIndex },
      orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    }),
    prisma.plannerMark.findUnique({ where: { date: now.dateStr } }),
    prisma.plannerGoal.findMany({ where: { month: now.monthStr } }),
    prisma.plannerTask.findMany({
      where: { done: false },
      orderBy: { deadline: "asc" },
    }),
  ]);
  const tugasTerdekat = tugasAktif.slice(0, 5);

  const umum = jadwal
    .filter((i) => i.kind === "general")
    .sort(
      (a, b) =>
        PERIODS.indexOf((a.period ?? "pagi") as (typeof PERIODS)[number]) -
        PERIODS.indexOf((b.period ?? "pagi") as (typeof PERIODS)[number]),
    );
  const perJam = jadwal
    .filter((i) => i.kind === "time")
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const todo = jadwal.filter((i) => i.kind === "todo");
  const goalSelesai = goals.filter((g) => g.done).length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold">{now.label}</h1>
      <p className="mt-1 text-sm text-muted">
        Ringkasan harimu. Semua bagian di bawah terhubung ke menu lengkapnya.
      </p>

      {mark && (
        <div
          className={`mt-5 rounded-xl border border-line px-4 py-3 ${WARNA[mark.color]?.cell ?? ""}`}
        >
          <p className="text-sm font-bold">Hari ini ditandai: {WARNA[mark.color]?.label}</p>
          <p className="text-sm">{mark.note}</p>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-extrabold">Jadwal Harian</h2>
            <Link href="/jadwal" className="text-xs font-bold text-accent">
              Buka jadwal →
            </Link>
          </div>
          {umum.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Belum ada jadwal umum hari ini.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {umum.map((i) => (
                <li key={i.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 w-12 shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-center text-[11px] font-bold text-accent capitalize">
                    {i.period}
                  </span>
                  <span>{i.text}</span>
                </li>
              ))}
            </ul>
          )}
          {perJam.length > 0 && (
            <>
              <h3 className="mt-4 font-bold">Per Jam</h3>
              <ul className="mt-1.5 space-y-1.5">
                {perJam.map((i) => (
                  <li key={i.id} className="flex items-start gap-2 text-sm">
                    <span className="w-12 shrink-0 font-mono font-semibold text-accent">
                      {(i.time ?? "").replace(":", ".")}
                    </span>
                    <span>{i.text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-extrabold">To Do Hari Ini</h2>
            <Link href="/jadwal" className="text-xs font-bold text-accent">
              Buka jadwal →
            </Link>
          </div>
          <div className="mt-2">
            <TodoHariIni initial={todo} />
          </div>
        </section>

        <section className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-extrabold">Gym Hari Ini</h2>
            <Link href="/gym" className="text-xs font-bold text-accent">
              Buka gym →
            </Link>
          </div>
          {gymDay?.isRest ? (
            <p className="mt-2 rounded-lg bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">
              Hari istirahat{gymDay.note ? ` — ${gymDay.note}` : ""}
            </p>
          ) : gymItems.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Belum ada gerakan untuk hari ini{gymDay?.note ? ` — ${gymDay.note}` : ""}.
            </p>
          ) : (
            <>
              {gymDay?.note && (
                <p className="mt-2 text-sm font-semibold">Fokus: {gymDay.note}</p>
              )}
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                {gymItems.map((i) => (
                  <li key={i.id}>
                    {i.text}
                    {i.detail ? <span className="text-muted"> — {i.detail}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-extrabold">Goals {monthLabel(now.monthStr)}</h2>
            <Link href="/goals" className="text-xs font-bold text-accent">
              Buka goals →
            </Link>
          </div>
          {goals.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Belum ada goal bulan ini.</p>
          ) : (
            <>
              <p className="mt-2 font-mono text-sm text-muted">
                {goalSelesai}/{goals.length} selesai
              </p>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${(goalSelesai / goals.length) * 100}%` }}
                />
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {goals.slice(0, 5).map((g) => (
                  <li key={g.id} className={g.done ? "text-muted line-through" : ""}>
                    {g.text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-extrabold">Deadline Tugas Terdekat</h2>
            <Link href="/tugas" className="text-xs font-bold text-accent">
              Buka tugas →
            </Link>
          </div>
          {tugasTerdekat.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Tidak ada tugas aktif. Santai, semua beres.
            </p>
          ) : (
            <>
              <ul className="mt-2 space-y-2">
                {tugasTerdekat.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{t.title}</div>
                      <div className="text-xs text-muted">{labelDeadline(t.deadline)}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${chipDeadline(t.deadline)}`}
                    >
                      {sisaWaktu(t.deadline)}
                    </span>
                  </li>
                ))}
              </ul>
              {tugasAktif.length > tugasTerdekat.length && (
                <p className="mt-2 text-xs text-muted">
                  dan {tugasAktif.length - tugasTerdekat.length} tugas aktif lainnya
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
