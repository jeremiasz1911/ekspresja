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

type SeedMaterial = {
  title: string;
  description: string;
  kind: "video" | "audio";
  category: string;
  accessLevel: "free" | "partial" | "premium";
  isActive: boolean;
  externalUrl: string;
  createdAt: number;
  priceCents?: number;
};

const materials: SeedMaterial[] = [
  // ===== DZIECI - WYLICZANKI =====
  {
    title: "Jedna, Dwa, Trzy - Wyliczanka",
    description:
      "Tradycyjna polska wyliczanka do zabawy z animacją i muzyką",
    kind: "video",
    category: "Dzieci - Wyliczanki",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Kotki, Myszki, Psy - Rythmic Game",
    description: "Interaktywna wyliczanka z ruchami i rymem",
    kind: "video",
    category: "Dzieci - Wyliczanki",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
  },

  // ===== DZIECI - DO SPANIA =====
  {
    title: "Kołysanka - Gwiezdna Noc",
    description: "Miękka kołysanka do uspokajania dzieci przed snem",
    kind: "audio",
    category: "Dzieci - Do spania",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Sen Ptaszków - Animacja z Kołysanką",
    description: "Relaksująca animacja z muzyką do snu dla maluszków",
    kind: "video",
    category: "Dzieci - Do spania",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 24 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Muzyka do Snu - Premium Collection",
    description: "Zbiór 5 profesjonalnych kolysenek z ambientem",
    kind: "audio",
    category: "Dzieci - Do spania",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    createdAt: Date.now() - 23 * 24 * 60 * 60 * 1000,
  },

  // ===== DZIECI - NA POBUDKĘ =====
  {
    title: "Wstawajcie! - Piosenka Poranna",
    description: "Energiczna piosenka do wstawania z animacją",
    kind: "video",
    category: "Dzieci - Na pobudkę",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 22 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Dzień Dobry, Słoneczko!",
    description: "Radosna piosenka poranna dla przedszkolaków",
    kind: "audio",
    category: "Dzieci - Na pobudkę",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
  },

  // ===== DZIECI - ENERGICZNE =====
  {
    title: "Taniec z Dinozaurami",
    description: "Super energiczna piosenka z animacją i choreografią",
    kind: "video",
    category: "Dzieci - Energiczne",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Skacz Wysoko! - Ćwiczenia Energetyczne",
    description: "Dynamiczna piosenka z ruchami do aktywności fizycznej",
    kind: "video",
    category: "Dzieci - Energiczne",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 19 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Party Kids Mix - 10 Energicznych Piosenek",
    description: "Zbiór najlepszych energicznych piosenek dla dzieci",
    kind: "audio",
    category: "Dzieci - Energiczne",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    createdAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
  },

  // ===== DZIECI - ZABAWY Z LEKTOREM =====
  {
    title: "Zabawy Ruchowe - Lektor Prowadzi",
    description:
      "Film edukacyjny gdzie lektor prowadzi zabawy ruchowe dla przedszkolaków",
    kind: "video",
    category: "Dzieci - Zabawy z lektorem",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 17 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Gra Edukacyjna - Kolory i Kształty",
    description:
      "Animator uczy dzieci rozpoznawać kolory i kształty poprzez muzykę i taniec",
    kind: "video",
    category: "Dzieci - Zabawy z lektorem",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 16 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Kreatywne Zabawy - Workshop z Muzyką (Premium)",
    description:
      "Zaawansowany kurs zabawy edukacyjne z doświadczonym pedagogiem muzyki",
    kind: "video",
    category: "Dzieci - Zabawy z lektorem",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },

  // ===== DZIECI - NAUKA LICZENIA =====
  {
    title: "1, 2, 3 - Nauka Liczenia",
    description: "Piosenka do nauki liczenia od 1 do 10 z animacją zwierzątek",
    kind: "video",
    category: "Dzieci - Nauka liczenia",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Liczę Sobie Piosenkę",
    description: "Śmieszna piosenka do nauki liczenia dla najmłodszych",
    kind: "audio",
    category: "Dzieci - Nauka liczenia",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    createdAt: Date.now() - 13 * 24 * 60 * 60 * 1000,
  },

  // ===== DZIECI - ZWIERZĘTA =====
  {
    title: "Głosy Zwierzątek - Piosenka",
    description: "Piosenka o głosach zwierząt z animacją",
    kind: "video",
    category: "Dzieci - Zwierzęta",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Farma u Babci - Interaktywna Gra Dźwięków",
    description: "Zabawy z dźwiękami zwierząt na farmie z lektorem",
    kind: "video",
    category: "Dzieci - Zwierzęta",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 11 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Podróż po Świecie Zwierząt (Premium)",
    description: "Premium kolekcja piosenek o zwierzętach z całego świata",
    kind: "video",
    category: "Dzieci - Zwierzęta",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },

  // ===== DZIECI - JĘZYK ANGIELSKI =====
  {
    title: "ABC Song - Angielski Alfabet",
    description: "Klasyczna piosenka do nauki angielskiego alfabetu",
    kind: "video",
    category: "Dzieci - Język angielski",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Hello Friends - Piosenka Angielska",
    description: "Wesoła piosenka po angielsku dla przedszkolaków",
    kind: "audio",
    category: "Dzieci - Język angielski",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },

  // ===== DOROSŁYCH - KLASYKA =====
  {
    title: "Jak Grać Akord C - Tutorial",
    description: "Pełny tutorial pokazujący jak grać akord C na gitarze",
    kind: "video",
    category: "Dorosłych - Gitary",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Skala Pentatoniczna - Ćwiczenia",
    description: "Intensywne ćwiczenia na skalę pentatoniczną minorową",
    kind: "video",
    category: "Dorosłych - Improwizacja",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Technika Finger Picking",
    description: "Zaawansowana technika finger picking - porada od eksperta",
    kind: "video",
    category: "Dorosłych - Techniki",
    accessLevel: "premium",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },

  // ===== DOROSŁYCH - ŚPIEWANIE =====
  {
    title: "Technika Oddychania do Śpiewu",
    description: "Fundamentalne ćwiczenia oddychania dla początkujących śpiewaków",
    kind: "video",
    category: "Dorosłych - Śpiewanie",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    title: "Warmup Głosu - Codzienne Ćwiczenia",
    description: "10-minutowy warmup do codziennych ćwiczeń wokalnych",
    kind: "audio",
    category: "Dorosłych - Śpiewanie",
    accessLevel: "free",
    isActive: true,
    externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
  },

  // ===== MUZYKA KLASYCZNA =====
  {
    title: "Nocna Mazurka Chopina",
    description: "Tradycyjna mazurka do nauki i słuchania",
    kind: "audio",
    category: "Muzyka klasyczna",
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
];

async function seed() {
  try {
    console.log("🌱 Seeding materials to Firebase...");

    for (const mat of materials) {
      const finalMaterial = {
        ...mat,
        priceCents: mat.accessLevel !== "free" ? mat.priceCents ?? 2490 : undefined,
      };

      const docRef = await db.collection("materials").add(finalMaterial);
      console.log(`✅ Added: ${mat.title} [${mat.category}]`);
    }

    console.log(`\n✨ Successfully added ${materials.length} materials!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding materials:", error);
    process.exit(1);
  }
}

seed();
