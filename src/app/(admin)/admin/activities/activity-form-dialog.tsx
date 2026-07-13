"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateActivity, useUpdateActivity } from "@/features/admin/hooks";
import type { Activity, ActivityCategory } from "@/features/activities/types";

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
}

const EMPTY_FORM = {
  name: "",
  category: "segmented" as ActivityCategory,
  description: "",
  icon: "",
  location: "",
  timeWindow: "Fit Rave · 07.30 - 10.00",
  quota: "",
  tags: "",
  coach: "",
};

export function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
}: ActivityFormDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [syncedKey, setSyncedKey] = useState({ open, activity });
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const isPending = createActivity.isPending || updateActivity.isPending;
  const isEditing = !!activity;

  if (syncedKey.open !== open || syncedKey.activity !== activity) {
    setSyncedKey({ open, activity });
    if (open) {
      setForm(
        activity
          ? {
              name: activity.name,
              category: activity.category,
              description: activity.description,
              icon: activity.icon,
              location: activity.location,
              timeWindow: activity.timeWindow,
              quota: activity.quota?.toString() ?? "",
              tags: activity.tags.join(", "),
              coach: activity.coach ?? "",
            }
          : EMPTY_FORM,
      );
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      icon: form.icon.trim() || "🏷️",
      location: form.location.trim(),
      day: 2 as const,
      timeWindow: form.timeWindow.trim(),
      quota: form.category === "segmented" ? Number(form.quota) || 0 : null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      coach: form.coach.trim(),
    };

    if (isEditing) {
      updateActivity.mutate(
        { id: activity.id, updates: payload },
        {
          onSuccess: () => {
            toast.success("Aktivitas diperbarui");
            onOpenChange(false);
          },
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      createActivity.mutate(payload, {
        onSuccess: () => {
          toast.success("Aktivitas dibuat");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Activity" : "Tambah Activity"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Kategori</Label>
            <Tabs
              value={form.category}
              onValueChange={(v) =>
                setForm({ ...form, category: v as ActivityCategory })
              }
            >
              <TabsList className="w-full">
                <TabsTrigger value="segmented" className="flex-1">
                  Perlu Dipilih
                </TabsTrigger>
                <TabsTrigger value="open" className="flex-1">
                  Bebas Ikut
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="icon">Icon (emoji)</Label>
            <Input
              id="icon"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="🏃"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Lokasi</Label>
            <Input
              id="location"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="timeWindow">Waktu</Label>
            <Input
              id="timeWindow"
              required
              value={form.timeWindow}
              onChange={(e) => setForm({ ...form, timeWindow: e.target.value })}
            />
          </div>

          {form.category === "segmented" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quota">Kuota</Label>
              <Input
                id="quota"
                type="number"
                min={0}
                required
                value={form.quota}
                onChange={(e) => setForm({ ...form, quota: e.target.value })}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coach">Coach (opsional)</Label>
            <Input
              id="coach"
              value={form.coach}
              onChange={(e) => setForm({ ...form, coach: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="outdoor, cardio"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
