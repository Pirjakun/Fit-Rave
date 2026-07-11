import { getFirebaseAuth } from "@/lib/firebase-client";

export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getFirebaseAuth().currentUser?.getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
