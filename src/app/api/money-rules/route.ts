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
  const name = cleanText(body.name, 120);
  if (!name) return badRequest("Nama wajib diisi.");
  if (
    !Number.isInteger(body.amount) ||
    (body.amount as number) < 1 ||
    (body.amount as number) > 999_999_999_999
  )
    return badRequest("Jumlah harus bilangan bulat positif.");
  if (
    !Number.isInteger(body.day) ||
    (body.day as number) < 1 ||
    (body.day as number) > 31
  )
    return badRequest("Tanggal bulanan harus 1 sampai 31.");
  const rule = await prisma.plannerMoneyRule.create({
    data: {
      kind: body.kind,
      name,
      amount: body.amount as number,
      day: body.day as number,
    },
  });
  return NextResponse.json({ rule }, { status: 201 });
}
