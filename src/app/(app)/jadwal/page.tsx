import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { jakartaNow } from "@/lib/dates";
import PapanJadwal from "./PapanJadwal";

export default async function JadwalPage() {
  await connection();
  const items = await prisma.plannerSchedule.findMany({
    orderBy: [{ day: "asc" }, { kind: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
  });
  const now = jakartaNow();
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Jadwal Harian</h1>
      <p className="mt-1 text-sm text-muted">
        Seluruh jadwal Senin sampai Minggu. Klik Ubah pada item untuk mengganti
        isinya, semua perubahan langsung tersimpan.
      </p>
      <div className="mt-6">
        <PapanJadwal initial={items} todayIndex={now.dayIndex} />
      </div>
    </div>
  );
}
