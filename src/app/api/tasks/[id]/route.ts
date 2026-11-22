import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";
import { dariInputLocal } from "@/lib/tugas";

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
  if (body.title !== undefined) {
    const title = cleanText(body.title, 200);
    if (!title) return badRequest("Judul tidak boleh kosong.");
    data.title = title;
  }
  if (body.note !== undefined) {
    if (typeof body.note !== "string" || body.note.length > 2000)
      return badRequest("Catatan terlalu panjang.");
    data.note = body.note.trim();
  }
  if (body.deadline !== undefined) {
    if (typeof body.deadline !== "string") return badRequest("Format tenggat tidak valid.");
    const deadline = dariInputLocal(body.deadline);
    if (!deadline) return badRequest("Format tenggat tidak valid.");
    data.deadline = deadline;
  }
  if (body.done !== undefined) {
    if (typeof body.done !== "boolean") return badRequest("Nilai selesai tidak valid.");
    data.done = body.done;
  }
  const task = await prisma.plannerTask.update({ where: { id }, data });
  return NextResponse.json({ task });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  await prisma.plannerTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
