import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, requireUser, unauthorized } from "@/lib/api";

// Buat atau perbarui rencana roadmap untuk satu hari pada satu goal.
// Teks kosong dan tidak selesai berarti baris dihapus.
export async function PUT(req: Request) {
  if (!(await requireUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  if (typeof body.goalId !== "string" || !body.goalId)
    return badRequest("Goal wajib diisi.");
  if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date))
    return badRequest("Tanggal wajib format YYYY-MM-DD.");
  const goal = await prisma.plannerGoal.findUnique({ where: { id: body.goalId } });
  if (!goal) return badRequest("Goal tidak ditemukan.");
  if (!body.date.startsWith(goal.month))
    return badRequest("Tanggal harus berada di bulan goal.");
  const text =
    typeof body.text === "string" && body.text.length <= 500 ? body.text.trim() : "";
  const done = body.done === true;
  if (!text && !done) {
    await prisma.plannerGoalDay.deleteMany({
      where: { goalId: body.goalId, date: body.date },
    });
    return NextResponse.json({ deleted: true });
  }
  const day = await prisma.plannerGoalDay.upsert({
    where: { goalId_date: { goalId: body.goalId, date: body.date } },
    create: { goalId: body.goalId, date: body.date, text, done },
    update: { text, done },
  });
  return NextResponse.json({ day });
}
