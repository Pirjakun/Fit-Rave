"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/context";
import { useActivity } from "@/features/activities/hooks";
import {
  useCancelSelection,
  useSelectionState,
  useToggleOpenMark,
} from "@/features/selection/hooks";
import { useEventInfo } from "@/features/event/hooks";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { employee } = useAuth();
  const employeeId = employee?.id ?? "";

  const { data: activity, isLoading, isError, refetch } = useActivity(id);
  const { data: selectionState } = useSelectionState(employeeId);
  const { data: event } = useEventInfo();
  const cancelSelection = useCancelSelection(employeeId);
  const toggleOpenMark = useToggleOpenMark(employeeId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-6 pb-4 sm:px-6">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !activity) {
    return (
      <div className="px-4 pt-6 sm:px-6">
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
      </div>
    );
  }

  const currentSelectionId = selectionState?.selection?.activityId;
  const isOwnSelection = currentSelectionId === activity.id;
  const hasOtherSelection = !!currentSelectionId && !isOwnSelection;
  const isOpenMarked = selectionState?.openMarks.includes(activity.id) ?? false;
  const quotaFull =
    activity.category === "segmented" &&
    activity.quotaTaken >= (activity.quota ?? 0) &&
    !isOwnSelection;
  const deadlinePassed = event ? new Date() > new Date(event.registrationDeadline) : false;

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-4 sm:px-6">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-highlight text-highlight-foreground">
        <span className="text-2xl leading-none">{activity.icon || "🏷️"}</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {activity.name}
          </h1>
          {activity.category === "open" ? (
            <Badge variant="secondary">Bebas Ikut</Badge>
          ) : (
            <Badge>Perlu Dipilih</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 py-4 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="size-4 text-secondary" />
            {activity.location}
          </div>
          <div className="text-muted-foreground">{activity.timeWindow}</div>
          {activity.category === "segmented" && (
            <div className="text-muted-foreground">
              {activity.quotaTaken}/{activity.quota} slot terisi
            </div>
          )}
        </CardContent>
      </Card>

      {activity.category === "open" ? (
        <Button
          size="lg"
          variant={isOpenMarked ? "secondary" : "default"}
          disabled={toggleOpenMark.isPending}
          onClick={() =>
            toggleOpenMark.mutate(
              { activityId: activity.id, marked: !isOpenMarked },
              {
                onError: () => toast.error("Gagal memperbarui status, coba lagi"),
              },
            )
          }
        >
          {isOpenMarked ? "✓ Ditandai Ikut" : "Tandai Ikut"}
        </Button>
      ) : deadlinePassed ? (
        <div className="flex flex-col gap-2">
          <Badge variant="warning" className="w-fit">
            Pendaftaran Ditutup
          </Badge>
          <p className="text-sm text-muted-foreground">
            Pendaftaran ditutup pada{" "}
            {event && new Date(event.registrationDeadline).toLocaleString("id-ID")}
            .
          </p>
        </div>
      ) : isOwnSelection ? (
        <div className="flex flex-col gap-2">
          <Badge variant="success" className="w-fit">
            ✓ Aktivitas Terpilih
          </Badge>
          <Button
            variant="destructive"
            disabled={cancelSelection.isPending}
            onClick={() =>
              cancelSelection.mutate(undefined, {
                onError: () => toast.error("Gagal membatalkan pilihan"),
              })
            }
          >
            Batalkan Pilihan
          </Button>
        </div>
      ) : quotaFull ? (
        <div className="flex flex-col gap-2">
          <Badge variant="destructive" className="w-fit">
            Kuota Penuh
          </Badge>
          <Button size="lg" disabled>
            Kuota Penuh
          </Button>
        </div>
      ) : (
        <Button size="lg" render={<Link href={`/explore/${activity.id}/choose`} />} nativeButton={false}>
          {hasOtherSelection ? "Ganti ke Aktivitas Ini" : "Pilih Aktivitas Ini"}
        </Button>
      )}
    </div>
  );
}
