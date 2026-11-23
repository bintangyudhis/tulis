import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";
import { parseCategory, validImage } from "@/lib/notes";

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
  if (body.content !== undefined) {
    if (typeof body.content !== "string" || body.content.length > 20000)
      return badRequest("Isi catatan terlalu panjang.");
    data.content = body.content;
  }
  if (body.category !== undefined) {
    const category = parseCategory(body.category);
    if (body.category && !category)
      return badRequest("Kategori terlalu panjang.");
    data.category = category;
  }
  if (body.image !== undefined) {
    if (body.image === null) data.image = null;
    else {
      if (!validImage(body.image))
        return badRequest("Foto tidak valid atau melebihi 200 KB.");
      data.image = body.image;
    }
  }
  const note = await prisma.plannerNote.update({ where: { id }, data });
  return NextResponse.json({ note });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  const { id } = await params;
  await prisma.plannerNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
