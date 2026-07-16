"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CalendarDays, ChevronRight, ClipboardList, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/context";
import { useSelectionState } from "@/features/selection/hooks";
import { useActivity } from "@/features/activities/hooks";
import { useEventInfo } from "@/features/event/hooks";
import { isAgendaItemLive, useNow } from "@/features/event/schedule-time";
import { cn } from "@/lib/utils";

function SelectionSummary({ employeeId }: { employeeId: string }) {
  const { data, isLoading, isError } = useSelectionState(employeeId);
  const activityId = data?.selection?.activityId;
  const { data: activity } = useActivity(activityId ?? "");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="mb-1 size-11 rounded-xl" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border border-destructive/30">
        <CardContent className="py-4 text-sm text-destructive">
          Gagal memuat status pilihan.
        </CardContent>
      </Card>
    );
  }

  if (!activityId || !activity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Belum memilih aktivitas</CardTitle>
          <CardDescription>
            Pilih salah satu aktivitas segmented sebelum kuota penuh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" nativeButton={false} render={<Link href="/explore" />}>
            Explore Aktivitas
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
          <span className="text-lg leading-none">{activity.icon || "🏷️"}</span>
        </div>
        <CardTitle>{activity.name}</CardTitle>
        <CardDescription>
          {activity.timeWindow} · {activity.location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="success">✓ Aktivitas Terpilih</Badge>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { employee } = useAuth();
  const { data: event } = useEventInfo();
  const fitRave = event?.day2.agenda.find((item) => item.id === "fit-rave");
  const now = useNow();
  const isFitRaveLive =
    !!event &&
    !!fitRave &&
    isAgendaItemLive(event.day2.date, fitRave.timeStart, fitRave.timeEnd, now);

  if (!employee) return null;

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-2 sm:px-6">
      <div>
        <p className="text-sm text-muted-foreground">Halo,</p>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {employee.name.split(" ")[0]}
        </h1>
      </div>

      {event?.scheduleVisible && (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Agenda Terdekat
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Link href="/schedule">
              <Card
                className={cn(
                  "relative overflow-hidden bg-linear-to-br from-primary to-secondary text-white",
                  isFitRaveLive && "ring-2 ring-white/70 ring-offset-2 ring-offset-background"
                )}
              >
                {isFitRaveLive && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                    <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
                    Sedang Berlangsung
                  </span>
                )}
                <CardContent className="flex items-center gap-3 py-5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Waves className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading text-lg font-semibold">
                      {fitRave?.title ?? "Agenda"}
                    </p>
                    <p className="text-xs font-medium text-white/70">
                      {fitRave?.description ?? "Lihat rangkaian acara lengkap"}
                    </p>
                    <p className="text-sm text-white/85">
                      {event ? `${event.day2.date} · ` : ""}
                      {fitRave ? `${fitRave.timeStart}–${fitRave.timeEnd}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Status Pilihanmu
        </h2>
        <SelectionSummary employeeId={employee.id} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        {event?.scheduleVisible && (
          <Link href="/schedule">
            <Card className="h-full">
              <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
                <CalendarDays className="size-6 text-secondary" />
                <p className="text-sm font-medium text-foreground">
                  Event Schedule
                </p>
              </CardContent>
            </Card>
          </Link>
        )}
        <Link
          href="/my-activities"
          className={cn(!event?.scheduleVisible && "col-span-2")}
        >
          <Card className="h-full">
            <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
              <ClipboardList className="size-6 text-secondary" />
              <p className="text-sm font-medium text-foreground">
                My Activities
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
