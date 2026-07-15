"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeftRight } from "lucide-react";
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
import { useAuth } from "@/features/auth/context";
import { useActivity } from "@/features/activities/hooks";
import { useSelectActivity, useSelectionState } from "@/features/selection/hooks";

export default function ChooseActivityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { employee } = useAuth();
  const employeeId = employee?.id ?? "";

  const { data: activity, isLoading } = useActivity(id);
  const { data: selectionState } = useSelectionState(employeeId);
  const currentActivityId = selectionState?.selection?.activityId;
  const { data: currentActivity } = useActivity(currentActivityId ?? "");
  const selectActivity = useSelectActivity(employeeId);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading || !activity) {
    return (
      <div className="flex flex-col gap-4 px-4 pt-6 pb-4 sm:px-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const isSwitching = !!currentActivityId && currentActivityId !== activity.id;

  function handleConfirm() {
    setErrorMessage(null);
    selectActivity.mutate(activity!.id, {
      onSuccess: () => router.push(`/explore/${activity!.id}/confirm`),
      onError: (error) => {
        setErrorMessage(error.message || "Gagal menyimpan pilihan, coba lagi");
      },
    });
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-4 sm:px-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Konfirmasi Pilihan
      </h1>

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
          <Badge>{activity.quotaTaken}/{activity.quota} slot terisi</Badge>
        </CardContent>
      </Card>

      {isSwitching && currentActivity && (
        <div className="flex items-start gap-3 rounded-xl bg-warning/10 p-4 text-sm text-warning">
          <ArrowLeftRight className="size-5 shrink-0" />
          <p>
            Anda akan berpindah dari <strong>{currentActivity.name}</strong>{" "}
            ke <strong>{activity.name}</strong>. Slot Anda di{" "}
            {currentActivity.name} akan dilepas.
          </p>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Setiap karyawan hanya dapat memilih satu aktivitas berkuota. Kamu bisa
        mengganti pilihan kapan saja selama kuota tujuan masih tersedia.
      </p>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="size-5 shrink-0" />
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}

      <Button size="lg" disabled={selectActivity.isPending} onClick={handleConfirm}>
        {selectActivity.isPending ? "Menyimpan..." : "Konfirmasi Pilihan"}
      </Button>
    </div>
  );
}
