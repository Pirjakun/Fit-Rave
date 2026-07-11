"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, HelpCircle, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth/context";

export default function ProfilePage() {
  const { employee, signOut } = useAuth();
  const router = useRouter();

  if (!employee) return null;

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-4 sm:px-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Profil
      </h1>

      <Card>
        <CardContent className="flex items-center gap-3 py-5">
          <Avatar size="lg">
            <AvatarFallback>{employee.avatarInitial}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-heading font-semibold text-foreground">
              {employee.name}
            </p>
            <p className="text-sm text-muted-foreground">{employee.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col py-1">
          <Link
            href="/profile/faq"
            className="flex items-center gap-3 py-3 text-sm font-medium text-foreground"
          >
            <HelpCircle className="size-5 text-secondary" />
            <span className="flex-1">FAQ</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Separator />
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
            className="flex items-center gap-3 py-3 text-left text-sm font-medium text-destructive"
          >
            <LogOut className="size-5" />
            <span className="flex-1">Keluar</span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
