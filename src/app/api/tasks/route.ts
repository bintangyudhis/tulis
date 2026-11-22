import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";
import { dariInputLocal } from "@/lib/tugas";

export async function GET() {
  if (!(await requireUser())) return unauthorized();
  const tasks = await prisma.plannerTask.findMany({
    orderBy: [{ done: "asc" }, { deadline: "asc" }],
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  if (!(await requireUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  const title = cleanText(body.title, 200);
  if (!title) return badRequest("Judul tugas wajib diisi.");
  if (typeof body.deadline !== "string") return badRequest("Tenggat wajib diisi.");
  const deadline = dariInputLocal(body.deadline);
  if (!deadline) return badRequest("Format tenggat tidak valid.");
  const note =
    typeof body.note === "string" && body.note.length <= 2000 ? body.note.trim() : "";
  const task = await prisma.plannerTask.create({ data: { title, note, deadline } });
  return NextResponse.json({ task });
}
