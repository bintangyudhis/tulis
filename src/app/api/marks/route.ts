import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";

export const MARK_COLORS = ["hijau", "biru", "merah", "kuning", "ungu"] as const;
export const REMINDERS = ["none", "email", "whatsapp"] as const;

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(req: Request) {
  if (!(await requireUser())) return unauthorized();
  const month = new URL(req.url).searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return badRequest("Bulan wajib format YYYY-MM.");
  const marks = await prisma.plannerMark.findMany({
    where: { date: { startsWith: month } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ marks });
}

// Buat atau perbarui tanda pada satu tanggal.
export async function PUT(req: Request) {
  if (!(await requireUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  if (!validDate(body.date)) return badRequest("Tanggal wajib format YYYY-MM-DD.");
  if (!MARK_COLORS.includes(body.color as (typeof MARK_COLORS)[number]))
    return badRequest("Warna tidak valid.");
  const note = cleanText(body.note, 500);
  if (!note) return badRequest("Catatan hari wajib diisi.");
  const reminder = body.reminder === undefined ? "none" : body.reminder;
  if (!REMINDERS.includes(reminder as (typeof REMINDERS)[number]))
    return badRequest("Pilihan pengingat tidak valid.");
  const mark = await prisma.plannerMark.upsert({
    where: { date: body.date },
    create: {
      date: body.date,
      color: body.color as string,
      note,
      reminder: reminder as string,
    },
    update: { color: body.color as string, note, reminder: reminder as string },
  });
  return NextResponse.json({ mark });
}

export async function DELETE(req: Request) {
  if (!(await requireUser())) return unauthorized();
  const date = new URL(req.url).searchParams.get("date");
  if (!validDate(date)) return badRequest("Tanggal wajib format YYYY-MM-DD.");
  await prisma.plannerMark.deleteMany({ where: { date } });
  return NextResponse.json({ ok: true });
}
