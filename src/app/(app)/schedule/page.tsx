"use client";

import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
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
import type { Dresscode } from "@/features/event/types";

function DresscodeSection({
  dresscode,
  variant = "default",
}: {
  dresscode: Dresscode;
  variant?: "default" | "inverted";
}) {
  if (dresscode.male.length === 0 && dresscode.female.length === 0) {
    return null;
  }

  const isInverted = variant === "inverted";
  const borderClass = isInverted ? "border-white/20" : "border-border";
  const labelClass = isInverted
    ? "text-primary-foreground"
    : "text-foreground";
  const subLabelClass = isInverted
    ? "text-primary-foreground/70"
    : "text-muted-foreground";
  const listClass = isInverted
    ? "text-primary-foreground/90"
    : "text-muted-foreground";

  return (
    <div className={`mt-3 flex flex-col gap-2 border-t pt-3 ${borderClass}`}>
      <p className={`text-sm font-semibold ${labelClass}`}>Dresscode</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {dresscode.male.length > 0 && (
          <div>
            <p className={`text-xs font-medium ${subLabelClass}`}>
              Laki-Laki
            </p>
            <ul className={`list-inside list-disc text-sm ${listClass}`}>
              {dresscode.male.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {dresscode.female.length > 0 && (
          <div>
            <p className={`text-xs font-medium ${subLabelClass}`}>
              Perempuan
            </p>
            <ul className={`list-inside list-disc text-sm ${listClass}`}>
              {dresscode.female.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
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
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Day 2 · {event.day2.date}
            </h2>
            <div className="flex flex-col gap-3">
              {event.day2.agenda.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{item.title}</CardTitle>
                      <Badge variant={item.status === "confirmed" ? "success" : "warning"}>
                        {item.status === "confirmed" ? "Confirmed" : "Detail Menyusul"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {item.timeStart} – {item.timeEnd}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <DresscodeSection dresscode={item.dresscode} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
