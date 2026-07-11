const MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Email sudah terdaftar, coba masuk.",
  "auth/invalid-email": "Format email tidak valid.",
  "auth/weak-password": "Password minimal 6 karakter.",
  "auth/wrong-password": "Email atau password salah.",
  "auth/invalid-credential": "Email atau password salah.",
  "auth/user-not-found": "Akun tidak ditemukan.",
  "auth/too-many-requests": "Terlalu banyak percobaan, coba lagi nanti.",
};

export function mapFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return "Terjadi kesalahan, coba lagi.";
}
