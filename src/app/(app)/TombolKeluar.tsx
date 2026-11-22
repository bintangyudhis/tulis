"use client";

import { useRouter } from "next/navigation";

export default function TombolKeluar() {
  const router = useRouter();
  async function keluar() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={keluar}
      className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-accent-soft hover:text-ink"
    >
      Keluar
    </button>
  );
}
