import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Plan } from "@/types/plans";

const ref = collection(db, "plans");

/** pobranie wszystkich planów */
export async function getPlans(): Promise<Plan[]> {
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Plan, "id">),
  }));
}

/** zapis / update planu (id = stały string) */
export async function savePlan(plan: Plan) {
  await setDoc(doc(db, "plans", plan.id), {
    ...plan,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
}

/** szybki toggle aktywności */
export async function togglePlan(
  id: string,
  isActive: boolean
) {
  await updateDoc(doc(db, "plans", id), {
    isActive,
    updatedAt: Date.now(),
  });
}
