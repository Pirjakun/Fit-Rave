const MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Email sudah terdaftar, coba masuk.",
  "auth/invalid-email": "Format email tidak valid.",
  "auth/weak-password": "Password minimal 6 karakter.",
  "auth/wrong-password": "Email atau password salah.",
  "auth/invalid-credential": "Email atau password salah.",
  "auth/user-not-found": "Akun tidak ditemukan.",
  "auth/too-many-requests": "Terlalu banyak percobaan, coba lagi nanti.",
  "auth/account-exists-with-different-credential":
    "Email ini sudah terdaftar dengan password. Silakan masuk dengan password.",
  "auth/popup-closed-by-user": "Login Google dibatalkan.",
  "auth/popup-blocked": "Popup diblokir browser, izinkan popup lalu coba lagi.",
  "auth/cancelled-popup-request": "Login Google dibatalkan.",
  "auth/unauthorized-domain":
    "Domain ini belum diizinkan untuk login Google. Hubungi admin untuk menambahkannya di Firebase Console.",
};

export function mapFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return "Terjadi kesalahan, coba lagi.";
}
