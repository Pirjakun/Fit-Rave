"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventInfo } from "@/features/event/hooks";

export default function AdminSchedulePage() {
  const { data: event, isLoading } = useEventInfo();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-bold text-foreground">Schedule</h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {event && (
        <div className="flex flex-col gap-3">
          <Link href="/admin/schedule/day1">
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Day 1 · {event.day1.title}</CardTitle>
                  <Badge variant="secondary">{event.day1.agenda.length} kegiatan</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{event.day1.date}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/schedule/day2">
            <Card className="cursor-pointer transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Day 2 · {event.day2.title}</CardTitle>
                  <Badge variant="secondary">{event.day2.agenda.length} kegiatan</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{event.day2.date}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
