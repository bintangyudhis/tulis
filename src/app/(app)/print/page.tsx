import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DAY_NAMES,
  PERIODS,
  calendarCells,
  dateLabel,
  jakartaNow,
  monthLabel,
} from "@/lib/dates";
import { WARNA } from "@/lib/warna";
import TombolPrint from "./TombolPrint";

// Halaman print: satu jenis jadwal per cetakan, dipilih lewat tab.
// Lembar harian, todo, dan gym adalah templat mingguan berulang: hanya
// nama hari yang tampil, TANPA tanggal, supaya satu cetakan bisa dipakai
// berminggu-minggu. Tanggal lengkap hanya tampil di lembar kalender.
// Desain mengikuti planner cetak minimal: kolom akhir pekan teduh,
// strip goals di bawah, legenda warna untuk kalender, dan garis kosong
// untuk coretan tangan pada todo.
const JENIS = [
  { key: "harian", label: "Jadwal Harian" },
  { key: "perjam", label: "Jadwal Per Jam" },
  { key: "todo", label: "To Do List" },
  { key: "kalender", label: "Kalender" },
  { key: "gym", label: "Gym" },
] as const;

type Jenis = (typeof JENIS)[number]["key"];

const DAYS = [1, 2, 3, 4, 5, 6, 7];

function Kepala({ judul, sub }: { judul: string; sub: string }) {
  return (
    <div className="border-b-4 border-double border-ink pb-3 text-center">
      <h2 className="text-[26px] font-extrabold tracking-tight">{judul}</h2>
      <p className="mt-0.5 font-mono text-xs text-muted">{sub}</p>
    </div>
  );
}

