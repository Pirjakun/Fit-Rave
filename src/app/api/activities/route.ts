import { listActivities } from "@/features/activities/data";
import { ApiAuthError, requireUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    await requireUser(request);
    return Response.json(await listActivities());
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
