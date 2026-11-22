// Semua tanggal di aplikasi ini mengikuti WIB (Asia/Jakarta), bukan
// zona waktu server (UTC di Vercel).

export const DAY_NAMES = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const PERIODS = ["pagi", "siang", "sore", "malam"] as const;

export type JakartaNow = {
  dateStr: string; // YYYY-MM-DD
  monthStr: string; // YYYY-MM
  dayIndex: number; // 1 Senin .. 7 Minggu
  dayName: string;
  label: string; // "Senin, 22 November 2026"
};

export function jakartaNow(from: Date = new Date()): JakartaNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(from);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const wd = get("weekday"); // Mon, Tue, ...
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  const dayIndex = map[wd] ?? 1;
  return {
    dateStr: `${year}-${month}-${day}`,
    monthStr: `${year}-${month}`,
    dayIndex,
    dayName: DAY_NAMES[dayIndex - 1],
    label: `${DAY_NAMES[dayIndex - 1]}, ${parseInt(day, 10)} ${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`,
  };
}

// Geser string bulan "YYYY-MM" sejauh delta bulan.
export function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map((x) => parseInt(x, 10));
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

export function monthLabel(monthStr: string): string {
  const [y, m] = monthStr.split("-").map((x) => parseInt(x, 10));
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

// Sel kalender untuk satu bulan: daftar tanggal (null = di luar bulan).
export function calendarCells(monthStr: string): (string | null)[] {
  const [y, m] = monthStr.split("-").map((x) => parseInt(x, 10));
  const first = new Date(Date.UTC(y, m - 1, 1));
  // getUTCDay: 0 Minggu .. 6 Sabtu. Ubah ke awalan Senin.
  const lead = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function dateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const idx = wd === 0 ? 7 : wd;
  return `${DAY_NAMES[idx - 1]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// Tanggal Senin..Minggu pada minggu berjalan (7 string YYYY-MM-DD).
export function weekDates(now: JakartaNow): string[] {
  const [y, m, d] = now.dateStr.split("-").map((x) => parseInt(x, 10));
  const monday = new Date(Date.UTC(y, m - 1, d - (now.dayIndex - 1)));
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const t = new Date(monday.getTime() + i * 86400000);
    out.push(
      `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`,
    );
  }
  return out;
}

// "24 Nov" dari "2026-11-24".
export function labelTanggalSingkat(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)}`;
}

// "24 – 30 November 2026" dari tanggal Senin dan Minggu.
export function labelRentangMinggu(senin: string, minggu: string): string {
  const [y1, m1, d1] = senin.split("-").map((x) => parseInt(x, 10));
  const [y2, m2, d2] = minggu.split("-").map((x) => parseInt(x, 10));
  if (m1 === m2) return `${d1} – ${d2} ${MONTH_NAMES[m1 - 1]} ${y1}`;
  return `${d1} ${MONTH_NAMES[m1 - 1]} – ${d2} ${MONTH_NAMES[m2 - 1]} ${y2}`;
}

// "Senin, 3 Nov" dari "2026-11-03", untuk label baris roadmap.
export function hariSingkat(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const idx = wd === 0 ? 7 : wd;
  return `${DAY_NAMES[idx - 1]}, ${d} ${MONTH_NAMES[m - 1].slice(0, 3)}`;
}

// Jumlah hari dalam bulan "YYYY-MM".
export function jumlahHari(monthStr: string): number {
  const [y, m] = monthStr.split("-").map((x) => parseInt(x, 10));
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
