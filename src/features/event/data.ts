import { getDb } from "@/lib/firebase-admin";
import type { EventInfo } from "./types";

const eventDoc = () => getDb().collection("event").doc("info");

export async function getEventInfo(): Promise<EventInfo> {
  const doc = await eventDoc().get();
  const data = doc.data() as EventInfo;
  return { ...data, scheduleVisible: data.scheduleVisible ?? true };
}

export async function updateEventInfo(next: EventInfo): Promise<void> {
  await eventDoc().set(next);
}
