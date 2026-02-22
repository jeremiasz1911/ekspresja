import { db } from "@/lib/firebase/client";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import type { ParentFormData } from "@/types/profile";
import type { ChildInput } from "@/types/auth";

/**
 * Pobiera:
 *  - dane rodzica z users/{uid}
 *  - dzieci z children where parentId == uid
 */
export async function getUserProfile(uid: string): Promise<ParentFormData> {
  const parentSnap = await getDoc(doc(db, "users", uid));
  if (!parentSnap.exists()) throw new Error("Profil nie istnieje");

  const parent = parentSnap.data();

  const q = query(collection(db, "children"), where("parentId", "==", uid));
  const childrenSnap = await getDocs(q);

  const children: (ChildInput & { id?: string })[] = childrenSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      ageYears: data.ageYears ?? "",
    };
  });

  return {
    firstName: parent.firstName ?? "",
    lastName: parent.lastName ?? "",
    email: parent.email ?? "",
    phone: parent.phone ?? "",

    street: parent.street ?? "",
    houseNumber: parent.houseNumber ?? "",
    apartmentNumber: parent.apartmentNumber ?? "",
    postalCode: parent.postalCode ?? "",
    city: parent.city ?? "",

    children,
  };
}

/**
 * Aktualizuje:
 *  - users/{uid}
 *  - oraz synchronizuje children (create/update/delete)
 */
export async function updateUserProfile(uid: string, data: ParentFormData) {
  const { children, ...parent } = data;

  // 1) parent
  await updateDoc(doc(db, "users", uid), {
    ...parent,
    updatedAt: Date.now(),
  });

  // 2) children sync
  const q = query(collection(db, "children"), where("parentId", "==", uid));
  const existingSnap = await getDocs(q);
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));

  const keptIds = new Set<string>();

  for (const c of children) {
    const payload = {
      parentId: uid,
      firstName: (c.firstName ?? "").trim(),
      lastName: (c.lastName ?? "").trim(),
      ageYears: c.ageYears === "" ? "" : Number(c.ageYears),
      updatedAt: Date.now(),
    };

    if (c.id && existingIds.has(c.id)) {
      // update
      await setDoc(doc(db, "children", c.id), payload, { merge: true });
      keptIds.add(c.id);
    } else {
      // create
      const ref = await addDoc(collection(db, "children"), {
        ...payload,
        createdAt: Date.now(),
      });
      keptIds.add(ref.id);
    }
  }

  // delete removed
  for (const id of existingIds) {
    if (!keptIds.has(id)) {
      await deleteDoc(doc(db, "children", id));
    }
  }
}
