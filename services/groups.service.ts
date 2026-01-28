import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import type { Group } from "@/types/groups";

export async function getAllGroups(): Promise<Group[]> {
  const snap = await getDocs(collection(db, "groups"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Group, "id">),
  }));
}



const ref = collection(db, "groups");

export async function getGroups(): Promise<Group[]> {
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Group, "id">),
  }));
}

export async function createGroup(
  data: Omit<Group, "id" | "createdAt">
) {
  return addDoc(ref, {
    ...data,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
}

export async function updateGroup(
  id: string,
  data: Partial<Group>
) {
  return updateDoc(doc(db, "groups", id), data);
}

export async function deleteGroup(id: string) {
  return deleteDoc(doc(db, "groups", id));
}
