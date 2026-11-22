import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { DAY_NAMES, PERIODS } from "@/lib/dates";
import TombolPrint from "./TombolPrint";

// Halaman print: jadwal seminggu penuh dalam tabel landscape A4.
// Tiga tabel: umum (baris = bagian hari), per jam, to do + gym.
export default async function PrintPage() {
  await connection();
  const [jadwal, gymDays, gymItems] = await Promise.all([
    prisma.plannerSchedule.findMany({
      orderBy: [{ day: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
    }),
    prisma.plannerGymDay.findMany(),
    prisma.plannerGymItem.findMany({
      orderBy: [{ day: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const gymDayMap = new Map(gymDays.map((d) => [d.day, d]));

  const cellGeneral = (day: number, period: string) =>
    jadwal.filter((i) => i.kind === "general" && i.day === day && i.period === period);
  const cellJam = (day: number) =>
    jadwal
      .filter((i) => i.kind === "time" && i.day === day)
      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const cellTodo = (day: number) => jadwal.filter((i) => i.kind === "todo" && i.day === day);
  const cellGym = (day: number) => gymItems.filter((i) => i.day === day);

  const th = "border border-line bg-accent-soft px-2 py-1.5 text-left text-xs font-extrabold";
  const td = "border border-line px-2 py-1.5 align-top text-xs";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Print Jadwal</h1>
          <p className="mt-1 text-sm text-muted">
            Tampilan cetak landscape A4. Klik tombol print, pilih landscape bila
            belum otomatis, lalu tempel di kamar.
          </p>
        </div>
        <div className="ml-auto">
          <TombolPrint />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-white p-4 print:border-0 print:p-0">
        <h2 className="text-center text-lg font-extrabold tracking-tight">
          Jadwal Mingguan — Bintang Yudhistira
        </h2>

        <h3 className="mt-5 mb-2 font-extrabold">Jadwal Umum</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Waktu</th>
              {DAY_NAMES.map((d) => (
                <th key={d} className={th}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => (
              <tr key={p}>
                <td className={`${td} font-bold capitalize`}>{p}</td>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <td key={day} className={td}>
                    {cellGeneral(day, p).map((i) => (
                      <div key={i.id}>{i.text}</div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mt-5 mb-2 font-extrabold">Jadwal Per Jam dan To Do</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {DAY_NAMES.map((d) => (
                <th key={d} className={th}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <td key={day} className={td}>
                  {cellJam(day).map((i) => (
                    <div key={i.id}>
                      <span className="font-mono font-semibold">
                        {(i.time ?? "").replace(":", ".")}
                      </span>{" "}
                      {i.text}
                    </div>
                  ))}
                  {cellTodo(day).length > 0 && (
                    <div className="mt-1.5 border-t border-dashed border-line pt-1.5">
                      {cellTodo(day).map((i) => (
                        <div key={i.id}>☐ {i.text}</div>
                      ))}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <h3 className="mt-5 mb-2 font-extrabold">Jadwal Gym</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {DAY_NAMES.map((d) => (
                <th key={d} className={th}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const setting = gymDayMap.get(day);
                return (
                  <td key={day} className={td}>
                    {setting?.isRest ? (
                      <span className="font-bold">Istirahat</span>
                    ) : (
                      cellGym(day).map((i) => (
                        <div key={i.id}>
                          {i.text}
                          {i.detail ? <span className="text-muted"> ({i.detail})</span> : null}
                        </div>
                      ))
                    )}
                    {setting?.note && (
                      <div className="mt-1 text-[11px] text-muted italic">{setting.note}</div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        <p className="mt-4 text-center font-mono text-[11px] text-muted">
          tulis.bintangyudhis.my.id — diperbarui otomatis dari jadwal terbaru
        </p>
      </div>
    </div>
  );
}
