import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, cleanText, requireUser, unauthorized } from "@/lib/api";

export async function GET() {
  if (!(await requireUser())) return unauthorized();
  const notes = await prisma.plannerNote.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  if (!(await requireUser())) return unauthorized();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  const title = cleanText(body.title, 200) ?? "Tanpa judul";
  const content =
    typeof body.content === "string" && body.content.length <= 20000
      ? body.content
      : "";
  const note = await prisma.plannerNote.create({ data: { title, content } });
  return NextResponse.json({ note }, { status: 201 });
}
