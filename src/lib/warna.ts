// Warna tanda kalender, dipakai papan kalender, beranda, dan print.
export const WARNA: Record<string, { label: string; chip: string; cell: string }> = {
  hijau: { label: "Libur", chip: "bg-green-600", cell: "bg-green-100" },
  biru: { label: "Acara", chip: "bg-blue-600", cell: "bg-blue-100" },
  merah: { label: "Penting", chip: "bg-red-600", cell: "bg-red-100" },
  kuning: { label: "Tenggat", chip: "bg-yellow-500", cell: "bg-yellow-100" },
  ungu: { label: "Pribadi", chip: "bg-purple-600", cell: "bg-purple-100" },
};
