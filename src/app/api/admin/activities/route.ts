import { createActivity } from "@/features/activities/data";
import { ApiAuthError, requireAdmin, requireUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const uid = await requireUser(request);
    await requireAdmin(uid);

    const body = await request.json();
    const activity = await createActivity(body);
    return Response.json(activity);
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
