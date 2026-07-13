"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActivities } from "@/features/activities/hooks";
import { useDeleteActivity } from "@/features/admin/hooks";
import type { Activity } from "@/features/activities/types";
import { ActivityFormDialog } from "./activity-form-dialog";

export default function AdminActivitiesPage() {
  const { data: activities, isLoading } = useActivities();
  const deleteActivity = useDeleteActivity();

  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  function openCreate() {
    setEditingActivity(null);
    setFormOpen(true);
  }

  function openEdit(activity: Activity) {
    setEditingActivity(activity);
    setFormOpen(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteActivity.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Aktivitas dihapus");
        setDeleteTarget(null);
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-foreground">Activities</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Tambah Activity
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && activities && (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Kuota</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>
                    <Badge variant={activity.category === "open" ? "secondary" : undefined}>
                      {activity.category === "open" ? "Bebas Ikut" : "Perlu Dipilih"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {activity.category === "segmented"
                      ? `${activity.quotaTaken}/${activity.quota}`
                      : "-"}
                  </TableCell>
                  <TableCell>{activity.coach || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(activity)}
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(activity)}
                        aria-label="Hapus"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ActivityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        activity={editingActivity}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tindakan ini tidak bisa dibatalkan. Karyawan yang sudah memilih aktivitas
            ini akan kehilangan pilihannya.
          </p>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteActivity.isPending}
            >
              {deleteActivity.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
