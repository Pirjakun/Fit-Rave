import { getAdminAuth } from "@/lib/firebase-admin";
import { ApiAuthError, requireUser } from "@/lib/api-auth";
import { ensureUserProfile } from "@/features/auth/data";

export async function POST(request: Request) {
  try {
    const uid = await requireUser(request);
    const user = await getAdminAuth().getUser(uid);
    const email = user.email ?? "";
    const name = user.displayName?.trim() || email.split("@")[0] || "Employee";

    await ensureUserProfile(uid, {
      name,
      email,
      avatarInitial: name.charAt(0).toUpperCase() || "?",
      role: "employee",
      createdAt: new Date().toISOString(),
    });

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
