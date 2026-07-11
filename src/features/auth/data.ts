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

export async function listUserProfiles(): Promise<Array<UserProfile & { id: string }>> {
  const snapshot = await usersCollection().get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as UserProfile) }));
}
