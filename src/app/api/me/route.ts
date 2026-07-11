import { ApiAuthError, requireUser } from "@/lib/api-auth";
import { getUserProfile } from "@/features/auth/data";

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
