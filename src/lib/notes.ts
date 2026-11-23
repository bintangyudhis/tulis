import { cleanText } from "@/lib/api";

// Foto lampiran catatan: data URL gambar, plafon sedikit di atas
// 200 KB biner (base64 menambah sekitar sepertiga ukuran).
export function validImage(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/") &&
    value.length <= 300_000
  );
}

export function parseCategory(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  return cleanText(value, 40);
}
