"use client";

import { useState } from "react";

// Satu baris item yang bisa dicentang (opsional), diedit, dan dihapus.
// Dipakai di jadwal, gym, dan goals.
export default function BarisItem({
  text,
  prefix,
  done,
  onToggle,
  onSave,
  onDelete,
}: {
  text: string;
  prefix?: React.ReactNode;
  done?: boolean;
  onToggle?: (done: boolean) => void;
  onSave: (text: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [busy, setBusy] = useState(false);

  async function simpan() {
    if (!draft.trim()) return;
    setBusy(true);
    await onSave(draft.trim());
    setBusy(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 py-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") void simpan();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button
          onClick={() => void simpan()}
          disabled={busy}
          className="rounded-md bg-accent px-2 py-1 text-xs font-bold text-white disabled:opacity-60"
        >
          Simpan
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded-md px-2 py-1 text-xs font-semibold text-muted"
        >
          Batal
        </button>
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-2 py-1.5">
      {onToggle !== undefined && (
        <input
          type="checkbox"
          checked={!!done}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#17603f]"
        />
      )}
      {prefix}
      <span
        className={`min-w-0 flex-1 text-sm ${done ? "text-muted line-through" : ""}`}
      >
        {text}
      </span>
      <button
        onClick={() => {
          setDraft(text);
          setEditing(true);
        }}
        className="rounded px-1 text-xs font-semibold text-muted hover:text-ink lg:opacity-0 lg:group-hover:opacity-100"
        aria-label="Ubah"
      >
        Ubah
      </button>
      <button
        onClick={() => {
          if (window.confirm("Hapus item ini?")) void onDelete();
        }}
        className="rounded px-1 text-xs font-bold text-danger lg:opacity-0 lg:group-hover:opacity-100"
        aria-label="Hapus"
      >
        ×
      </button>
    </li>
  );
}
