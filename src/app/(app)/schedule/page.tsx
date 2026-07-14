"use client";

import { AlertTriangle, RefreshCw, Sparkles, Sun } from "lucide-react";
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
import { useEventInfo } from "@/features/event/hooks";
import type { Dresscode, EventAgendaItem } from "@/features/event/types";

function DresscodeSection({
  dresscode,
  variant = "default",
}: {
  dresscode: Dresscode;
  variant?: "default" | "inverted";
}) {
  if (dresscode.items.length === 0 && !dresscode.note) {
    return null;
  }

  const isInverted = variant === "inverted";
  const borderClass = isInverted ? "border-white/20" : "border-border";
  const labelClass = isInverted
    ? "text-primary-foreground"
    : "text-foreground";
  const noteClass = isInverted
    ? "text-primary-foreground/70"
    : "text-muted-foreground";
  const listClass = isInverted
    ? "text-primary-foreground/90"
    : "text-muted-foreground";

  return (
    <div className={`mt-3 flex flex-col gap-2 border-t pt-3 ${borderClass}`}>
      <p className={`text-sm font-semibold ${labelClass}`}>Dresscode</p>
      {dresscode.items.length > 0 && (
        <ul className={`list-inside list-disc text-sm ${listClass}`}>
          {dresscode.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {dresscode.note && (
        <p className={`text-xs italic ${noteClass}`}>{dresscode.note}</p>
      )}
    </div>
  );
}

function AgendaItemCard({ item }: { item: EventAgendaItem }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{item.title}</CardTitle>
          <Badge variant={item.status === "confirmed" ? "success" : "warning"}>
            {item.status === "confirmed" ? "Confirmed" : "Detail Menyusul"}
          </Badge>
        </div>
        <CardDescription>
          {item.timeStart} – {item.timeEnd}
          {item.venue ? ` · ${item.venue}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}
        <DresscodeSection dresscode={item.dresscode} />
      </CardContent>
    </Card>
  );
}

export default function EventSchedulePage() {
  const { data: event, isLoading, isError, refetch } = useEventInfo();

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-4 sm:px-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Event Schedule
      </h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <Card className="border border-destructive/30">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <p className="flex-1 text-sm text-destructive">
              Gagal memuat jadwal acara.
            </p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {event && (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Day 1 · {event.day1.date}
              </h2>
              <Badge variant="outline">Info Only</Badge>
            </div>
            <Card className="overflow-hidden bg-linear-to-br from-secondary to-primary text-primary-foreground">
              <CardHeader>
                <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-white/20">
                  <Sparkles className="size-5" />
                </div>
                <CardTitle className="text-primary-foreground">
                  {event.day1.title}
                </CardTitle>
                <CardDescription className="text-primary-foreground/85">
                  {event.day1.time}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary-foreground/90">
                  {event.day1.description}
                </p>
                <DresscodeSection
                  dresscode={event.day1.dresscode}
                  variant="inverted"
                />
              </CardContent>
            </Card>

            {event.day1.agenda.length > 0 && (
              <div className="flex flex-col gap-3 pt-1">
                <h3 className="font-heading text-sm font-semibold text-muted-foreground">
                  Kegiatan Hari 1
                </h3>
                {event.day1.agenda.map((item) => (
                  <AgendaItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Day 2 · {event.day2.date}
            </h2>
            <Card className="overflow-hidden bg-linear-to-br from-primary to-secondary text-primary-foreground">
              <CardHeader>
                <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-white/20">
                  <Sun className="size-5" />
                </div>
                <CardTitle className="text-primary-foreground">
                  {event.day2.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary-foreground/90">
                  {event.day2.description}
                </p>
              </CardContent>
            </Card>

            {event.day2.agenda.length > 0 && (
              <div className="flex flex-col gap-3 pt-1">
                <h3 className="font-heading text-sm font-semibold text-muted-foreground">
                  Kegiatan Hari 2
                </h3>
                {event.day2.agenda.map((item) => (
                  <AgendaItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
