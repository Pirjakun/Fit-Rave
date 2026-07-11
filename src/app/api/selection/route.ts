import {
  cancelSelection,
  getSelectionState,
  selectActivity,
  SelectionError,
} from "@/features/selection/store";
import { ApiAuthError, requireUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const uid = await requireUser(request);
    return Response.json(await getSelectionState(uid));
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const uid = await requireUser(request);
    const { activityId } = await request.json();
    if (!activityId) {
      return Response.json({ error: "activityId wajib diisi" }, { status: 400 });
    }
    const selection = await selectActivity(uid, activityId);
    return Response.json(selection);
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

export async function DELETE(request: Request) {
  try {
    const uid = await requireUser(request);
    await cancelSelection(uid);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
