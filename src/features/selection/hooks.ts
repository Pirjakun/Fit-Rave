"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authedFetch } from "@/lib/api-client";
import type { SelectionState } from "./types";

async function fetchSelectionState(): Promise<SelectionState> {
  const res = await authedFetch("/api/selection");
  if (!res.ok) throw new Error("Gagal memuat status pilihan");
  return res.json();
}

export function useSelectionState(employeeId: string) {
  return useQuery({
    queryKey: ["selection", employeeId],
    queryFn: fetchSelectionState,
    enabled: !!employeeId,
  });
}

export function useSelectActivity(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string) => {
      const res = await authedFetch("/api/selection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.error), { code: data.code });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["selection", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useCancelSelection(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await authedFetch("/api/selection", { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal membatalkan pilihan");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["selection", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useToggleOpenMark(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      activityId,
      marked,
    }: {
      activityId: string;
      marked: boolean;
    }) => {
      const res = await authedFetch("/api/selection/open", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, marked }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["selection", employeeId] });
    },
  });
}
