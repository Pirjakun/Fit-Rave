import { listUserProfiles } from "@/features/auth/data";
import { listSelectionStates } from "@/features/selection/store";
import { ApiAuthError, requireAdmin, requireUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const uid = await requireUser(request);
    await requireAdmin(uid);

    const [profiles, selectionStates] = await Promise.all([
      listUserProfiles(),
      listSelectionStates(),
    ]);

    const employees = profiles
      .filter((profile) => profile.role === "employee")
      .map((profile) => ({
        ...profile,
        activityId: selectionStates[profile.id]?.activityId ?? null,
        openMarks: selectionStates[profile.id]?.openMarks ?? [],
      }));

    return Response.json(employees);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
