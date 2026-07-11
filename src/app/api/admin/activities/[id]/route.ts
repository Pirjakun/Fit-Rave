import { deleteActivity, updateActivity } from "@/features/activities/data";
import { ApiAuthError, requireAdmin, requireUser } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const uid = await requireUser(request);
    await requireAdmin(uid);

    const { id } = await params;
    const updates = await request.json();
    await updateActivity(id, updates);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const uid = await requireUser(request);
    await requireAdmin(uid);

    const { id } = await params;
    await deleteActivity(id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
