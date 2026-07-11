"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { authedFetch } from "@/lib/api-client";
import type { Employee, UserRole } from "./types";

interface AuthContextValue {
  employee: Employee | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Right after sign-up, the /api/auth/register write and this profile read can
// race — retry for a while so a freshly created profile doc has time to land.
async function fetchProfileWithRetry(attempts = 8, delayMs = 400) {
  for (let i = 0; i < attempts; i++) {
    const res = await authedFetch("/api/me");
    if (res.ok) return res.json();
    if (res.status !== 404 || i === attempts - 1) {
      throw new Error("Profil tidak ditemukan");
    }
    await sleep(delayMs);
  }
  throw new Error("Profil tidak ditemukan");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfile(uid: string) {
    try {
      const profile = await fetchProfileWithRetry();
      setEmployee({
        id: uid,
        name: profile.name,
        email: profile.email,
        avatarInitial: profile.avatarInitial,
      });
      setRole(profile.role);
    } catch {
      setEmployee(null);
      setRole(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      // Reset to loading on every callback, not just the initial mount: the
      // first call (no persisted session) already flips isLoading false, so
      // without this, layout guards read stale employee=null and bounce a
      // freshly-signed-in user straight back to /login before loadProfile
      // resolves.
      setIsLoading(true);
      if (!user) {
        setEmployee(null);
        setRole(null);
        setIsLoading(false);
        return;
      }

      await loadProfile(user.uid);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth());
  }

  async function refreshProfile() {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    await loadProfile(user.uid);
  }

  return (
    <AuthContext.Provider
      value={{ employee, role, isLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
