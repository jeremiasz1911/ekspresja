import { db } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  doc, 
  updateDoc, 
  deleteDoc
} from "firebase/firestore";
import type { Class } from "@/types/classes";

export async function createClass(data: Omit<Class, "id">) {
  return addDoc(collection(db, "classes"), data);
}

export async function getActiveClasses(): Promise<Class[]> {
  const q = query(collection(db, "classes"), where("isActive", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Class, "id">) }));
}

export async function updateClass(
  id: string,
  data: Partial<Class>
) {
  return updateDoc(doc(db, "classes", id), data);
}

export async function deleteClass(id: string) {
  return deleteDoc(doc(db, "classes", id));
}
