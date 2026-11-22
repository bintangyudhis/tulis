// Format rupiah tanpa desimal: 1500000 -> "Rp1.500.000".
export function formatRupiah(n: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(n)}`;
}
