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
      title="Keluar"
      aria-label="Keluar"
      className="rounded-lg p-2 text-muted hover:bg-accent-soft hover:text-ink"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
        <path d="M10 12h10" />
        <path d="M17 8l3 4-3 4" />
      </svg>
    </button>
  );
}
