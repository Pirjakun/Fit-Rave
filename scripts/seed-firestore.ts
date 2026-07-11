/**
 * One-off script to populate Firestore with the original mock data.
 * Run once against a fresh Firestore database: npx tsx scripts/seed-firestore.ts
 */
import { getDb } from "../src/lib/firebase-admin";
import type { Activity } from "../src/features/activities/types";
import type { EventInfo } from "../src/features/event/types";

const activities: Activity[] = [
  {
    id: "running",
    name: "Running",
    category: "segmented",
    description:
      "Lari santai menyusuri pantai untuk memulai hari dengan energi positif.",
    icon: "Footprints",
    location: "Area Pantai Utama",
    day: 2,
    timeWindow: "Fit Rave · 07.30 - 10.00",
    quota: 50,
    quotaTaken: 0,
    tags: ["outdoor", "cardio"],
  },
  {
    id: "fitness",
    name: "Fitness",
    category: "segmented",
    description: "Sesi latihan fisik terpandu untuk seluruh level kebugaran.",
    icon: "Dumbbell",
    location: "Beach Deck A",
    day: 2,
    timeWindow: "Fit Rave · 07.30 - 10.00",
    quota: 40,
    quotaTaken: 0,
    tags: ["indoor-outdoor", "strength"],
  },
  {
    id: "aqua-yoga",
    name: "Aqua Yoga",
    category: "segmented",
    description: "Yoga menenangkan di air untuk relaksasi tubuh dan pikiran.",
    icon: "Waves",
    location: "Kolam Renang",
    day: 2,
    timeWindow: "Fit Rave · 07.30 - 10.00",
    quota: 20,
    quotaTaken: 0,
    tags: ["water", "relax"],
  },
  {
    id: "zumba",
    name: "Zumba",
    category: "segmented",
    description: "Sesi zumba energik diiringi musik summer yang ceria.",
    icon: "Music4",
    location: "Beach Deck B",
    day: 2,
    timeWindow: "Fit Rave · 07.30 - 10.00",
    quota: 30,
    quotaTaken: 0,
    tags: ["dance", "cardio"],
  },
  {
    id: "swimming",
    name: "Swimming",
    category: "open",
    description: "Berenang bebas di kolam renang sepanjang sesi wellbeing.",
    icon: "Waves",
    location: "Kolam Renang",
    day: 2,
    timeWindow: "Fit Rave · 07.30 - 10.00",
    quota: null,
    quotaTaken: 0,
    tags: ["water"],
  },
  {
    id: "badminton",
    name: "Badminton",
    category: "open",
    description: "Main badminton santai bersama rekan kerja.",
    icon: "CircleDot",
    location: "Lapangan Indoor",
    day: 2,
    timeWindow: "Fit Rave · 07.30 - 10.00",
    quota: null,
    quotaTaken: 0,
    tags: ["indoor"],
  },
  {
    id: "volleyball",
    name: "Volleyball",
    category: "open",
    description: "Voli pantai seru bersama tim untuk mencairkan suasana.",
    icon: "Volleyball",
    location: "Lapangan Pantai",
    day: 2,
    timeWindow: "Fit Rave · 07.30 - 10.00",
    quota: null,
    quotaTaken: 0,
    tags: ["outdoor", "team"],
  },
];

const eventInfo: EventInfo = {
  day1: {
    title: "Menyamakan Vibrasi — Ruwatan Wayang",
    description:
      "Prosesi ruwatan bersama dalang untuk membuka rangkaian Mid Year Party dengan penuh makna.",
    date: "2026-07-16",
    time: "Sepanjang hari",
    dresscode: {
      items: ["Atasan Putih", "Bawahan Kain"],
      note:
        "Laki-laki: Ikat Kepala. Perempuan: diusahakan rambut diikat ala Jawa.",
    },
  },
  day2: {
    title: "Wellbeing Day — Beach & Summer Sports",
    description:
      "Rangkaian aktivitas seru sepanjang hari, dari olahraga pagi sampai makan malam bersama.",
    date: "2026-07-17",
    agenda: [
      {
        id: "fit-rave",
        title: "Fit Rave",
        timeStart: "07:30",
        timeEnd: "10:00",
        status: "confirmed",
        description:
          "Sesi olahraga & wellbeing bertema Beach/Summer Party — seluruh aktivitas segmented dan open activity berlangsung di sesi ini.",
        dresscode: { items: ["Beachwear Outfit"], note: "" },
      },
      {
        id: "training",
        title: "Training",
        timeStart: "13:00",
        timeEnd: "17:00",
        status: "tbu",
        description: "Detail materi dan lokasi menyusul.",
        dresscode: { items: [], note: "" },
      },
      {
        id: "dinner",
        title: "Dinner Outside",
        timeStart: "18:00",
        timeEnd: "21:00",
        status: "tbu",
        description: "Detail lokasi dan rangkaian acara menyusul.",
        dresscode: { items: [], note: "" },
      },
    ],
  },
};

async function seed() {
  const db = getDb();
  const activityWrites = activities.map((activity) =>
    db.collection("activities").doc(activity.id).set(activity),
  );
  await Promise.all(activityWrites);
  console.log(`Seeded ${activities.length} activities.`);

  await db.collection("event").doc("info").set(eventInfo);
  console.log("Seeded event/info.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
