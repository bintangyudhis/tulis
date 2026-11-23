"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Bar navigasi bawah khusus layar HP. Menu utama di empat tombol
// pertama, sisanya di panel Lainnya. Di layar besar bar ini sembunyi
// dan menu atas yang bekerja.
const UTAMA = [
  { href: "/", label: "Beranda", ikon: "rumah" },
  { href: "/jadwal", label: "Jadwal", ikon: "kalender" },
  { href: "/gym", label: "Gym", ikon: "dumbbell" },
  { href: "/tugas", label: "Tugas", ikon: "centang" },
] as const;

const LAINNYA = [
  { href: "/goals", label: "Goals" },
  { href: "/kalender", label: "Kalender" },
  { href: "/catatan", label: "Catatan" },
  { href: "/keuangan", label: "Keuangan" },
  { href: "/print", label: "Print" },
] as const;

function Ikon({ nama, className }: { nama: string; className?: string }) {
  const umum = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className ?? "h-6 w-6",
    "aria-hidden": true,
  };
  switch (nama) {
    case "rumah":
      return (
        <svg {...umum}>
          <path d="M4 11l8-7 8 7" />
          <path d="M6 9.5V20h12V9.5" />
        </svg>
      );
    case "kalender":
      return (
        <svg {...umum}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16M8.5 3v4M15.5 3v4" />
        </svg>
      );
    case "dumbbell":
      return (
        <svg {...umum}>
          <path d="M7.5 7.5v9M16.5 7.5v9M4 9.5v5M20 9.5v5M7.5 12h9" />
        </svg>
      );
    case "centang":
      return (
        <svg {...umum}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
        </svg>
      );
    default:
      return (
        <svg {...umum}>
          <rect x="5" y="5" width="4" height="4" rx="1" />
          <rect x="15" y="5" width="4" height="4" rx="1" />
          <rect x="5" y="15" width="4" height="4" rx="1" />
          <rect x="15" y="15" width="4" height="4" rx="1" />
        </svg>
      );
  }
}

export default function NavBawah() {
  const pathname = usePathname();
  const [terbuka, setTerbuka] = useState(false);
  const aktif = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const lainnyaAktif = LAINNYA.some((m) => aktif(m.href));

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden print:hidden">
      {terbuka && (
        <div className="border-t border-line bg-panel px-3 pt-2 pb-1 shadow-[0_-6px_20px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-3 gap-1">
            {LAINNYA.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setTerbuka(false)}
                className={`rounded-lg px-3 py-2.5 text-center text-sm font-semibold ${
                  aktif(m.href)
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-accent-soft"
                }`}
              >
                {m.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className="grid grid-cols-5 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {UTAMA.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
              aktif(m.href) ? "text-accent" : "text-muted"
            }`}
          >
            <Ikon nama={m.ikon} />
            {m.label}
          </Link>
        ))}
        <button
          onClick={() => setTerbuka((v) => !v)}
          className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
            lainnyaAktif || terbuka ? "text-accent" : "text-muted"
          }`}
          aria-expanded={terbuka}
        >
          <Ikon nama="grid" />
          Lainnya
        </button>
      </nav>
    </div>
  );
}
