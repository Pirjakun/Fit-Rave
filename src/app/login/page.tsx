"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSignIn,
  useSignUp,
  useResetPassword,
  useGoogleSignIn,
} from "@/features/auth/hooks";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const resetPassword = useResetPassword();
  const googleSignIn = useGoogleSignIn();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  function handleGoogleSignIn() {
    googleSignIn.mutate(undefined, {
      onSuccess: () => router.replace("/home"),
      onError: (error) => toast.error(error.message),
    });
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
    <div className="flex min-h-dvh flex-1 flex-col justify-center gap-8 bg-linear-to-b from-primary via-secondary to-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-white/20 backdrop-blur">
            <Image
              src="/werkudara-logo.png"
              alt="Werkudara Group"
              width={56}
              height={56}
              className="size-full object-cover"
              priority
            />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">
            Mid Year 2026
          </h1>
          <p className="text-sm text-white/80">
            Move. Reconnect. Scaling Impact.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="flex flex-col gap-5 rounded-3xl bg-white/10 p-6 shadow-xl ring-1 ring-white/25 backdrop-blur-xl"
        >
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as Mode);
              setTouched(false);
            }}
          >
            <TabsList className="w-full bg-white/10">
              <TabsTrigger
                value="signin"
                className="flex-1 text-white/70 hover:text-white data-active:text-foreground"
              >
                Masuk
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="flex-1 text-white/70 hover:text-white data-active:text-foreground"
              >
                Daftar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-white/90">
                  Nama
                </Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="cth. Dina Putri"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!nameError}
                  className="bg-white/90 border-white/40"
                />
                {nameError && (
                  <p className="text-sm font-medium text-destructive">{nameError}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-white/90">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="cth. dina@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                className="bg-white/90 border-white/40"
              />
              {emailError && (
                <p className="text-sm font-medium text-destructive">{emailError}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-white/90">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!passwordError}
                  className="bg-white/90 border-white/40 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm font-medium text-destructive">{passwordError}</p>
              )}
            </div>

            {mode === "signin" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="self-end text-sm font-medium text-white underline-offset-4 hover:underline"
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

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/25" />
            <span className="text-xs text-white/70">atau</span>
            <div className="h-px flex-1 bg-white/25" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={googleSignIn.isPending}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            {googleSignIn.isPending ? "Memproses..." : "Lanjutkan dengan Google"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
