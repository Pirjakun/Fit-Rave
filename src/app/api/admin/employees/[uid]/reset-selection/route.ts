import { cancelSelection } from "@/features/selection/store";
import { ApiAuthError, requireAdmin, requireUser } from "@/lib/api-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  try {
    const callerUid = await requireUser(request);
    await requireAdmin(callerUid);

    const { uid } = await params;
    await cancelSelection(uid);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
