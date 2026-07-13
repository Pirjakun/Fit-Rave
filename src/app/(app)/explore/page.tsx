"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/context";
import { useActivities } from "@/features/activities/hooks";
import { useSelectionState } from "@/features/selection/hooks";
import type { Activity } from "@/features/activities/types";

type Filter = "all" | "segmented" | "open";

function ActivityStatusBadge({
  activity,
  isSelected,
}: {
  activity: Activity;
  isSelected: boolean;
}) {
  if (isSelected) return <Badge variant="success">✓ Aktivitas Terpilih</Badge>;
  if (activity.category === "open")
    return <Badge variant="secondary">Bebas Ikut</Badge>;

  const quota = activity.quota ?? 0;
  if (activity.quotaTaken >= quota)
    return <Badge variant="destructive">Kuota Penuh</Badge>;
  if (quota > 0 && activity.quotaTaken / quota >= 0.8)
    return <Badge variant="urgent">Kuota Hampir Penuh</Badge>;
  return <Badge>Perlu Dipilih</Badge>;
}

export default function ExplorePage() {
  const { employee } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const { data: activities, isLoading, isError, refetch } = useActivities();
  const { data: selectionState } = useSelectionState(employee?.id ?? "");
  const selectedActivityId = selectionState?.selection?.activityId;

  const filtered = (activities ?? []).filter((activity) =>
    filter === "all" ? true : activity.category === filter,
  );

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4 sm:px-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Explore Activities
        </h1>
        <p className="text-sm text-muted-foreground">
          Aktivitas Fit Rave — pilih yang berkuota, ikut bebas yang lainnya.
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            Semua
          </TabsTrigger>
          <TabsTrigger value="segmented" className="flex-1">
            Perlu Dipilih
          </TabsTrigger>
          <TabsTrigger value="open" className="flex-1">
            Bebas Ikut
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="mb-1 size-11 rounded-xl" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card className="border border-destructive/30">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <p className="flex-1 text-sm text-destructive">
              Gagal memuat aktivitas.
            </p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-3">
          {filtered.map((activity) => {
            const isSelected = activity.id === selectedActivityId;
            return (
              <Link key={activity.id} href={`/explore/${activity.id}`}>
                <Card className={isSelected ? "ring-2 ring-primary" : undefined}>
                  <CardHeader>
                    <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
                      <span className="text-lg leading-none">{activity.icon || "🏷️"}</span>
                    </div>
                    <CardTitle>{activity.name}</CardTitle>
                    <CardDescription>
                      {activity.timeWindow} · {activity.location}
                      {activity.category === "segmented" &&
                        ` · ${activity.quotaTaken}/${activity.quota} slot`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ActivityStatusBadge activity={activity} isSelected={isSelected} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
