import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import PapanTugas, { type TugasItem } from "./PapanTugas";

export default async function TugasPage() {
  await connection();
  const rows = await prisma.plannerTask.findMany({
    orderBy: [{ done: "asc" }, { deadline: "asc" }],
  });
  const tasks: TugasItem[] = rows.map((t) => ({
    id: t.id,
    title: t.title,
    note: t.note,
    deadline: t.deadline.toISOString(),
    done: t.done,
  }));
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Tugas dan Kerjaan</h1>
      <p className="mt-1 text-sm text-muted">
        Semua tugas dengan tenggatnya. Pengingat otomatis dikirim ke WhatsApp
        pada 3 hari, 1 hari, 6 jam, dan 1 jam sebelum tenggat.
      </p>
      <div className="mt-6">
        <PapanTugas initialTasks={tasks} />
      </div>
    </div>
  );
}
