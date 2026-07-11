import { getAdminAuth } from "@/lib/firebase-admin";
import { getUserProfile } from "@/features/auth/data";

export class ApiAuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

export async function requireUser(request: Request): Promise<string> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) throw new ApiAuthError(401, "Tidak terautentikasi");

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new ApiAuthError(401, "Token tidak valid");
  }
}

export async function requireAdmin(uid: string): Promise<void> {
  const profile = await getUserProfile(uid);
  if (profile?.role !== "admin") {
    throw new ApiAuthError(403, "Akses ditolak");
  }
}
