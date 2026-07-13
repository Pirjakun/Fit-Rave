"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Waves } from "lucide-react";
import { useAuth } from "@/features/auth/context";

export default function SplashPage() {
  const { employee, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (!employee) router.replace("/login");
      else router.replace(role === "admin" ? "/admin" : "/home");
    }, 1200);
    return () => clearTimeout(timer);
  }, [isLoading, employee, role, router]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 bg-linear-to-b from-primary via-secondary to-background px-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex size-16 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur"
      >
        <Waves className="size-8" />
      </motion.div>
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      >
        <p className="font-heading text-2xl font-bold text-white">
          Fit Rave
        </p>
        <p className="text-sm text-white/80">Aktivitas Olahraga &amp; Wellbeing</p>
      </motion.div>
    </div>
  );
}
