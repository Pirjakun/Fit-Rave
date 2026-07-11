import { setOpenMark, SelectionError } from "@/features/selection/store";
import { ApiAuthError, requireUser } from "@/lib/api-auth";

export async function PUT(request: Request) {
  try {
    const uid = await requireUser(request);
    const { activityId, marked } = await request.json();
    if (!activityId || typeof marked !== "boolean") {
      return Response.json(
        { error: "activityId dan marked wajib diisi" },
        { status: 400 },
      );
    }
    const openMarks = await setOpenMark(uid, activityId, marked);
    return Response.json({ openMarks });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof SelectionError) {
      return Response.json({ error: error.message, code: error.code }, { status: 409 });
    }
    throw error;
  }
}
