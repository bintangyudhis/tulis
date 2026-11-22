import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";

export async function POST(req: Request) {
  if (!(await requireUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  if (body.kind !== "in" && body.kind !== "out")
    return badRequest("Jenis harus masuk atau keluar.");
  const name = cleanText(body.name, 60);
  if (!name) return badRequest("Nama shortcut wajib diisi.");
  let amount: number | null = null;
  if (body.amount !== undefined && body.amount !== null && body.amount !== "") {
    if (
      !Number.isInteger(body.amount) ||
      (body.amount as number) < 1 ||
      (body.amount as number) > 999_999_999_999
    )
      return badRequest("Jumlah shortcut tidak valid.");
    amount = body.amount as number;
  }
  const last = await prisma.plannerMoneyShortcut.findFirst({
    where: { kind: body.kind },
    orderBy: { sort: "desc" },
  });
  const shortcut = await prisma.plannerMoneyShortcut.create({
    data: { kind: body.kind, name, amount, sort: (last?.sort ?? -1) + 1 },
  });
  return NextResponse.json({ shortcut }, { status: 201 });
}
