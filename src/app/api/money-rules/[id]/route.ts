import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  const data: Record<string, unknown> = {};
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean")
      return badRequest("Nilai aktif tidak valid.");
    data.active = body.active;
  }
  if (body.name !== undefined) {
    const name = cleanText(body.name, 120);
    if (!name) return badRequest("Nama tidak boleh kosong.");
    data.name = name;
  }
  if (body.amount !== undefined) {
    if (
      !Number.isInteger(body.amount) ||
      (body.amount as number) < 1 ||
      (body.amount as number) > 999_999_999_999
    )
      return badRequest("Jumlah harus bilangan bulat positif.");
    data.amount = body.amount;
  }
  if (body.day !== undefined) {
    if (
      !Number.isInteger(body.day) ||
      (body.day as number) < 1 ||
      (body.day as number) > 31
    )
      return badRequest("Tanggal bulanan harus 1 sampai 31.");
    data.day = body.day;
  }
  const rule = await prisma.plannerMoneyRule.update({ where: { id }, data });
  return NextResponse.json({ rule });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  await prisma.plannerMoneySkip.deleteMany({ where: { recurringId: id } });
  await prisma.plannerMoneyRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
