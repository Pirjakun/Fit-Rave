"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, HelpCircle, LogOut, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth/context";
import { useUpdateName } from "@/features/auth/hooks";

function EditNameDialog({
  open,
  onOpenChange,
  currentName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
}) {
  const { refreshProfile } = useAuth();
  const updateName = useUpdateName();
  const [name, setName] = useState(currentName);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    updateName.mutate(trimmed, {
      onSuccess: async () => {
        await refreshProfile();
        toast.success("Nama berhasil diubah");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setName(currentName);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ubah Nama</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Nama</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={updateName.isPending || !name.trim()}
            >
              {updateName.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { employee, signOut } = useAuth();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

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
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading font-semibold text-foreground">
              {employee.name}
            </p>
            <p className="truncate text-sm text-muted-foreground">{employee.email}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            aria-label="Ubah nama"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" />
          </Button>
        </CardContent>
      </Card>

      <EditNameDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        currentName={employee.name}
      />

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
