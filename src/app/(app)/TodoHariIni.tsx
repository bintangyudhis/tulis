"use client";

import { useState } from "react";
import type { PlannerSchedule } from "@prisma/client";

export default function TodoHariIni({ initial }: { initial: PlannerSchedule[] }) {
  const [items, setItems] = useState(initial);

  async function toggle(item: PlannerSchedule, done: boolean) {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, done } : i)));
    const res = await fetch(`/api/schedule/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    if (!res.ok) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, done: !done } : i)));
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">Tidak ada to do untuk hari ini.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={i.done}
            onChange={(e) => void toggle(i, e.target.checked)}
            className="h-4 w-4 accent-[#17603f]"
          />
          <span className={i.done ? "text-muted line-through" : ""}>{i.text}</span>
        </li>
      ))}
    </ul>
  );
}
