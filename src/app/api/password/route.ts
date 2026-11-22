import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, requireUser, unauthorized } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/auth";

// Ganti sandi pengguna yang sedang masuk.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  let body: { current?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Permintaan tidak valid.");
  }
  if (!body.current || !body.next) return badRequest("Sandi lama dan baru wajib diisi.");
  if (body.next.length < 6) return badRequest("Sandi baru minimal 6 karakter.");
  const fresh = await prisma.plannerUser.findUnique({ where: { id: user.id } });
  if (!fresh || !(await verifyPassword(body.current, fresh.passwordHash))) {
    return NextResponse.json({ error: "Sandi lama salah." }, { status: 401 });
  }
  await prisma.plannerUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(body.next) },
  });
  return NextResponse.json({ ok: true });
}
