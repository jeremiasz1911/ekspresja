import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  addDoc,
} from "firebase/firestore";
import type { ParentProfile, ChildInput } from "../types/auth";

function toIntAge(age: number | ""): number {
  if (age === "") return 0;
  return Number.isFinite(age) ? Math.trunc(age) : 0;
}

export async function createParentAndChildren(params: {
  uid: string;
  parent: Omit<ParentProfile, "createdAt">;
  children: ChildInput[];
}) {
  const { uid, parent, children } = params;

  // users/{uid}
  await setDoc(doc(db, "users", uid), {
    ...parent,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });

  // children/{childId} (global collection)
  const childrenCol = collection(db, "children");

  const filtered = children
    .map((c) => ({
      firstName: c.firstName.trim(),
      lastName: c.lastName.trim(),
      ageYears: toIntAge(c.ageYears),
    }))
    .filter((c) => c.firstName && c.lastName && c.ageYears > 0);

  for (const c of filtered) {
    await addDoc(childrenCol, {
      parentId: uid,
      ...c,
      createdAt: Date.now(),
      createdAtServer: serverTimestamp(),
      active: true,
    });
  }
}
