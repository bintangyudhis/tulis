import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import FormLogin from "./FormLogin";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <p className="font-mono text-xs font-semibold tracking-widest text-accent uppercase">
        Planner pribadi
      </p>
      <h1 className="mt-2 text-3xl font-extrabold">Tulis</h1>
      <p className="mt-2 text-sm text-muted">
        Jadwal harian, gym, goals bulanan, kalender, dan catatan. Khusus pemilik
        akun, masuk dulu untuk melanjutkan.
      </p>
      <FormLogin />
    </main>
  );
}
