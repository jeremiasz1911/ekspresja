import { db } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp, onSnapshot, collection, getDocs  } from "firebase/firestore";

export async function setOnline(uid: string) {
  await setDoc(
    doc(db, "presence", uid),
    { state: "online", lastSeenAtServer: serverTimestamp(), lastSeenAt: Date.now() },
    { merge: true }
  );
}

export async function setOffline(uid: string) {
  await setDoc(
    doc(db, "presence", uid),
    { state: "offline", lastSeenAtServer: serverTimestamp(), lastSeenAt: Date.now() },
    { merge: true }
  );
}

/** heartbeat co X sekund */
export async function heartbeat(uid: string) {
  await setDoc(
    doc(db, "presence", uid),
    { state: "online", lastSeenAtServer: serverTimestamp(), lastSeenAt: Date.now() },
    { merge: true }
  );
}
export async function getAllPresence(): Promise<Record<string, { state?: string; lastSeenAt?: number }>> {
  const snap = await getDocs(collection(db, "presence"));
  const map: Record<string, any> = {};
  snap.forEach((d) => {
    map[d.id] = d.data();
  });
  return map;
}