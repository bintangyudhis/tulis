import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";
import { jakartaNow } from "@/lib/dates";
import { transaksiBulan } from "@/lib/keuangan";

function validMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

export async function GET(req: Request) {
  if (!(await requireUser())) return unauthorized();
  const month = new URL(req.url).searchParams.get("month");
  if (!validMonth(month)) return badRequest("Bulan wajib format YYYY-MM.");
  const now = jakartaNow();
  const [items, rules, shortcuts] = await Promise.all([
    transaksiBulan(month, now.dateStr),
    prisma.plannerMoneyRule.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    }),
    prisma.plannerMoneyShortcut.findMany({
      orderBy: [{ kind: "asc" }, { sort: "asc" }, { name: "asc" }],
    }),
  ]);
  return NextResponse.json({ items, rules, shortcuts });
}

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
  if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date))
    return badRequest("Tanggal wajib format YYYY-MM-DD.");
  const item = await prisma.plannerMoneyTx.create({
    data: {
      kind: body.kind,
      name,
      amount: body.amount as number,
      date: body.date,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
