import { prisma } from "@/lib/prisma";
import { jumlahHari } from "@/lib/dates";

// Wujudkan aturan tetap menjadi transaksi untuk bulan yang diminta.
// Bulan lampau diwujudkan penuh, bulan berjalan hanya sampai hari ini,
// bulan depan belum. Entri yang pernah dihapus pemilik tidak dibuat
// ulang (ada penanda di PlannerMoneySkip).
export async function materialisasiAturan(monthStr: string, todayStr: string) {
  const bulanIni = todayStr.slice(0, 7);
  if (monthStr > bulanIni) return;
  const rules = await prisma.plannerMoneyRule.findMany({
    where: { active: true },
  });
  if (rules.length === 0) return;
  const dim = jumlahHari(monthStr);
  for (const r of rules) {
    const tgl = `${monthStr}-${String(Math.min(r.day, dim)).padStart(2, "0")}`;
    if (monthStr === bulanIni && tgl > todayStr) continue;
    const skip = await prisma.plannerMoneySkip.findUnique({
      where: { recurringId_period: { recurringId: r.id, period: monthStr } },
    });
    if (skip) continue;
    const ada = await prisma.plannerMoneyTx.findFirst({
      where: { recurringId: r.id, period: monthStr },
    });
    if (ada) continue;
    await prisma.plannerMoneyTx.create({
      data: {
        kind: r.kind,
        name: r.name,
        amount: r.amount,
        date: tgl,
        recurringId: r.id,
        period: monthStr,
      },
    });
  }
}

export async function transaksiBulan(monthStr: string, todayStr: string) {
  await materialisasiAturan(monthStr, todayStr);
  return prisma.plannerMoneyTx.findMany({
    where: { date: { startsWith: monthStr } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
