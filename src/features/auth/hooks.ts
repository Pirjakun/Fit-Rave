"use client";

import { useMutation } from "@tanstack/react-query";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { authedFetch } from "@/lib/api-client";
import { mapFirebaseAuthError } from "./errors";

export function useSignUp() {
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string }) => {
      try {
        await createUserWithEmailAndPassword(getFirebaseAuth(), input.email, input.password);
      } catch (error) {
        throw new Error(mapFirebaseAuthError(error));
      }

      const res = await authedFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input.name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mendaftar, coba lagi");
      }
    },
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      try {
        await signInWithEmailAndPassword(getFirebaseAuth(), input.email, input.password);
      } catch (error) {
        throw new Error(mapFirebaseAuthError(error));
      }
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      try {
        await sendPasswordResetEmail(getFirebaseAuth(), email);
      } catch (error) {
        throw new Error(mapFirebaseAuthError(error));
      }
    },
  });
}
