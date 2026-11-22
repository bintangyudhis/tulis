import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { jakartaNow } from "@/lib/dates";
import { transaksiBulan } from "@/lib/keuangan";
import PapanKeuangan from "./PapanKeuangan";

export default async function KeuanganPage() {
  await connection();
  const now = jakartaNow();
  const [items, rules, shortcuts] = await Promise.all([
    transaksiBulan(now.monthStr, now.dateStr),
    prisma.plannerMoneyRule.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    }),
    prisma.plannerMoneyShortcut.findMany({
      orderBy: [{ kind: "asc" }, { sort: "asc" }, { name: "asc" }],
    }),
  ]);
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Keuangan</h1>
      <p className="mt-1 text-sm text-muted">
        Catat uang masuk dan keluar dengan nama bebas. Pemasukan dan
        pengeluaran tetap tercatat otomatis tiap bulan pada tanggalnya.
      </p>
      <div className="mt-6">
        <PapanKeuangan
          initialMonth={now.monthStr}
          initialItems={items}
          initialRules={rules}
          initialShortcuts={shortcuts}
          todayStr={now.dateStr}
        />
      </div>
    </div>
  );
}
