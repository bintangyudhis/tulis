// Label dan hitung mundur tenggat tugas. Semua tampilan mengikuti WIB.

export function labelDeadline(d: Date): string {
  const tgl = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${tgl}, pukul ${jam.replace(":", ".")} WIB`;
}

// "2 hari 3 jam lagi", "5 jam 12 menit lagi", "lewat 1 jam 5 menit".
export function sisaWaktu(deadline: Date, now: Date = new Date()): string {
  const ms = deadline.getTime() - now.getTime();
  const lewat = ms < 0;
  const abs = Math.abs(ms);
  const menit = Math.floor(abs / 60000);
  const hari = Math.floor(menit / 1440);
  const jam = Math.floor((menit % 1440) / 60);
  const mnt = menit % 60;
  let inti: string;
  if (hari > 0) inti = `${hari} hari${jam > 0 ? ` ${jam} jam` : ""}`;
  else if (jam > 0) inti = `${jam} jam${mnt > 0 ? ` ${mnt} menit` : ""}`;
  else inti = `${mnt} menit`;
  return lewat ? `lewat ${inti}` : `${inti} lagi`;
}

// Nilai untuk input datetime-local pada zona Jakarta (YYYY-MM-DDTHH:mm).
export function keInputLocal(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

// Tafsirkan nilai datetime-local sebagai waktu Jakarta.
export function dariInputLocal(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
