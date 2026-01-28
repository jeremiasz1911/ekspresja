import { db } from "@/lib/firebase/client";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { ParentProfile, ChildInput } from "@/types/auth";

export type ParentProfileWithChildren = ParentProfile & {
  children: Array<
    ChildInput & {
      id: string;
    }
  >;
};

/**
 * Sprawdza czy dokument users/{uid} istnieje
 */
export async function doesUserProfileExist(
  uid: string
): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists();
}

/**
 * Pobiera:
 *  - dane rodzica z users/{uid}
 *  - dzieci z children where parentId == uid
 */
export async function getParentProfile(
  uid: string
): Promise<ParentProfileWithChildren | null> {
  // parent
  const parentSnap = await getDoc(doc(db, "users", uid));
  if (!parentSnap.exists()) return null;

  const parent = parentSnap.data() as ParentProfile;

  // children
  const q = query(
    collection(db, "children"),
    where("parentId", "==", uid)
  );

  const childrenSnap = await getDocs(q);

  const children = childrenSnap.docs.map((d) => {
    const data = d.data();

    return {
      id: d.id,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      ageYears: data.ageYears ?? "",
    };
  });

  return {
    ...parent,
    children,
  };
}

/**
 * Sprawdza czy profil ma wymagane dane
 */
export async function isProfileComplete(
  uid: string
): Promise<boolean> {
  const profile = await getParentProfile(uid);
  if (!profile) return false;

  if (!profile.firstName?.trim()) return false;
  if (!profile.lastName?.trim()) return false;
  if (!profile.email?.trim()) return false;
  if (!profile.phone?.trim()) return false;

  if (!profile.children || profile.children.length === 0) {
    return false;
  }

  return true;
}


export async function getUserRole(uid: string): Promise<"user" | "admin" | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;

  return snap.data().role ?? "user";
}
