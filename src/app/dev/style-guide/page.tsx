"use client";

import { motion } from "motion/react";
import { AlertTriangle, Check, Dumbbell, Footprints, RefreshCw, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 rounded-xl ring-1 ring-foreground/10 ${className}`} />
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-secondary">
          Mid Year Party — Design System
        </p>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Style Reference
        </h1>
        <p className="text-base text-muted-foreground">
          Living reference untuk warna, tipografi, komponen, dan state global.
          Halaman ini dev-only, tidak ditautkan dari navigasi utama.
        </p>
      </header>

      <Section title="Color">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch name="Primary — Ocean Blue" className="bg-primary" />
          <Swatch name="Secondary — Turquoise" className="bg-secondary" />
          <Swatch name="Accent — Sunset Orange" className="bg-accent" />
          <Swatch name="Highlight — Soft Yellow" className="bg-highlight" />
          <Swatch name="Success" className="bg-success" />
          <Swatch name="Warning (TBU)" className="bg-warning" />
          <Swatch name="Urgent (Coral)" className="bg-urgent" />
          <Swatch name="Destructive" className="bg-destructive" />
          <Swatch name="Background — White Sand" className="bg-background" />
          <Swatch name="Card" className="bg-card" />
          <Swatch name="Muted" className="bg-muted" />
          <Swatch name="Border" className="border-2 border-border bg-transparent" />
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-3">
          <p className="font-heading text-4xl font-bold">Fit Rave 07.30–10.00</p>
          <p className="font-heading text-2xl font-semibold">Explore Activities</p>
          <p className="font-heading text-xl font-medium">Aqua Yoga</p>
          <p className="text-base text-foreground">
            Body text (Work Sans) — dipakai untuk deskripsi aktivitas dan
            konten panjang lainnya.
          </p>
          <p className="text-sm text-muted-foreground">
            Small / helper text — lokasi, catatan, keterangan sekunder.
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Pilih Aktivitas Ini</Button>
          <Button variant="secondary">Tandai Ikut</Button>
          <Button variant="outline">Batalkan</Button>
          <Button variant="destructive">Batalkan Pilihan</Button>
          <Button variant="ghost">Lihat Detail</Button>
          <Button variant="link">Lihat FAQ</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">CTA Utama (lg)</Button>
          <Button size="sm">Aksi sekunder (sm)</Button>
          <Button disabled>Kuota Penuh</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Perlu Dipilih</Badge>
          <Badge variant="secondary">Bebas Ikut</Badge>
          <Badge variant="success">✓ Aktivitas Terpilih</Badge>
          <Badge variant="warning">Detail Menyusul (TBU)</Badge>
          <Badge variant="urgent">Kuota Hampir Penuh</Badge>
          <Badge variant="destructive">Kuota Penuh</Badge>
          <Badge variant="outline">Day 2 · Fit Rave</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
                <Footprints className="size-5" />
              </div>
              <CardTitle>Running</CardTitle>
              <CardDescription>Fit Rave · 07.30 - 10.00 · 18/50 slot</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge>Perlu Dipilih</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
                <Waves className="size-5" />
              </div>
              <CardTitle>Swimming</CardTitle>
              <CardDescription>Fit Rave · 07.30 - 10.00 · Bebas ikut</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Bebas Ikut</Badge>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Global States">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Loading</p>
            <Card>
              <CardHeader>
                <Skeleton className="mb-1 size-11 rounded-xl" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </CardHeader>
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Empty</p>
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Dumbbell className="size-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Belum ada aktivitas yang dipilih
                </p>
                <Button size="sm">Explore Aktivitas</Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Error</p>
            <Card className="border border-destructive/30">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertTriangle className="size-5 shrink-0 text-destructive" />
                <p className="flex-1 text-sm text-destructive">
                  Gagal memuat data, coba lagi.
                </p>
                <Button size="sm" variant="outline">
                  <RefreshCw className="size-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Success</p>
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success"
                >
                  <Check className="size-6" />
                </motion.div>
                <p className="text-sm font-medium text-foreground">
                  Pilihan berhasil dikonfirmasi!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  );
}
