import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { jakartaNow } from "@/lib/dates";
import PapanGoals from "./PapanGoals";

export default async function GoalsPage() {
  await connection();
  const now = jakartaNow();
  const items = await prisma.plannerGoal.findMany({
    where: { month: now.monthStr },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Goals Bulanan</h1>
      <p className="mt-1 text-sm text-muted">
        Target per bulan. Centang yang sudah tercapai, pindah bulan untuk
        melihat atau menyusun bulan lain.
      </p>
      <div className="mt-6">
        <PapanGoals initialMonth={now.monthStr} initialItems={items} todayStr={now.dateStr} />
      </div>
    </div>
  );
}
