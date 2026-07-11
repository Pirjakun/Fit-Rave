"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivity } from "@/features/activities/hooks";
import { getActivityIcon } from "@/features/activities/icon-map";

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: activity, isLoading } = useActivity(id);

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-12 pb-4 text-center sm:px-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success"
      >
        <Check className="size-8" />
      </motion.div>

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Pilihan Berhasil Dikonfirmasi!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sampai jumpa di Fit Rave, jangan lupa datang tepat waktu.
        </p>
      </div>

      {isLoading || !activity ? (
        <Skeleton className="h-20 w-full max-w-sm rounded-xl" />
      ) : (
        <Card className="w-full max-w-sm">
          <CardContent className="flex items-center gap-3 py-4 text-left">
            {(() => {
              const Icon = getActivityIcon(activity.icon);
              return (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
                  <Icon className="size-5" />
                </div>
              );
            })()}
            <div>
              <p className="font-heading font-semibold text-foreground">
                {activity.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {activity.timeWindow} · {activity.location}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button size="lg" className="w-full max-w-sm" render={<Link href="/my-activities" />} nativeButton={false}>
        Lihat My Activities
      </Button>
    </div>
  );
}
