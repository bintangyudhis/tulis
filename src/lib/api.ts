import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export async function requireUser() {
  const user = await getCurrentUser();
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > max) return null;
  return text;
}

export function validDay(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 7;
}
