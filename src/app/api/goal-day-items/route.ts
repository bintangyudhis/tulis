import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";
import { rentangRoadmap, tambahHari } from "@/lib/dates";

// Tambah satu butir rencana ke satu hari pada roadmap sebuah goal.
// Tanggal harus berada di dalam rentang roadmap goal itu.
export async function POST(req: Request) {
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
  const text = cleanText(body.text, 300);
  if (!text) return badRequest("Isi butir wajib diisi.");
  const goal = await prisma.plannerGoal.findUnique({ where: { id: body.goalId } });
  if (!goal) return badRequest("Goal tidak ditemukan.");
  const { start, days } = rentangRoadmap(goal);
  const end = tambahHari(start, days - 1);
  if (body.date < start || body.date > end)
    return badRequest("Tanggal di luar rentang roadmap goal.");
  const last = await prisma.plannerGoalDayItem.findFirst({
    where: { goalId: body.goalId, date: body.date },
    orderBy: { sort: "desc" },
  });
  const item = await prisma.plannerGoalDayItem.create({
    data: {
      goalId: body.goalId,
      date: body.date,
      text,
      sort: (last?.sort ?? -1) + 1,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
