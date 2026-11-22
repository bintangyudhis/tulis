"use client";

import { useState } from "react";
import type {
  PlannerMoneyRule,
  PlannerMoneyShortcut,
  PlannerMoneyTx,
} from "@prisma/client";
import { labelTanggalSingkat, monthLabel, shiftMonth } from "@/lib/dates";
import { formatRupiah } from "@/lib/uang";

async function kirim(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Gagal menyimpan.");
  }
  return res.json();
}

type Jenis = "in" | "out";

function ToggleJenis({
  value,
  onChange,
}: {
  value: Jenis;
  onChange: (j: Jenis) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-line">
      <button
        type="button"
        onClick={() => onChange("in")}
        className={`px-3 py-2 text-sm font-bold ${
          value === "in" ? "bg-accent text-white" : "bg-panel text-muted"
        }`}
      >
        Uang Masuk
      </button>
      <button
        type="button"
        onClick={() => onChange("out")}
        className={`px-3 py-2 text-sm font-bold ${
          value === "out" ? "bg-danger text-white" : "bg-panel text-muted"
        }`}
      >
        Uang Keluar
      </button>
    </div>
  );
}

export default function PapanKeuangan({
  initialMonth,
  initialItems,
  initialRules,
  initialShortcuts,
  todayStr,
}: {
  initialMonth: string;
  initialItems: PlannerMoneyTx[];
  initialRules: PlannerMoneyRule[];
  initialShortcuts: PlannerMoneyShortcut[];
  todayStr: string;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [items, setItems] = useState(initialItems);
  const [rules, setRules] = useState(initialRules);
  const [shortcuts, setShortcuts] = useState(initialShortcuts);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [kind, setKind] = useState<Jenis>("out");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr);

  const [scName, setScName] = useState("");
  const [scAmount, setScAmount] = useState("");

  const [ruleKind, setRuleKind] = useState<Jenis>("in");
  const [ruleName, setRuleName] = useState("");
  const [ruleAmount, setRuleAmount] = useState("");
  const [ruleDay, setRuleDay] = useState("1");

  async function muat(bulan: string) {
    const data = await kirim(`/api/money?month=${bulan}`, "GET");
    setItems(data.items);
    setRules(data.rules);
    setShortcuts(data.shortcuts);
  }

  async function jalankan(fn: () => Promise<unknown>, bulan = month) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await muat(bulan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function gantiBulan(delta: number) {
    const baru = shiftMonth(month, delta);
    setMonth(baru);
    await jalankan(async () => {}, baru);
  }

  async function tambahTx(e: React.FormEvent) {
    e.preventDefault();
    const nominal = parseInt(amount, 10);
    if (!name.trim() || !Number.isInteger(nominal) || nominal < 1) return;
    const bulanTx = date.slice(0, 7);
    await jalankan(
      () =>
        kirim("/api/money", "POST", {
          kind,
          name: name.trim(),
          amount: nominal,
          date,
        }),
      bulanTx,
    );
    if (bulanTx !== month) setMonth(bulanTx);
    setName("");
    setAmount("");
  }

  async function pakaiShortcut(s: PlannerMoneyShortcut) {
    if (s.amount) {
      await jalankan(() =>
        kirim("/api/money", "POST", {
          kind: s.kind,
          name: s.name,
          amount: s.amount,
          date: todayStr,
        }),
      );
    } else {
      setKind(s.kind as Jenis);
      setName(s.name);
      setDate(todayStr);
    }
  }

  async function tambahShortcut(e: React.FormEvent) {
    e.preventDefault();
    if (!scName.trim()) return;
    const nominal = scAmount ? parseInt(scAmount, 10) : null;
    await jalankan(() =>
      kirim("/api/money-shortcuts", "POST", {
        kind,
        name: scName.trim(),
        amount: nominal,
      }),
    );
    setScName("");
    setScAmount("");
  }

  async function tambahRule(e: React.FormEvent) {
    e.preventDefault();
    const nominal = parseInt(ruleAmount, 10);
    const tanggal = parseInt(ruleDay, 10);
    if (!ruleName.trim() || !Number.isInteger(nominal) || nominal < 1) return;
    if (!Number.isInteger(tanggal) || tanggal < 1 || tanggal > 31) return;
    await jalankan(() =>
      kirim("/api/money-rules", "POST", {
        kind: ruleKind,
        name: ruleName.trim(),
        amount: nominal,
        day: tanggal,
      }),
    );
    setRuleName("");
    setRuleAmount("");
  }

  const totalIn = items
    .filter((i) => i.kind === "in")
    .reduce((a, i) => a + i.amount, 0);
  const totalOut = items
    .filter((i) => i.kind === "out")
    .reduce((a, i) => a + i.amount, 0);
  const selisih = totalIn - totalOut;
  const shortcutAktif = shortcuts.filter((s) => s.kind === kind);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void gantiBulan(-1)}
          className="rounded-lg border border-line bg-panel px-3 py-2 text-sm font-bold"
        >
          ← Bulan lalu
        </button>
        <h2 className="text-lg font-extrabold">{monthLabel(month)}</h2>
        <button
          onClick={() => void gantiBulan(1)}
          className="rounded-lg border border-line bg-panel px-3 py-2 text-sm font-bold"
        >
          Bulan depan →
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="text-[11px] font-bold tracking-wide text-muted uppercase">
            Masuk
          </div>
          <div className="mt-0.5 text-sm font-extrabold text-accent sm:text-lg">
            {formatRupiah(totalIn)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="text-[11px] font-bold tracking-wide text-muted uppercase">
            Keluar
          </div>
          <div className="mt-0.5 text-sm font-extrabold text-danger sm:text-lg">
            {formatRupiah(totalOut)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="text-[11px] font-bold tracking-wide text-muted uppercase">
            Selisih
          </div>
          <div
            className={`mt-0.5 text-sm font-extrabold sm:text-lg ${
              selisih < 0 ? "text-danger" : "text-ink"
            }`}
          >
            {formatRupiah(selisih)}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <section className="mt-5 rounded-xl border border-line bg-panel p-4">
        <h3 className="font-extrabold">Catat Transaksi</h3>
        <form onSubmit={tambahTx} className="mt-3 space-y-3">
          <ToggleJenis value={kind} onChange={setKind} />
          <div className="flex flex-wrap gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                kind === "in"
                  ? "Nama, mis. Hasil kerja freelance"
                  : "Nama, mis. Bensin"
              }
              maxLength={120}
              className="min-w-40 flex-1 rounded-md border border-line bg-panel px-3 py-2 text-sm"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Jumlah (Rp)"
              inputMode="numeric"
              className="w-36 rounded-md border border-line bg-panel px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-line bg-panel px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              Tambah
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted">Shortcut:</span>
          {shortcutAktif.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center overflow-hidden rounded-full border border-line bg-paper"
            >
              <button
                onClick={() => void pakaiShortcut(s)}
                className="px-2.5 py-1 text-xs font-bold hover:bg-accent-soft"
                title={
                  s.amount
                    ? `Klik untuk langsung mencatat ${formatRupiah(s.amount)} hari ini`
                    : "Klik untuk mengisi nama ke formulir"
                }
              >
                {s.name}
                {s.amount ? ` · ${formatRupiah(s.amount)}` : ""}
              </button>
              <button
                onClick={() =>
                  void jalankan(() =>
                    kirim(`/api/money-shortcuts/${s.id}`, "DELETE"),
                  )
                }
                className="px-1.5 py-1 text-xs font-bold text-muted hover:text-danger"
                title={`Hapus shortcut ${s.name}`}
              >
                ×
              </button>
            </span>
          ))}
          {shortcutAktif.length === 0 && (
            <span className="text-xs text-muted">
              belum ada untuk jenis ini
            </span>
          )}
        </div>
        <form onSubmit={tambahShortcut} className="mt-2 flex flex-wrap gap-2">
          <input
            value={scName}
            onChange={(e) => setScName(e.target.value)}
            placeholder={`Shortcut ${kind === "in" ? "masuk" : "keluar"} baru, mis. Galon`}
            maxLength={60}
            className="min-w-40 flex-1 rounded-md border border-dashed border-line bg-transparent px-2 py-1.5 text-xs"
          />
          <input
            value={scAmount}
            onChange={(e) => setScAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Jumlah tetap (boleh kosong)"
            inputMode="numeric"
            className="w-44 rounded-md border border-dashed border-line bg-transparent px-2 py-1.5 text-xs"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-bold disabled:opacity-60"
          >
            Tambah shortcut
          </button>
        </form>
      </section>

      <section className="mt-4 rounded-xl border border-line bg-panel p-4">
        <h3 className="font-extrabold">Daftar Transaksi</h3>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Belum ada transaksi bulan ini.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line/60">
            {items.map((i) => (
              <li key={i.id} className="group flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                    {i.name}
                    {i.recurringId && (
                      <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
                        tetap
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">
                    {labelTanggalSingkat(i.date)}
                  </div>
                </div>
                <span
                  className={`font-mono text-sm font-bold ${
                    i.kind === "in" ? "text-accent" : "text-danger"
                  }`}
                >
                  {i.kind === "in" ? "+" : "-"}
                  {formatRupiah(i.amount)}
                </span>
                <button
                  onClick={() =>
                    void jalankan(() => kirim(`/api/money/${i.id}`, "DELETE"))
                  }
                  className="px-1 text-sm font-bold text-muted opacity-0 group-hover:opacity-100 hover:text-danger"
                  title="Hapus transaksi"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-line bg-panel p-4">
        <h3 className="font-extrabold">Pemasukan dan Pengeluaran Tetap</h3>
        <p className="mt-1 text-xs text-muted">
          Otomatis tercatat tiap bulan pada tanggalnya. Entri bulan berjalan
          muncul setelah tanggalnya tiba. Menghapus entri hasil aturan tetap
          dari daftar transaksi tidak akan membuatnya muncul lagi bulan itu.
        </p>
        {rules.length > 0 && (
          <ul className="mt-3 divide-y divide-line/60">
            {rules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                    r.kind === "in" ? "bg-accent" : "bg-danger"
                  }`}
                >
                  {r.kind === "in" ? "MASUK" : "KELUAR"}
                </span>
                <span className="text-sm font-semibold">{r.name}</span>
                <span className="font-mono text-sm">{formatRupiah(r.amount)}</span>
                <span className="text-xs text-muted">tiap tanggal {r.day}</span>
                <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={r.active}
                    onChange={(e) =>
                      void jalankan(() =>
                        kirim(`/api/money-rules/${r.id}`, "PATCH", {
                          active: e.target.checked,
                        }),
                      )
                    }
                    className="h-4 w-4 accent-[#17603f]"
                  />
                  Aktif
                </label>
                <button
                  onClick={() =>
                    void jalankan(() =>
                      kirim(`/api/money-rules/${r.id}`, "DELETE"),
                    )
                  }
                  className="px-1 text-sm font-bold text-muted hover:text-danger"
                  title="Hapus aturan"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={tambahRule}
          className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3"
        >
          <ToggleJenis value={ruleKind} onChange={setRuleKind} />
          <input
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder={ruleKind === "in" ? "Mis. Gaji" : "Mis. Kos"}
            maxLength={120}
            className="min-w-32 flex-1 rounded-md border border-line bg-panel px-3 py-2 text-sm"
          />
          <input
            value={ruleAmount}
            onChange={(e) => setRuleAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Jumlah (Rp)"
            inputMode="numeric"
            className="w-32 rounded-md border border-line bg-panel px-3 py-2 text-sm"
          />
          <label className="text-xs font-semibold text-muted">
            Tanggal
            <input
              value={ruleDay}
              onChange={(e) => setRuleDay(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              className="ml-1 w-14 rounded-md border border-line bg-panel px-2 py-2 text-sm text-ink"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Tambah aturan
          </button>
        </form>
      </section>
    </div>
  );
}
