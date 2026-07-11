"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEventInfo } from "@/features/event/hooks";
import { useUpdateEventInfo } from "@/features/admin/hooks";
import type { EventInfo } from "@/features/event/types";

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

export default function AdminSchedulePage() {
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

  useEffect(() => {
    if (eventInfo) {
      setForm({ day1: eventInfo.day1, day2: eventInfo.day2 });
      setDay1Dresscode({
        items: toTextareaValue(eventInfo.day1.dresscode.items),
        note: eventInfo.day1.dresscode.note,
      });
      setAgendaDresscode(
        Object.fromEntries(
          eventInfo.day2.agenda.map((item) => [
            item.id,
            {
              items: toTextareaValue(item.dresscode.items),
              note: item.dresscode.note,
            },
          ]),
        ),
      );
    }
  }, [eventInfo]);

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

  if (isLoading || !form) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-bold text-foreground">Schedule</h1>

      <Card>
        <CardHeader>
          <CardTitle>Day 1</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="day1-title">Judul</Label>
            <Input
              id="day1-title"
              value={form.day1.title}
              onChange={(e) =>
                setForm({ ...form, day1: { ...form.day1, title: e.target.value } })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="day1-description">Deskripsi</Label>
            <Input
              id="day1-description"
              value={form.day1.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  day1: { ...form.day1, description: e.target.value },
                })
              }
            />
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="day1-date">Tanggal</Label>
              <Input
                id="day1-date"
                value={form.day1.date}
                onChange={(e) =>
                  setForm({ ...form, day1: { ...form.day1, date: e.target.value } })
                }
              />
            </div>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Day 2</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="day2-title">Judul</Label>
            <Input
              id="day2-title"
              value={form.day2.title}
              onChange={(e) =>
                setForm({ ...form, day2: { ...form.day2, title: e.target.value } })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="day2-description">Deskripsi</Label>
            <Input
              id="day2-description"
              value={form.day2.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  day2: { ...form.day2, description: e.target.value },
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="day2-date">Tanggal</Label>
            <Input
              id="day2-date"
              value={form.day2.date}
              onChange={(e) =>
                setForm({ ...form, day2: { ...form.day2, date: e.target.value } })
              }
            />
          </div>
        </CardContent>
      </Card>

      {form.day2.agenda.map((item, index) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${item.id}-title`}>Judul</Label>
              <Input
                id={`${item.id}-title`}
                value={item.title}
                onChange={(e) => {
                  const agenda = [...form.day2.agenda];
                  agenda[index] = { ...item, title: e.target.value };
                  setForm({ ...form, day2: { ...form.day2, agenda } });
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
                    const agenda = [...form.day2.agenda];
                    agenda[index] = { ...item, timeStart: e.target.value };
                    setForm({ ...form, day2: { ...form.day2, agenda } });
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${item.id}-end`}>Selesai</Label>
                <Input
                  id={`${item.id}-end`}
                  value={item.timeEnd}
                  onChange={(e) => {
                    const agenda = [...form.day2.agenda];
                    agenda[index] = { ...item, timeEnd: e.target.value };
                    setForm({ ...form, day2: { ...form.day2, agenda } });
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Tabs
                value={item.status}
                onValueChange={(v) => {
                  const agenda = [...form.day2.agenda];
                  agenda[index] = { ...item, status: v as "confirmed" | "tbu" };
                  setForm({ ...form, day2: { ...form.day2, agenda } });
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
                  const agenda = [...form.day2.agenda];
                  agenda[index] = { ...item, description: e.target.value };
                  setForm({ ...form, day2: { ...form.day2, agenda } });
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

      <Button type="submit" size="lg" disabled={updateEventInfo.isPending}>
        {updateEventInfo.isPending ? "Menyimpan..." : "Simpan Jadwal"}
      </Button>
    </form>
  );
}
