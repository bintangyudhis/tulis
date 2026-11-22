import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { jakartaNow } from "@/lib/dates";
import PapanGym from "./PapanGym";

export default async function GymPage() {
  await connection();
  const [days, items] = await Promise.all([
    prisma.plannerGymDay.findMany({ orderBy: { day: "asc" } }),
    prisma.plannerGymItem.findMany({
      orderBy: [{ day: "asc" }, { sort: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const now = jakartaNow();
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Jadwal Gym</h1>
      <p className="mt-1 text-sm text-muted">
        Beri nama sesi tiap hari (mis. Leg Day), lalu isi gerakannya di
        bawah nama sesi itu. Tandai hari istirahat bila perlu.
      </p>
      <div className="mt-6">
        <PapanGym initialDays={days} initialItems={items} todayIndex={now.dayIndex} />
      </div>
    </div>
  );
}
