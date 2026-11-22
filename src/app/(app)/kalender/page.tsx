import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { jakartaNow } from "@/lib/dates";
import PapanKalender from "./PapanKalender";

export default async function KalenderPage() {
  await connection();
  const now = jakartaNow();
  const marks = await prisma.plannerMark.findMany({
    where: { date: { startsWith: now.monthStr } },
    orderBy: { date: "asc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Kalender</h1>
      <p className="mt-1 text-sm text-muted">
        Tandai tanggal dengan warna dan catatan. Pengingat hanya untuk
        tanda Penting (merah): pilih email atau WhatsApp, pagi hari-H atau
        5 jam sebelumnya.
      </p>
      <div className="mt-6">
        <PapanKalender
          initialMonth={now.monthStr}
          initialMarks={marks}
          todayStr={now.dateStr}
        />
      </div>
    </div>
  );
}
