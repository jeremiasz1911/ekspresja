import "server-only";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function required(name: string, v?: string) {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

if (!getApps().length) {
  // ✅ Najbardziej stabilne na hostingu (ENV z kluczem)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // ✅ Fallback lokalny: GOOGLE_APPLICATION_CREDENTIALS
    // (gdy uruchamiasz z pliku keys/*.json)
    const { applicationDefault } = require("firebase-admin/app");
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
