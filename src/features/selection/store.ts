import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase-admin";
import type { Activity } from "@/features/activities/types";
import type { Selection, SelectionState } from "./types";

interface SelectionDoc {
  activityId: string | null;
  selectedAt: string | null;
  openMarks: string[];
}

const activityRef = (id: string) => getDb().collection("activities").doc(id);
const selectionRef = (employeeId: string) =>
  getDb().collection("selectionState").doc(employeeId);

export type SelectionErrorCode = "QUOTA_FULL" | "NOT_FOUND" | "INVALID_CATEGORY";

export class SelectionError extends Error {
  constructor(
    public code: SelectionErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export async function getSelectionState(employeeId: string): Promise<SelectionState> {
  const doc = await selectionRef(employeeId).get();
  const data = doc.data() as SelectionDoc | undefined;

  return {
    selection: data?.activityId
      ? {
          employeeId,
          activityId: data.activityId,
          status: "confirmed",
          selectedAt: data.selectedAt!,
        }
      : null,
    openMarks: data?.openMarks ?? [],
  };
}

export async function selectActivity(
  employeeId: string,
  activityId: string,
): Promise<Selection> {
  const selectedAt = new Date().toISOString();

  await getDb().runTransaction(async (tx) => {
    const targetSnap = await tx.get(activityRef(activityId));
    if (!targetSnap.exists) {
      throw new SelectionError("NOT_FOUND", "Aktivitas tidak ditemukan");
    }
    const target = targetSnap.data() as Activity;
    if (target.category !== "segmented") {
      throw new SelectionError(
        "INVALID_CATEGORY",
        "Aktivitas ini tidak memerlukan pemilihan",
      );
    }

    const selectionSnap = await tx.get(selectionRef(employeeId));
    const current = selectionSnap.data() as SelectionDoc | undefined;
    if (current?.activityId === activityId) return;

    if (target.quotaTaken >= (target.quota ?? Infinity)) {
      throw new SelectionError("QUOTA_FULL", "Kuota aktivitas ini sudah penuh");
    }

    if (current?.activityId) {
      const previousSnap = await tx.get(activityRef(current.activityId));
      if (previousSnap.exists) {
        tx.update(activityRef(current.activityId), {
          quotaTaken: FieldValue.increment(-1),
        });
      }
    }

    tx.update(activityRef(activityId), { quotaTaken: FieldValue.increment(1) });
    tx.set(
      selectionRef(employeeId),
      { activityId, selectedAt, openMarks: current?.openMarks ?? [] },
      { merge: true },
    );
  });

  return { employeeId, activityId, status: "confirmed", selectedAt };
}

export async function cancelSelection(employeeId: string): Promise<void> {
  await getDb().runTransaction(async (tx) => {
    const selectionSnap = await tx.get(selectionRef(employeeId));
    const current = selectionSnap.data() as SelectionDoc | undefined;
    if (!current?.activityId) return;

    const activitySnap = await tx.get(activityRef(current.activityId));
    if (activitySnap.exists) {
      tx.update(activityRef(current.activityId), {
        quotaTaken: FieldValue.increment(-1),
      });
    }

    tx.set(
      selectionRef(employeeId),
      { activityId: null, selectedAt: null },
      { merge: true },
    );
  });
}

export async function listSelectionStates(): Promise<
  Record<string, { activityId: string | null; openMarks: string[] }>
> {
  const snapshot = await getDb().collection("selectionState").get();
  const result: Record<string, { activityId: string | null; openMarks: string[] }> = {};
  for (const doc of snapshot.docs) {
    const data = doc.data() as SelectionDoc;
    result[doc.id] = { activityId: data.activityId, openMarks: data.openMarks ?? [] };
  }
  return result;
}

export async function setOpenMark(
  employeeId: string,
  activityId: string,
  marked: boolean,
): Promise<string[]> {
  const activitySnap = await activityRef(activityId).get();
  const activity = activitySnap.data() as Activity | undefined;
  if (!activity || activity.category !== "open") {
    throw new SelectionError("INVALID_CATEGORY", "Aktivitas ini bukan open activity");
  }

  await selectionRef(employeeId).set(
    {
      openMarks: marked
        ? FieldValue.arrayUnion(activityId)
        : FieldValue.arrayRemove(activityId),
    },
    { merge: true },
  );

  const doc = await selectionRef(employeeId).get();
  return (doc.data() as SelectionDoc | undefined)?.openMarks ?? [];
}
