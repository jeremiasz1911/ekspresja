import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

export async function getUserRole(uid: string): Promise<"user" | "admin"> {
  const snap = await getDoc(doc(db, "users", uid));
  const role = snap.exists() ? (snap.data().role as "user" | "admin") : "user";
  return role ?? "user";
}
