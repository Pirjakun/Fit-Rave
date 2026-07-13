"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEventInfo } from "@/features/event/hooks";
import { useUpdateEventInfo } from "@/features/admin/hooks";
import type { EventAgendaItem, EventInfo } from "@/features/event/types";

function toTextareaValue(items: string[]): string {
  return items.join("\n");
}

function fromTextareaValue(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

interface DresscodeText {
  items: string;
  note: string;
}

export default function AdminScheduleDayPage() {
  const { day: dayParam } = useParams<{ day: string }>();
  const day: "day1" | "day2" = dayParam === "day1" ? "day1" : "day2";

  const { data: eventInfo, isLoading } = useEventInfo();
  const updateEventInfo = useUpdateEventInfo();
  const [form, setForm] = useState<EventInfo | null>(null);
  const [day1Dresscode, setDay1Dresscode] = useState<DresscodeText>({
    items: "",
    note: "",
  });
  const [agendaDresscode, setAgendaDresscode] = useState<
    Record<string, DresscodeText>
  >({});
  const [deleteTarget, setDeleteTarget] = useState<EventAgendaItem | null>(null);
  const [syncedEventInfo, setSyncedEventInfo] = useState<EventInfo | undefined>(
    undefined,
  );

  if (eventInfo && eventInfo !== syncedEventInfo) {
    setSyncedEventInfo(eventInfo);
    setForm({ day1: eventInfo.day1, day2: eventInfo.day2 });
    setDay1Dresscode({
      items: toTextareaValue(eventInfo.day1.dresscode.items),
      note: eventInfo.day1.dresscode.note,
    });
    setAgendaDresscode(
      Object.fromEntries(
        [...eventInfo.day1.agenda, ...eventInfo.day2.agenda].map((item) => [
          item.id,
          {
            items: toTextareaValue(item.dresscode.items),
            note: item.dresscode.note,
          },
        ]),
      ),
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;

    const payload: EventInfo = {
      day1: {
        ...form.day1,
        dresscode: {
          items: fromTextareaValue(day1Dresscode.items),
          note: day1Dresscode.note,
        },
        agenda: form.day1.agenda.map((item) => ({
          ...item,
          dresscode: {
            items: fromTextareaValue(agendaDresscode[item.id]?.items ?? ""),
            note: agendaDresscode[item.id]?.note ?? "",
          },
        })),
      },
      day2: {
        ...form.day2,
        agenda: form.day2.agenda.map((item) => ({
          ...item,
          dresscode: {
            items: fromTextareaValue(agendaDresscode[item.id]?.items ?? ""),
            note: agendaDresscode[item.id]?.note ?? "",
          },
        })),
      },
    };

    updateEventInfo.mutate(payload, {
      onSuccess: () => toast.success("Jadwal disimpan"),
      onError: (error) => toast.error(error.message),
    });
  }

  function confirmDelete() {
    if (!deleteTarget || !form) return;
    const agenda = form[day].agenda.filter((i) => i.id !== deleteTarget.id);
    setForm({ ...form, [day]: { ...form[day], agenda } });
    setDeleteTarget(null);
  }

  if (isLoading || !form) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const agenda = form[day].agenda;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Link
        href="/admin/schedule"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Kembali ke Schedule
      </Link>
      <h1 className="font-heading text-xl font-bold text-foreground">
        {day === "day1" ? "Day 1" : "Day 2"}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Info Hari</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${day}-title`}>Judul</Label>
            <Input
              id={`${day}-title`}
              value={form[day].title}
              onChange={(e) =>
                setForm({ ...form, [day]: { ...form[day], title: e.target.value } })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${day}-description`}>Deskripsi</Label>
            <Input
              id={`${day}-description`}
              value={form[day].description}
              onChange={(e) =>
                setForm({
                  ...form,
                  [day]: { ...form[day], description: e.target.value },
                })
              }
            />
          </div>

          {day === "day1" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="day1-dresscode">Dresscode</Label>
                <Textarea
                  id="day1-dresscode"
                  value={day1Dresscode.items}
                  onChange={(e) =>
                    setDay1Dresscode({ ...day1Dresscode, items: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="day1-dresscode-note">Catatan (opsional)</Label>
                <Input
                  id="day1-dresscode-note"
                  value={day1Dresscode.note}
                  onChange={(e) =>
                    setDay1Dresscode({ ...day1Dresscode, note: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${day}-date`}>Tanggal</Label>
              <Input
                id={`${day}-date`}
                value={form[day].date}
                onChange={(e) =>
                  setForm({ ...form, [day]: { ...form[day], date: e.target.value } })
                }
              />
            </div>
            {day === "day1" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="day1-time">Waktu</Label>
                <Input
                  id="day1-time"
                  value={form.day1.time}
                  onChange={(e) =>
                    setForm({ ...form, day1: { ...form.day1, time: e.target.value } })
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {agenda.map((item, index) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{item.title || "Kegiatan Baru"}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(item)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${item.id}-title`}>Judul</Label>
              <Input
                id={`${item.id}-title`}
                value={item.title}
                onChange={(e) => {
                  const nextAgenda = [...agenda];
                  nextAgenda[index] = { ...item, title: e.target.value };
                  setForm({ ...form, [day]: { ...form[day], agenda: nextAgenda } });
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${item.id}-start`}>Mulai</Label>
                <Input
                  id={`${item.id}-start`}
                  value={item.timeStart}
                  onChange={(e) => {
                    const nextAgenda = [...agenda];
                    nextAgenda[index] = { ...item, timeStart: e.target.value };
                    setForm({ ...form, [day]: { ...form[day], agenda: nextAgenda } });
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${item.id}-end`}>Selesai</Label>
                <Input
                  id={`${item.id}-end`}
                  value={item.timeEnd}
                  onChange={(e) => {
                    const nextAgenda = [...agenda];
                    nextAgenda[index] = { ...item, timeEnd: e.target.value };
                    setForm({ ...form, [day]: { ...form[day], agenda: nextAgenda } });
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${item.id}-venue`}>Venue</Label>
              <Input
                id={`${item.id}-venue`}
                value={item.venue}
                onChange={(e) => {
                  const nextAgenda = [...agenda];
                  nextAgenda[index] = { ...item, venue: e.target.value };
                  setForm({ ...form, [day]: { ...form[day], agenda: nextAgenda } });
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Tabs
                value={item.status}
                onValueChange={(v) => {
                  const nextAgenda = [...agenda];
                  nextAgenda[index] = { ...item, status: v as "confirmed" | "tbu" };
                  setForm({ ...form, [day]: { ...form[day], agenda: nextAgenda } });
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="confirmed" className="flex-1">
                    Confirmed
                  </TabsTrigger>
                  <TabsTrigger value="tbu" className="flex-1">
                    TBU
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${item.id}-description`}>Deskripsi</Label>
              <Input
                id={`${item.id}-description`}
                value={item.description}
                onChange={(e) => {
                  const nextAgenda = [...agenda];
                  nextAgenda[index] = { ...item, description: e.target.value };
                  setForm({ ...form, [day]: { ...form[day], agenda: nextAgenda } });
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${item.id}-dresscode`}>Dresscode</Label>
              <Textarea
                id={`${item.id}-dresscode`}
                value={agendaDresscode[item.id]?.items ?? ""}
                onChange={(e) =>
                  setAgendaDresscode({
                    ...agendaDresscode,
                    [item.id]: {
                      note: agendaDresscode[item.id]?.note ?? "",
                      items: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${item.id}-dresscode-note`}>
                Catatan (opsional)
              </Label>
              <Input
                id={`${item.id}-dresscode-note`}
                value={agendaDresscode[item.id]?.note ?? ""}
                onChange={(e) =>
                  setAgendaDresscode({
                    ...agendaDresscode,
                    [item.id]: {
                      items: agendaDresscode[item.id]?.items ?? "",
                      note: e.target.value,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const newItem: EventAgendaItem = {
            id: crypto.randomUUID(),
            title: "",
            timeStart: "",
            timeEnd: "",
            venue: "",
            status: "tbu",
            description: "",
            dresscode: { items: [], note: "" },
          };
          setForm({
            ...form,
            [day]: { ...form[day], agenda: [...agenda, newItem] },
          });
          setAgendaDresscode({
            ...agendaDresscode,
            [newItem.id]: { items: "", note: "" },
          });
        }}
      >
        <Plus className="size-4" />
        Tambah Kegiatan
      </Button>

      <Button type="submit" size="lg" disabled={updateEventInfo.isPending}>
        {updateEventInfo.isPending ? "Menyimpan..." : "Simpan Jadwal"}
      </Button>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus kegiatan &quot;{deleteTarget?.title}&quot;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Kegiatan ini akan dihapus dari jadwal. Perubahan baru tersimpan
            setelah Anda klik Simpan.
          </p>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
