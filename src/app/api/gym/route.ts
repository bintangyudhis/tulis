import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized, validDay } from "@/lib/api";

export async function GET() {
  if (!(await requireUser())) return unauthorized();
  const [days, items] = await Promise.all([
    prisma.plannerGymDay.findMany({ orderBy: { day: "asc" } }),
    prisma.plannerGymItem.findMany({
      orderBy: [{ day: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  return NextResponse.json({ days, items });
}

// Tambah gerakan latihan.
export async function POST(req: Request) {
  if (!(await requireUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  if (!validDay(body.day)) return badRequest("Hari tidak valid.");
  const text = cleanText(body.text, 200);
  if (!text) return badRequest("Nama gerakan wajib diisi.");
  const detail =
    body.detail === undefined || body.detail === null || body.detail === ""
      ? null
      : cleanText(body.detail, 100);
  if (body.detail && detail === null) return badRequest("Detail terlalu panjang.");
  const last = await prisma.plannerGymItem.findFirst({
    where: { day: body.day },
    orderBy: { sort: "desc" },
  });
  const item = await prisma.plannerGymItem.create({
    data: { day: body.day, text, detail, sort: (last?.sort ?? -1) + 1 },
  });
  return NextResponse.json({ item }, { status: 201 });
}
