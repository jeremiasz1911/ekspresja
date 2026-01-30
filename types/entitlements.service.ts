import { db } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import type { Entitlement } from "@/types/entitlements";

export async function createEntitlement(data: Omit<Entitlement, "id" | "createdAt" | "status">) {
  const ref = await addDoc(collection(db, "entitlements"), {
    ...data,
    status: "active",
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
  return ref.id;
}
