import { ApiAuthError, requireUser } from "@/lib/api-auth";
import { getUserProfile, updateUserName } from "@/features/auth/data";

export async function GET(request: Request) {
  try {
    const uid = await requireUser(request);
    const profile = await getUserProfile(uid);
    if (!profile) {
      return Response.json({ error: "Profil tidak ditemukan" }, { status: 404 });
    }
    return Response.json({ id: uid, ...profile });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  try {
    const uid = await requireUser(request);
    const { name } = await request.json();
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) {
      return Response.json({ error: "Nama wajib diisi" }, { status: 400 });
    }

    await updateUserName(uid, trimmed);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
