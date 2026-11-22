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
  if (body.text !== undefined) {
    const text = cleanText(body.text, 300);
    if (!text) return badRequest("Isi butir tidak boleh kosong.");
    data.text = text;
  }
  if (body.done !== undefined) {
    if (typeof body.done !== "boolean")
      return badRequest("Nilai selesai tidak valid.");
    data.done = body.done;
  }
  const item = await prisma.plannerGoalDayItem.update({ where: { id }, data });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  await prisma.plannerGoalDayItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
