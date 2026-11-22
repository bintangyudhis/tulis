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
    const text = cleanText(body.text, 200);
    if (!text) return badRequest("Nama gerakan tidak boleh kosong.");
    data.text = text;
  }
  if (body.detail !== undefined) {
    if (body.detail === null || body.detail === "") data.detail = null;
    else {
      const detail = cleanText(body.detail, 100);
      if (!detail) return badRequest("Detail terlalu panjang.");
      data.detail = detail;
    }
  }
  const item = await prisma.plannerGymItem.update({ where: { id }, data });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  await prisma.plannerGymItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
