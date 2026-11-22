import { prisma } from "@/lib/prisma";
import { jumlahHari, rentangRoadmap, tambahHari } from "@/lib/dates";

// Goal yang tampil pada tampilan satu bulan: goal milik bulan itu,
// ditambah goal dari bulan lain yang rentang roadmapnya menembus
// bulan ini (roadmap bisa lintas bulan sampai satu tahun).
export async function goalsUntukBulan(monthStr: string) {
  const awalBulan = `${monthStr}-01`;
  const akhirBulan = `${monthStr}-${String(jumlahHari(monthStr)).padStart(2, "0")}`;
  const kandidat = await prisma.plannerGoal.findMany({
    where: {
      OR: [
        { month: monthStr },
        { roadmapStart: { not: null, lte: akhirBulan } },
      ],
    },
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
  });
  return kandidat.filter((g) => {
    if (g.month === monthStr) return true;
    const { start, days } = rentangRoadmap(g);
    return tambahHari(start, days - 1) >= awalBulan;
  });
}
