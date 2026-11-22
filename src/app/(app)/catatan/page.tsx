import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import PapanCatatan from "./PapanCatatan";

export default async function CatatanPage() {
  await connection();
  const notes = await prisma.plannerNote.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Catatan</h1>
      <p className="mt-1 text-sm text-muted">
        Tempat menulis bebas: ide, inspirasi, atau apa pun yang mau disimpan.
      </p>
      <div className="mt-6">
        <PapanCatatan initial={notes} />
      </div>
    </div>
  );
}
