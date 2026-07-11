import { getDb } from "@/lib/firebase-admin";
import type { EventInfo } from "./types";

const eventDoc = () => getDb().collection("event").doc("info");

export async function getEventInfo(): Promise<EventInfo> {
  const doc = await eventDoc().get();
  return doc.data() as EventInfo;
}

export async function updateEventInfo(next: EventInfo): Promise<void> {
  await eventDoc().set(next);
}

export const REGISTRATION_DEADLINE = new Date("2026-07-14T23:59:59+07:00");
