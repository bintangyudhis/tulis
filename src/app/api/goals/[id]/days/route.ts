import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, unauthorized } from "@/lib/api";

// Semua butir roadmap milik satu goal, urut tanggal lalu posisi.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  const items = await prisma.plannerGoalDayItem.findMany({
    where: { goalId: id },
    orderBy: [{ date: "asc" }, { sort: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ items });
}
