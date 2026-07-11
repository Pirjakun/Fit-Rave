import { getDb } from "@/lib/firebase-admin";
import type { Activity } from "./types";

const activitiesCollection = () => getDb().collection("activities");

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listActivities(): Promise<Activity[]> {
  const snapshot = await activitiesCollection().get();
  return snapshot.docs.map((doc) => doc.data() as Activity);
}

export async function findActivity(id: string): Promise<Activity | undefined> {
  const doc = await activitiesCollection().doc(id).get();
  return doc.exists ? (doc.data() as Activity) : undefined;
}

export async function createActivity(
  input: Omit<Activity, "id" | "quotaTaken">,
): Promise<Activity> {
  const id = slugify(input.name);
  const ref = activitiesCollection().doc(id);
  const existing = await ref.get();
  if (existing.exists) {
    throw new Error(`Aktivitas dengan id "${id}" sudah ada`);
  }
  const activity: Activity = { ...input, id, quotaTaken: 0 };
  await ref.set(activity);
  return activity;
}

export async function updateActivity(
  id: string,
  updates: Partial<Omit<Activity, "id">>,
): Promise<void> {
  await activitiesCollection().doc(id).update(updates);
}

export async function deleteActivity(id: string): Promise<void> {
  await activitiesCollection().doc(id).delete();
}
