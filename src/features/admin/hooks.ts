"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authedFetch } from "@/lib/api-client";
import type { Activity } from "@/features/activities/types";
import type { EventInfo } from "@/features/event/types";
import type { UserProfile } from "@/features/auth/types";

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Activity, "id" | "quotaTaken">) => {
      const res = await authedFetch("/api/admin/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat aktivitas");
      return data as Activity;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Activity, "id">>;
    }) => {
      const res = await authedFetch(`/api/admin/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal memperbarui aktivitas");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authedFetch(`/api/admin/activities/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus aktivitas");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export interface AdminEmployee extends UserProfile {
  id: string;
  activityId: string | null;
  openMarks: string[];
}

export function useEmployees() {
  return useQuery({
    queryKey: ["admin", "employees"],
    queryFn: async (): Promise<AdminEmployee[]> => {
      const res = await authedFetch("/api/admin/employees");
      if (!res.ok) throw new Error("Gagal memuat data karyawan");
      return res.json();
    },
  });
}

export function useResetEmployeeSelection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uid: string) => {
      const res = await authedFetch(`/api/admin/employees/${uid}/reset-selection`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal reset pilihan");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] }),
  });
}

export function useUpdateEventInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (next: EventInfo) => {
      const res = await authedFetch("/api/admin/event", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("Gagal menyimpan jadwal");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event"] }),
  });
}
