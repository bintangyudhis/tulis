import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { jakartaNow } from "@/lib/dates";
import TombolKeluar from "./TombolKeluar";
import NavBawah from "./NavBawah";

const MENU = [
  { href: "/", label: "Beranda" },
  { href: "/jadwal", label: "Jadwal Harian" },
  { href: "/gym", label: "Gym" },
  { href: "/tugas", label: "Tugas" },
  { href: "/goals", label: "Goals Bulanan" },
  { href: "/kalender", label: "Kalender" },
  { href: "/catatan", label: "Catatan" },
  { href: "/keuangan", label: "Keuangan" },
  { href: "/print", label: "Print Jadwal" },
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
        <div className="flex items-center gap-2 py-3">
          <Link href="/" className="shrink-0 text-xl font-extrabold tracking-tight">
            Tulis
          </Link>
          <span className="hidden shrink-0 font-mono text-xs text-muted lg:block">
            {now.label} WIB
          </span>
          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap md:flex">
            {MENU.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-accent-soft hover:text-ink"
              >
                {m.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-0.5 border-l border-line pl-2">
            <Link
              href="/pengaturan"
              title="Pengaturan"
              aria-label="Pengaturan"
              className="rounded-lg p-2 text-muted hover:bg-accent-soft hover:text-ink"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3.2" />
                <circle
                  cx="12"
                  cy="12"
                  r="6.4"
                  strokeWidth="2.6"
                  strokeDasharray="3.4 2.9"
                />
              </svg>
            </Link>
            <TombolKeluar />
          </div>
        </div>
      </header>
      <main className="py-6 pb-24 md:pb-6">{children}</main>
      <footer className="no-print hidden border-t border-line py-5 text-center font-mono text-xs text-muted md:block">
        Planner pribadi Bintang Yudhistira
      </footer>
      <NavBawah />
    </div>
  );
}
