"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeftRight, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useActivity } from "@/features/activities/hooks";
import {
  useCancelSelection,
  useSelectActivity,
  useSelectionState,
  useToggleOpenMark,
} from "@/features/selection/hooks";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { employee } = useAuth();
  const employeeId = employee?.id ?? "";

  const { data: activity, isLoading, isError, refetch } = useActivity(id);
  const { data: selectionState } = useSelectionState(employeeId);
  const cancelSelection = useCancelSelection(employeeId);
  const toggleOpenMark = useToggleOpenMark(employeeId);
  const selectActivity = useSelectActivity(employeeId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const currentSelectionId = selectionState?.selection?.activityId;
  const { data: currentActivity } = useActivity(currentSelectionId ?? "");

  function handleConfirmSelect() {
    if (!activity) return;
    selectActivity.mutate(activity.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        router.push(`/explore/${activity.id}/confirm`);
      },
      onError: (error) => {
        toast.error(error.message || "Gagal menyimpan pilihan, coba lagi");
      },
    });
  }

  function handleConfirmCancel() {
    cancelSelection.mutate(undefined, {
      onSuccess: () => setCancelOpen(false),
      onError: () => toast.error("Gagal membatalkan pilihan"),
    });
  }

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

  const isOwnSelection = currentSelectionId === activity.id;
  const hasOtherSelection = !!currentSelectionId && !isOwnSelection;
  const isOpenMarked = selectionState?.openMarks.includes(activity.id) ?? false;
  const quotaFull =
    activity.category === "segmented" &&
    activity.quotaTaken >= (activity.quota ?? 0) &&
    !isOwnSelection;
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
          {activity.coach && (
            <div className="text-muted-foreground">Coach: {activity.coach}</div>
          )}
          {activity.president && (
            <div className="text-muted-foreground">
              Presiden Club: {activity.president.name}
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
      ) : isOwnSelection ? (
        <div className="flex flex-col gap-2">
          <Badge variant="success" className="w-fit">
            ✓ Aktivitas Terpilih
          </Badge>
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
            >
              Batalkan Pilihan
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Batalkan Pilihan?</DialogTitle>
                <DialogDescription>
                  Slot Anda di <strong>{activity.name}</strong> akan
                  dilepas dan bisa diambil karyawan lain.
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
                  onClick={handleConfirmCancel}
                >
                  {cancelSelection.isPending ? "Membatalkan..." : "Ya, Batalkan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Button size="lg" onClick={() => setConfirmOpen(true)}>
            {hasOtherSelection ? "Ganti ke Aktivitas Ini" : "Pilih Aktivitas Ini"}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Pilihan</DialogTitle>
              <DialogDescription>
                Setiap karyawan hanya dapat memilih satu aktivitas berkuota.
                Kamu bisa mengganti pilihan kapan saja selama kuota tujuan
                masih tersedia.
              </DialogDescription>
            </DialogHeader>

            <Card>
              <CardHeader>
                <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
                  <span className="text-lg leading-none">
                    {activity.icon || "🏷️"}
                  </span>
                </div>
                <CardTitle>{activity.name}</CardTitle>
                <CardDescription>
                  {activity.timeWindow} · {activity.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge>
                  {activity.quotaTaken}/{activity.quota} slot terisi
                </Badge>
              </CardContent>
            </Card>

            {hasOtherSelection && currentActivity && (
              <div className="flex items-start gap-3 rounded-xl bg-warning/10 p-4 text-sm text-warning">
                <ArrowLeftRight className="size-5 shrink-0" />
                <p>
                  Anda akan berpindah dari <strong>{currentActivity.name}</strong>{" "}
                  ke <strong>{activity.name}</strong>. Slot Anda di{" "}
                  {currentActivity.name} akan dilepas.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={selectActivity.isPending}
              >
                Batal
              </Button>
              <Button
                disabled={selectActivity.isPending}
                onClick={handleConfirmSelect}
              >
                {selectActivity.isPending ? "Menyimpan..." : "Konfirmasi Pilihan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
