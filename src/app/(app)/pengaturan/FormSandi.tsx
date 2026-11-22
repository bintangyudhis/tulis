"use client";

import { useState } from "react";

export default function FormSandi() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gagal mengganti sandi.");
      setOk(true);
      setCurrent("");
      setNext("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengganti sandi.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-4 max-w-md space-y-4">
      <div>
        <label htmlFor="current" className="text-sm font-semibold">
          Sandi sekarang
        </label>
        <input
          id="current"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2.5"
        />
      </div>
      <div>
        <label htmlFor="next" className="text-sm font-semibold">
          Sandi baru (minimal 6 karakter)
        </label>
        <input
          id="next"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2.5"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {ok && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">
          Sandi berhasil diganti. Perangkat yang sudah masuk tetap masuk.
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-accent px-4 py-2.5 font-bold text-white disabled:opacity-60"
      >
        {busy ? "Menyimpan..." : "Ganti sandi"}
      </button>
    </form>
  );
}
