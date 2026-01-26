import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

export async function doesUserProfileExist(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists();
}
