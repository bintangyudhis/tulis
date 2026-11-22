import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized, validDay } from "@/lib/api";
import { PERIODS } from "@/lib/dates";

const KINDS = ["general", "todo", "time"] as const;

export async function GET() {
  if (!(await requireUser())) return unauthorized();
  const items = await prisma.plannerSchedule.findMany({
    orderBy: [{ day: "asc" }, { kind: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await requireUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  if (!validDay(body.day)) return badRequest("Hari tidak valid.");
  if (!KINDS.includes(body.kind as (typeof KINDS)[number]))
    return badRequest("Jenis jadwal tidak valid.");
  const text = cleanText(body.text, 300);
  if (!text) return badRequest("Isi jadwal wajib diisi (maks 300 karakter).");

  let period: string | null = null;
  let time: string | null = null;
  if (body.kind === "general") {
    if (!PERIODS.includes(body.period as (typeof PERIODS)[number]))
      return badRequest("Pilih waktu: pagi, siang, sore, atau malam.");
    period = body.period as string;
  }
  if (body.kind === "time") {
    if (typeof body.time !== "string" || !/^\d{2}:\d{2}$/.test(body.time))
      return badRequest("Jam wajib format HH:mm.");
    time = body.time;
  }
  const last = await prisma.plannerSchedule.findFirst({
    where: { day: body.day, kind: body.kind as string },
    orderBy: { sort: "desc" },
  });
  const item = await prisma.plannerSchedule.create({
    data: {
      day: body.day,
      kind: body.kind as string,
      period,
      time,
      text,
      sort: (last?.sort ?? -1) + 1,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
