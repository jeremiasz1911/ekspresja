import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./keys/ekspresja-firebase-admin.json", "utf8")
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

const materials = [
  {
    title: "Jak Grać Akord C - Tutorial",
    description: "Pełny tutorial pokazujący jak grać akord C na gitarze",
    kind: "video",
    category: "Gitary",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Skala Pentatoniczna - Ćwiczenia",
    description: "Intensywne ćwiczenia na skalę pentatoniczną minorową",
    kind: "video",
    category: "Improwizacja",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Piosenka: Nocna Mazurka",
    description: "Tradycyjna mazurka - backing track do ćwiczań",
    kind: "audio",
    category: "Utwory",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Jazz Standards Compilation",
    description: "Zbiór 10 klasycznych piosenek jazzowych do nauki",
    kind: "audio",
    category: "Jazz",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Technika Finger Picking",
    description: "Zaawansowana technika finger picking - porada od eksperta",
    kind: "video",
    category: "Techniki",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Arpeggio Ćwiczenia",
    description: "Systematyczne ćwiczenia arpeggii dla wszystkich poziomów",
    kind: "video",
    category: "Ćwiczenia",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Harmonia Jazzowa Basics",
    description:
      "Wprowadzenie do harmonii jazzowej - świetnie dla każdego instrumentalisty",
    kind: "video",
    category: "Harmonia",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now(),
  },
  {
    title: "Rytm i Metronom",
    description: "Zaawansowane ćwiczenia rytmiczne z metronomem",
    kind: "audio",
    category: "Rytm",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    createdAt: Date.now(),
  },
];

async function seed() {
  try {
    console.log("🌱 Seeding materials to Firebase...");

    for (const mat of materials) {
      const docRef = await db.collection("materials").add(mat);
      console.log(`✅ Added: ${mat.title} (ID: ${docRef.id})`);
    }

    console.log(`\n✨ Successfully added ${materials.length} materials!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding materials:", error);
    process.exit(1);
  }
}

seed();
