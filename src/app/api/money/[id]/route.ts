import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, unauthorized } from "@/lib/api";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  const tx = await prisma.plannerMoneyTx.findUnique({ where: { id } });
  if (tx?.recurringId && tx.period) {
    // Entri hasil aturan tetap: beri penanda supaya tidak dibuat ulang.
    await prisma.plannerMoneySkip.upsert({
      where: {
        recurringId_period: { recurringId: tx.recurringId, period: tx.period },
      },
      create: { recurringId: tx.recurringId, period: tx.period },
      update: {},
    });
  }
  await prisma.plannerMoneyTx.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
