/**
 * One-off script to create a Firebase Auth account for each club's president,
 * reserve their slot in the club's quota, and link them on the activity doc.
 * Run once against Firestore: npm run create-club-presidents
 *
 * Real names for each president are not known yet — accounts are created with
 * a placeholder display name ("Presiden <Club>") and a werkudara.com email.
 * Update the profile's `name` field later once the real name is confirmed.
 */
import { randomBytes } from "crypto";
import { getAdminAuth, getDb } from "../src/lib/firebase-admin";
import { createUserProfile } from "../src/features/auth/data";

const CLUB_IDS = ["running", "wwf", "aqua-yoga", "pilates", "zumba"] as const;

function generatePassword(): string {
  return randomBytes(9).toString("base64url");
}

async function createClubPresident(clubId: string) {
  const db = getDb();
  const activityDoc = await db.collection("activities").doc(clubId).get();
  if (!activityDoc.exists) {
    throw new Error(`Activity "${clubId}" tidak ditemukan`);
  }
  const club = activityDoc.data() as { name: string; quotaTaken: number };

  const email = `presiden.${clubId}@werkudara.com`;
  const password = generatePassword();
  const displayName = `Presiden ${club.name}`;

  const userRecord = await getAdminAuth().createUser({
    email,
    password,
    displayName,
  });

  await createUserProfile(userRecord.uid, {
    name: displayName,
    email,
    avatarInitial: displayName.charAt(0).toUpperCase(),
    role: "employee",
    createdAt: new Date().toISOString(),
  });

  await db.collection("selectionState").doc(userRecord.uid).set({
    activityId: clubId,
    selectedAt: new Date().toISOString(),
    openMarks: [],
  });

  await db
    .collection("activities")
    .doc(clubId)
    .update({
      quotaTaken: club.quotaTaken + 1,
      president: { uid: userRecord.uid, name: displayName, email },
    });

  return { club: club.name, email, password };
}

async function main() {
  const results = [];
  for (const clubId of CLUB_IDS) {
    results.push(await createClubPresident(clubId));
  }

  console.log("\nAkun club presiden berhasil dibuat:\n");
  console.table(results);
  console.log(
    "\nSimpan password di atas sekarang — tidak akan ditampilkan lagi. Update nama presiden lewat halaman admin setelah data asli tersedia.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Gagal membuat akun club presiden:", error);
    process.exit(1);
  });
