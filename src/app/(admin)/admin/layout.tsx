"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { LogOut, ListChecks, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context";

const NAV_ITEMS = [
  { href: "/admin/activities", label: "Activities", icon: ListChecks },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { employee, role, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!employee) router.replace("/login");
    else if (role !== "admin") router.replace("/home");
  }, [isLoading, employee, role, router]);

  if (isLoading || !employee || role !== "admin") return null;

  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-primary/15 via-background to-background">
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col gap-4 border-b border-border/60 bg-background/60 px-4 py-4 backdrop-blur sm:px-6"
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div>
            <p className="font-heading text-lg font-bold text-foreground">
              Admin Dashboard
            </p>
            <p className="text-xs text-muted-foreground">Fit Rave</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
            aria-label="Keluar"
          >
            <LogOut className="size-4" />
          </Button>
        </div>

        <nav className="mx-auto flex w-full max-w-5xl gap-1 sm:justify-start">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex-1 sm:flex-initial">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </motion.header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 px-4 py-6 sm:px-6"
      >
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </motion.main>
    </div>
  );
}
