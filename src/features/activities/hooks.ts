"use client";

import { useQuery } from "@tanstack/react-query";
import { authedFetch } from "@/lib/api-client";
import type { Activity } from "./types";

async function fetchActivities(): Promise<Activity[]> {
  const res = await authedFetch("/api/activities");
  if (!res.ok) throw new Error("Gagal memuat aktivitas");
  return res.json();
}

export function useActivities() {
  return useQuery({ queryKey: ["activities"], queryFn: fetchActivities });
}

async function fetchActivity(id: string): Promise<Activity> {
  const res = await authedFetch(`/api/activities/${id}`);
  if (!res.ok) throw new Error("Aktivitas tidak ditemukan");
  return res.json();
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ["activities", id],
    queryFn: () => fetchActivity(id),
    enabled: !!id,
  });
}
