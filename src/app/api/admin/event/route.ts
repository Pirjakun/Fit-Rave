import { updateEventInfo } from "@/features/event/data";
import { ApiAuthError, requireAdmin, requireUser } from "@/lib/api-auth";

export async function PATCH(request: Request) {
  try {
    const uid = await requireUser(request);
    await requireAdmin(uid);

    const body = await request.json();
    await updateEventInfo(body);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
