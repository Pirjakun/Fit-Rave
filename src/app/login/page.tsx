"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Waves } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSignIn, useSignUp, useResetPassword } from "@/features/auth/hooks";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const resetPassword = useResetPassword();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const isPending = signIn.isPending || signUp.isPending;

  const nameError =
    touched && mode === "signup" && !name.trim() ? "Nama wajib diisi" : null;
  const emailError = touched && !email.trim() ? "Email wajib diisi" : null;
  const passwordError =
    touched && !password.trim() ? "Password wajib diisi" : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!email.trim() || !password.trim()) return;
    if (mode === "signup" && !name.trim()) return;

    const onError = (error: Error) => toast.error(error.message);
    const onSuccess = () => router.replace("/home");

    if (mode === "signup") {
      signUp.mutate({ name, email, password }, { onSuccess, onError });
    } else {
      signIn.mutate({ email, password }, { onSuccess, onError });
    }
  }

  function handleForgotPassword() {
    if (!email.trim()) {
      toast.error("Masukkan email dulu untuk reset password");
      return;
    }
    resetPassword.mutate(email, {
      onSuccess: () =>
        toast.success("Link reset password sudah dikirim ke email kamu"),
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col justify-center gap-8 bg-linear-to-b from-primary/25 via-secondary/10 to-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Waves className="size-7" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Mid Year Party
          </h1>
          <p className="text-sm text-muted-foreground">
            Masuk untuk memilih aktivitas olahraga kamu.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex flex-col gap-5"
        >
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as Mode);
              setTouched(false);
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">
                Masuk
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                Daftar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="cth. Dina Putri"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!nameError}
                />
                {nameError && (
                  <p className="text-sm text-destructive">{nameError}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="cth. dina@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!passwordError}
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>

            {mode === "signin" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="self-end text-sm font-medium text-primary"
              >
                Lupa password?
              </button>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="mt-2"
            >
              {isPending
                ? "Memproses..."
                : mode === "signup"
                  ? "Daftar"
                  : "Masuk"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