function Kaki() {
  return (
    <p className="mt-4 text-center font-mono text-[10px] text-muted">
      tulis.bintangyudhis.my.id — dicetak dari data terbaru
    </p>
  );
}

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const jenis: Jenis = JENIS.some((j) => j.key === sp.jenis)
    ? (sp.jenis as Jenis)
    : "harian";
  const now = jakartaNow();

  const [jadwal, gymDays, gymItems, goals, marks] = await Promise.all([
    prisma.plannerSchedule.findMany({
      orderBy: [{ day: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
    }),
    prisma.plannerGymDay.findMany(),
    prisma.plannerGymItem.findMany({
      orderBy: [{ day: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
    }),
    prisma.plannerGoal.findMany({
      where: { month: now.monthStr },
      orderBy: [{ done: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
    }),
    prisma.plannerMark.findMany({
      where: { date: { startsWith: now.monthStr } },
      orderBy: { date: "asc" },
    }),
  ]);
  const gymDayMap = new Map(gymDays.map((d) => [d.day, d]));
  const markMap = new Map(marks.map((m) => [m.date, m]));

  const cellGeneral = (day: number, period: string) =>
    jadwal.filter((i) => i.kind === "general" && i.day === day && i.period === period);
  const cellJam = (day: number) =>
    jadwal
      .filter((i) => i.kind === "time" && i.day === day)
      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const cellTodo = (day: number) =>
    jadwal.filter((i) => i.kind === "todo" && i.day === day);
  const cellGym = (day: number) => gymItems.filter((i) => i.day === day);

  const judulSheet =
    jenis === "harian"
      ? "Jadwal Harian"
      : jenis === "perjam"
        ? "Jadwal Per Jam"
        : jenis === "todo"
        ? "To Do List Mingguan"
        : jenis === "kalender"
          ? `Kalender ${monthLabel(now.monthStr)}`
          : "Jadwal Gym";
  const subSheet =
    jenis === "kalender"
      ? `${dateLabel(now.dateStr)} — tanda berwarna bulan ini`
      : "Berlaku setiap minggu";

  const kepalaKolom = (day: number) => (
    <div
      className={`exact border-b-2 border-ink px-2 py-1.5 text-center ${
        day >= 6 ? "bg-[#efead9]" : "bg-accent-soft"
      }`}
    >
      <div className="py-0.5 text-[13px] font-extrabold">{DAY_NAMES[day - 1]}</div>
    </div>
  );

  return (
    <div>
      <div className="no-print flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Print Jadwal</h1>
          <p className="mt-1 text-sm text-muted">
            Pilih satu jenis jadwal, lalu print. Satu cetakan hanya memuat
            jenis yang dipilih.
          </p>
        </div>
        <div className="ml-auto">
          <TombolPrint />
        </div>
      </div>

      <div className="no-print mt-4 flex flex-wrap gap-1">
        {JENIS.map((j) => (
          <Link
            key={j.key}
            href={`/print?jenis=${j.key}`}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              jenis === j.key
                ? "bg-accent text-white"
                : "border border-line bg-white text-muted hover:text-ink"
            }`}
          >
            {j.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto pb-2 print:overflow-visible print:pb-0">
      <div
        className={`mt-6 rounded-xl border border-line bg-white p-5 print:rounded-none print:border-0 print:p-0 ${
          jenis === "todo" ? "sheet-portrait min-w-[580px]" : "sheet-landscape min-w-[860px]"
        }`}
      >
        <Kepala judul={judulSheet} sub={subSheet} />

        {jenis === "harian" && (
          <>
            <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border-2 border-ink bg-line">
              {DAYS.map((day) => (
                <div key={day} className="flex flex-col bg-white">
                  {kepalaKolom(day)}
                  <div className="flex-1 px-2 py-2">
                    {PERIODS.map((p) => {
                      const items = cellGeneral(day, p);
                      if (items.length === 0) return null;
                      return (
                        <div key={p} className="mt-2">
                          <div className="text-[9px] font-extrabold tracking-[0.14em] text-accent uppercase">
                            {p}
                          </div>
                          <div className="space-y-0.5">
                            {items.map((i) => (
                              <div key={i.id} className="text-[11px] leading-snug">
                                {i.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {cellJam(day).length === 0 &&
                      PERIODS.every((p) => cellGeneral(day, p).length === 0) && (
                        <div className="space-y-3 pt-1">
                          {[0, 1, 2].map((n) => (
                            <div key={n} className="border-b border-dotted border-line" />
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
            {goals.length > 0 && (
              <div className="exact mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-accent-soft px-3 py-2">
                <span className="text-[10px] font-extrabold tracking-[0.14em] text-accent uppercase">
                  Goals bulan ini
                </span>
                {goals.slice(0, 5).map((g) => (
                  <span key={g.id} className="text-[11px] font-semibold">
                    {g.done ? "✓" : "•"} {g.text}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {jenis === "perjam" && (
          <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border-2 border-ink bg-line">
            {DAYS.map((day) => (
              <div key={day} className="flex flex-col bg-white">
                {kepalaKolom(day)}
                <div className="flex-1 px-2 py-2">
                  {cellJam(day).length > 0 ? (
                    <div className="space-y-1.5">
                      {cellJam(day).map((i) => (
                        <div key={i.id} className="text-[11px] leading-snug">
                          <span className="font-mono font-bold">
                            {(i.time ?? "").replace(":", ".")}
                          </span>{" "}
                          {i.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {[0, 1, 2].map((n) => (
                        <div key={n} className="border-b border-dotted border-line" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {jenis === "todo" && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {DAYS.map((day) => {
              const items = cellTodo(day);
              return (
                <div
                  key={day}
                  className="overflow-hidden rounded-lg border-2 border-ink"
                >
                  {kepalaKolom(day)}
                  <div className="px-3 py-2">
                    {items.length === 0 ? (
                      <div className="space-y-3 py-1">
                        {[0, 1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="border-b border-dotted border-line pb-2"
                          />
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {items.map((i) => (
                          <li key={i.id} className="flex items-start gap-2 text-xs">
                            <span
                              className={`exact mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-[4px] border-2 border-ink ${
                                i.done ? "bg-accent" : "bg-white"
                              }`}
                            />
                            <span className={i.done ? "text-muted line-through" : ""}>
                              {i.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {jenis === "kalender" && (
          <>
            <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border-2 border-ink bg-line">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="exact bg-accent-soft px-2 py-1 text-center text-[11px] font-extrabold"
                >
                  {d}
                </div>
              ))}
              {calendarCells(now.monthStr).map((tgl, idx) => {
                const mark = tgl ? markMap.get(tgl) : undefined;
                const warna = mark ? WARNA[mark.color] : undefined;
                return (
                  <div
                    key={idx}
                    className={`min-h-[74px] bg-white px-1.5 py-1 ${
                      tgl === now.dateStr ? "exact bg-accent-soft" : ""
                    }`}
                  >
                    {tgl && (
                      <>
                        <div
                          className={`text-[11px] font-extrabold ${
                            tgl === now.dateStr ? "text-accent" : ""
                          }`}
                        >
                          {parseInt(tgl.slice(8), 10)}
                        </div>
                        {mark && warna && (
                          <div
                            className={`exact mt-1 rounded px-1 py-0.5 text-[9px] leading-tight font-semibold ${warna.cell}`}
                          >
                            {warna.label}: {mark.note}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(WARNA).map(([k, w]) => (
                <span key={k} className="flex items-center gap-1.5 text-[10px] font-semibold">
                  <span className={`exact inline-block h-2.5 w-2.5 rounded-full ${w.chip}`} />
                  {w.label}
                </span>
              ))}
            </div>
          </>
        )}

        {jenis === "gym" && (
          <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border-2 border-ink bg-line">
            {DAYS.map((day) => {
              const setting = gymDayMap.get(day);
              return (
                <div key={day} className="flex flex-col bg-white">
                  {kepalaKolom(day)}
                  <div className="flex-1 px-2 py-2">
                    {setting?.title && (
                      <div className="mb-1 text-[12px] font-extrabold">{setting.title}</div>
                    )}
                    {setting?.isRest ? (
                      <span className="exact inline-block rounded bg-[#efead9] px-2 py-0.5 text-[11px] font-extrabold">
                        Istirahat
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {cellGym(day).map((i) => (
                          <div key={i.id} className="text-[11px] leading-snug">
                            {i.text}
                            {i.detail ? (
                              <span className="text-muted"> ({i.detail})</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                    {setting?.note && (
                      <div className="mt-1.5 text-[10px] text-muted italic">
                        {setting.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Kaki />
      </div>
      </div>
    </div>
  );
}
