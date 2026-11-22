import { NextResponse } from "next/server";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint publik untuk detektor pengingat (hook Muse). SENGAJA hanya
// menjawab jumlah pengingat tenggat yang sedang jatuh tempo, tanpa data
// apa pun tentang tugasnya. Detektor membangunkanku hanya bila > 0.
const AMBANG: { kunci: string; ms: number }[] = [
  { kunci: "6h", ms: 6 * 3600 * 1000 },
  { kunci: "24h", ms: 24 * 3600 * 1000 },
];

export async function GET() {
  await connection();
  const now = new Date();
  const batas = new Date(now.getTime() + 24 * 3600 * 1000);
  const tasks = await prisma.plannerTask.findMany({
    where: { done: false, deadline: { gt: now, lte: batas } },
    select: { id: true, deadline: true },
  });
  if (tasks.length === 0) return NextResponse.json({ due: 0 });
  const logs = await prisma.plannerReminderLog.findMany({
    where: { taskId: { in: tasks.map((t) => t.id) } },
    select: { taskId: true, threshold: true },
  });
  const terkirim = new Set(logs.map((l) => `${l.taskId}|${l.threshold}`));
  let due = 0;
  for (const t of tasks) {
    const sisa = t.deadline.getTime() - now.getTime();
    const aktif = AMBANG.find((a) => sisa <= a.ms);
    if (aktif && !terkirim.has(`${t.id}|${aktif.kunci}`)) due++;
  }
  return NextResponse.json({ due });
}
