import { connection } from "next/server";
import { jakartaNow } from "@/lib/dates";
import { goalsUntukBulan } from "@/lib/goals";
import PapanGoals from "./PapanGoals";

export default async function GoalsPage() {
  await connection();
  const now = jakartaNow();
  const items = await goalsUntukBulan(now.monthStr);
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
