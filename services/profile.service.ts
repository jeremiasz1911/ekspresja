import { db } from "@/lib/firebase/client";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { ParentFormData } from "@/types/profile";
import type { ChildInput } from "@/types/auth";

/**
 * Pobiera:
 *  - dane rodzica z users/{uid}
 *  - dzieci z children where parentId == uid
 */
export async function getUserProfile(
  uid: string
): Promise<ParentFormData> {
  // --- parent ---
  const parentSnap = await getDoc(doc(db, "users", uid));

  if (!parentSnap.exists()) {
    throw new Error("Profil nie istnieje");
  }

  const parent = parentSnap.data();

  // --- children ---
  const q = query(
    collection(db, "children"),
    where("parentId", "==", uid)
  );

  const childrenSnap = await getDocs(q);

  const children: ChildInput[] = childrenSnap.docs.map((d) => {
    const data = d.data();

    return {
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
 * Aktualizuje TYLKO dane rodzica.
 * Dzieci są zarządzane osobno w kolekcji `children`.
 */
export async function updateUserProfile(
  uid: string,
  data: ParentFormData
) {
  const { children, ...parent } = data;

  await updateDoc(doc(db, "users", uid), {
    ...parent,
    updatedAt: Date.now(),
  });
}
