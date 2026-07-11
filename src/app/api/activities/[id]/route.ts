import { findActivity } from "@/features/activities/data";
import { ApiAuthError, requireUser } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(request);
    const { id } = await params;
    const activity = await findActivity(id);
    if (!activity) {
      return Response.json({ error: "Aktivitas tidak ditemukan" }, { status: 404 });
    }
    return Response.json(activity);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
