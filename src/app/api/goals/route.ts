import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { goalsUntukBulan } from "@/lib/goals";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";

function validMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

export async function GET(req: Request) {
  if (!(await requireUser())) return unauthorized();
  const month = new URL(req.url).searchParams.get("month");
  if (!validMonth(month)) return badRequest("Bulan wajib format YYYY-MM.");
  const items = await goalsUntukBulan(month);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await requireUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  if (!validMonth(body.month)) return badRequest("Bulan wajib format YYYY-MM.");
  const text = cleanText(body.text, 300);
  if (!text) return badRequest("Isi goal wajib diisi.");
  const last = await prisma.plannerGoal.findFirst({
    where: { month: body.month },
    orderBy: { sort: "desc" },
  });
  const item = await prisma.plannerGoal.create({
    data: { month: body.month, text, sort: (last?.sort ?? -1) + 1 },
  });
  return NextResponse.json({ item }, { status: 201 });
}
