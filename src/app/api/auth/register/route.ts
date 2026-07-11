import { getAdminAuth } from "@/lib/firebase-admin";
import { ApiAuthError, requireUser } from "@/lib/api-auth";
import { createUserProfile } from "@/features/auth/data";

export async function POST(request: Request) {
  try {
    const uid = await requireUser(request);
    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return Response.json({ error: "Nama wajib diisi" }, { status: 400 });
    }

    const user = await getAdminAuth().getUser(uid);
    const email = user.email ?? "";
    const trimmedName = name.trim();

    await createUserProfile(uid, {
      name: trimmedName,
      email,
      avatarInitial: trimmedName.charAt(0).toUpperCase() || "?",
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
