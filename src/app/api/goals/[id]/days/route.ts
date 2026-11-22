import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, unauthorized } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  const days = await prisma.plannerGoalDay.findMany({
    where: { goalId: id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ days });
}
