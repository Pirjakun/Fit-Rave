"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useEmployees,
  useResetEmployeeSelection,
  type AdminEmployee,
} from "@/features/admin/hooks";

export default function AdminEmployeesPage() {
  const { data: employees, isLoading } = useEmployees();
  const resetSelection = useResetEmployeeSelection();
  const [search, setSearch] = useState("");
  const [resetTarget, setResetTarget] = useState<AdminEmployee | null>(null);

  const filtered = (employees ?? []).filter((employee) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      employee.name.toLowerCase().includes(q) ||
      employee.email.toLowerCase().includes(q)
    );
  });

  function confirmReset() {
    if (!resetTarget) return;
    resetSelection.mutate(resetTarget.id, {
      onSuccess: () => {
        toast.success(`Pilihan ${resetTarget.name} sudah direset`);
        setResetTarget(null);
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-xl font-bold text-foreground">Employees</h1>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Aktivitas</TableHead>
                <TableHead>Open Activities</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">{employee.email}</p>
                  </TableCell>
                  <TableCell>
                    {employee.activityId ? (
                      <Badge>{employee.activityId}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Belum memilih
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {employee.openMarks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {employee.openMarks.map((id) => (
                          <Badge key={id} variant="secondary">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!employee.activityId}
                      onClick={() => setResetTarget(employee)}
                    >
                      Reset Pilihan
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset pilihan {resetTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Pilihan aktivitas berkuota karyawan ini akan dibatalkan dan slotnya
            dilepas kembali.
          </p>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={confirmReset}
              disabled={resetSelection.isPending}
            >
              {resetSelection.isPending ? "Memproses..." : "Reset Pilihan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
