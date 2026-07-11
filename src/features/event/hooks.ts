"use client";

import { useQuery } from "@tanstack/react-query";
import { authedFetch } from "@/lib/api-client";
import type { EventInfo } from "./types";

type EventResponse = EventInfo & { registrationDeadline: string };

async function fetchEvent(): Promise<EventResponse> {
  const res = await authedFetch("/api/event");
  if (!res.ok) throw new Error("Gagal memuat info acara");
  return res.json();
}

export function useEventInfo() {
  return useQuery({ queryKey: ["event"], queryFn: fetchEvent });
}
