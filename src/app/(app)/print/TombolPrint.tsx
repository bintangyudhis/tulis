"use client";

export default function TombolPrint() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-lg bg-accent px-5 py-2.5 font-bold text-white"
    >
      Print jadwal
    </button>
  );
}
