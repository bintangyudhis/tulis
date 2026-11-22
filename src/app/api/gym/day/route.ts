import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";

// Ubah pengaturan hari: istirahat atau catatan hari.
export async function PATCH(req: Request) {
  if (!(await requireUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  const day = body.day;
  if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > 7)
    return badRequest("Hari tidak valid.");
  const data: { isRest?: boolean; note?: string | null } = {};
  if (body.isRest !== undefined) {
    if (typeof body.isRest !== "boolean") return badRequest("Nilai istirahat tidak valid.");
    data.isRest = body.isRest;
  }
  if (body.note !== undefined) {
    if (body.note === null || body.note === "") data.note = null;
    else {
      const note = cleanText(body.note, 200);
      if (!note) return badRequest("Catatan terlalu panjang.");
      data.note = note;
    }
  }
  const row = await prisma.plannerGymDay.upsert({
    where: { day },
    create: { day, isRest: data.isRest ?? false, note: data.note ?? null },
    update: data,
  });
  return NextResponse.json({ day: row });
}
