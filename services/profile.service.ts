import { db } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { ParentFormData } from "@/types/profile";

export async function getUserProfile(uid: string): Promise<ParentFormData> {
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    throw new Error("Profil nie istnieje");
  }

  const data = snap.data();

  return {
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",

    street: data.street ?? "",
    houseNumber: data.houseNumber ?? "",
    apartmentNumber: data.apartmentNumber ?? "",
    postalCode: data.postalCode ?? "",
    city: data.city ?? "",

    children: data.children ?? [],
  };
}

export async function updateUserProfile(
  uid: string,
  data: ParentFormData
) {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: Date.now(),
  });
}
