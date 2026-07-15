import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";

const faqs = [
  {
    q: "Apa bedanya aktivitas Perlu Dipilih dan Bebas Ikut?",
    a: "Aktivitas Perlu Dipilih (Running, Fitness, Aqua Yoga, Zumba) punya kuota terbatas sehingga kamu harus memilih salah satu lebih dulu. Aktivitas Bebas Ikut (Swimming, Badminton, Volleyball) tidak berkuota, jadi kamu bisa langsung datang tanpa perlu memilih.",
  },
  {
    q: "Berapa banyak aktivitas segmented yang boleh saya pilih?",
    a: "Hanya satu aktivitas segmented untuk keseluruhan acara. Kamu tetap boleh mengikuti sebanyak mungkin Open Activity tanpa batas.",
  },
  {
    q: "Bisakah saya mengganti pilihan setelah konfirmasi?",
    a: "Bisa, selama kuota aktivitas tujuan masih tersedia. Slot lamamu otomatis dilepas begitu kamu berpindah ke aktivitas baru.",
  },
  {
    q: "Apa yang terjadi jika kuota aktivitas sudah penuh?",
    a: "Tombol pemilihan akan otomatis nonaktif dan menampilkan badge \"Kuota Penuh\". Silakan pilih aktivitas segmented lain yang masih tersedia.",
  },
  {
    q: "Sampai kapan saya bisa memilih atau mengganti aktivitas?",
    a: "Kamu bisa memilih atau mengganti aktivitas kapan saja selama kuota tujuan masih tersedia, tidak ada batas waktu pendaftaran.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4 sm:px-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">FAQ</h1>
      <div className="flex flex-col gap-3">
        {faqs.map((item) => (
          <Card key={item.q} className="overflow-hidden">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-foreground">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                {item.a}
              </p>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
