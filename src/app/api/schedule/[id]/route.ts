import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";
import { PERIODS } from "@/lib/dates";

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
  if (body.text !== undefined) {
    const text = cleanText(body.text, 300);
    if (!text) return badRequest("Isi jadwal tidak boleh kosong.");
    data.text = text;
  }
  if (body.done !== undefined) {
    if (typeof body.done !== "boolean") return badRequest("Nilai selesai tidak valid.");
    data.done = body.done;
  }
  if (body.period !== undefined) {
    if (body.period !== null && !PERIODS.includes(body.period as (typeof PERIODS)[number]))
      return badRequest("Waktu tidak valid.");
    data.period = body.period;
  }
  if (body.time !== undefined) {
    if (body.time !== null && (typeof body.time !== "string" || !/^\d{2}:\d{2}$/.test(body.time)))
      return badRequest("Jam wajib format HH:mm.");
    data.time = body.time;
  }
  const item = await prisma.plannerSchedule.update({ where: { id }, data });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  await prisma.plannerSchedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
