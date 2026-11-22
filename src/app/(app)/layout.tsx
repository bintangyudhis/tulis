import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { jakartaNow } from "@/lib/dates";
import TombolKeluar from "./TombolKeluar";

const MENU = [
  { href: "/", label: "Beranda" },
  { href: "/jadwal", label: "Jadwal Harian" },
  { href: "/gym", label: "Gym" },
  { href: "/tugas", label: "Tugas" },
  { href: "/goals", label: "Goals Bulanan" },
  { href: "/kalender", label: "Kalender" },
  { href: "/catatan", label: "Catatan" },
  { href: "/print", label: "Print Jadwal" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const now = jakartaNow();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <header className="no-print sticky top-0 z-40 -mx-4 border-b border-line bg-paper/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-3">
          <Link href="/" className="mr-2 text-xl font-extrabold tracking-tight">
            Tulis
          </Link>
          <span className="mr-auto hidden font-mono text-xs text-muted md:block">
            {now.label} WIB
          </span>
          <nav className="flex flex-wrap items-center gap-1">
            {MENU.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-accent-soft hover:text-ink"
              >
                {m.label}
              </Link>
            ))}
            <TombolKeluar />
          </nav>
        </div>
      </header>
      <main className="py-6">{children}</main>
      <footer className="no-print border-t border-line py-5 text-center font-mono text-xs text-muted">
        Planner pribadi Bintang Yudhistira
      </footer>
    </div>
  );
}
