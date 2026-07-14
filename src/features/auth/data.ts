import { getDb } from "@/lib/firebase-admin";
import type { UserProfile } from "./types";

const usersCollection = () => getDb().collection("users");

export async function getUserProfile(uid: string): Promise<UserProfile | undefined> {
  const doc = await usersCollection().doc(uid).get();
  return doc.exists ? (doc.data() as UserProfile) : undefined;
}

export async function createUserProfile(
  uid: string,
  profile: UserProfile,
): Promise<void> {
  await usersCollection().doc(uid).set(profile);
}

export async function updateUserName(uid: string, name: string): Promise<void> {
  await usersCollection().doc(uid).update({
    name,
    avatarInitial: name.charAt(0).toUpperCase() || "?",
  });
}

export async function ensureUserProfile(
  uid: string,
  defaults: UserProfile,
): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  if (existing) return existing;
  await usersCollection().doc(uid).set(defaults);
  return defaults;
}

export async function listUserProfiles(): Promise<Array<UserProfile & { id: string }>> {
  const snapshot = await usersCollection().get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as UserProfile) }));
}
