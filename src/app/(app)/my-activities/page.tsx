"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardList, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/context";
import { useActivities } from "@/features/activities/hooks";
import { useCancelSelection, useSelectionState } from "@/features/selection/hooks";

export default function MyActivitiesPage() {
  const { employee } = useAuth();
  const employeeId = employee?.id ?? "";

  const {
    data: activities,
    isLoading: activitiesLoading,
    isError: activitiesError,
    refetch: refetchActivities,
  } = useActivities();
  const {
    data: selectionState,
    isLoading: selectionLoading,
    isError: selectionError,
    refetch: refetchSelection,
  } = useSelectionState(employeeId);
  const cancelSelection = useCancelSelection(employeeId);
  const [cancelOpen, setCancelOpen] = useState(false);

  const isLoading = activitiesLoading || selectionLoading;
  const isError = activitiesError || selectionError;

  const selectedActivity = activities?.find(
    (a) => a.id === selectionState?.selection?.activityId,
  );
  const openActivities = (activities ?? []).filter((a) =>
    selectionState?.openMarks.includes(a.id),
  );

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-4 sm:px-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        My Activities
      </h1>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <Card className="border border-destructive/30">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <p className="flex-1 text-sm text-destructive">
              Gagal memuat data.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                refetchActivities();
                refetchSelection();
              }}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Aktivitas Segmented
            </h2>
            {selectedActivity ? (
              <>
                <SelectedActivityCard
                  activity={selectedActivity}
                  onCancel={() => setCancelOpen(true)}
                  isCancelling={cancelSelection.isPending}
                />
                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Batalkan Pilihan?</DialogTitle>
                      <DialogDescription>
                        Slot Anda di <strong>{selectedActivity.name}</strong>{" "}
                        akan dilepas dan bisa diambil karyawan lain.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCancelOpen(false)}
                        disabled={cancelSelection.isPending}
                      >
                        Batal
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={cancelSelection.isPending}
                        onClick={() =>
                          cancelSelection.mutate(undefined, {
                            onSuccess: () => setCancelOpen(false),
                            onError: () =>
                              toast.error("Gagal membatalkan pilihan"),
                          })
                        }
                      >
                        {cancelSelection.isPending
                          ? "Membatalkan..."
                          : "Ya, Batalkan"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <ClipboardList className="size-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Belum ada aktivitas yang dipilih
                  </p>
                  <Button size="sm" nativeButton={false} render={<Link href="/explore" />}>
                    Explore Aktivitas
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Open Activities yang Anda Tandai
            </h2>
            {openActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada open activity yang ditandai. Tandai dari halaman
                Explore.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {openActivities.map((activity) => {
                  return (
                    <Card key={activity.id}>
                      <CardContent className="flex items-center gap-3 py-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
                          <span className="text-lg leading-none">{activity.icon || "🏷️"}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-heading font-semibold text-foreground">
                            {activity.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.timeWindow} · {activity.location}
                          </p>
                        </div>
                        <Badge variant="secondary">Bebas Ikut</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SelectedActivityCard({
  activity,
  onCancel,
  isCancelling,
}: {
  activity: NonNullable<ReturnType<typeof useActivities>["data"]>[number];
  onCancel: () => void;
  isCancelling: boolean;
}) {
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
        <CardAction>
          <Badge variant="success">✓ Aktivitas Terpilih</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          nativeButton={false}
          render={<Link href={`/explore/${activity.id}`} />}
        >
          Ganti Aktivitas
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1"
          disabled={isCancelling}
          onClick={onCancel}
        >
          Batalkan
        </Button>
      </CardContent>
    </Card>
  );
}
