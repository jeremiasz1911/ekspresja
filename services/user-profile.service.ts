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
import type { Child } from "@/types/child"; // <- dostosuj jeśli eksportujesz z "@/types"

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
export async function getParentProfile(parentId: string) {
  // 1) users/{uid} – dane rodzica
  const userSnap = await getDoc(doc(db, "users", parentId));
  const userData = userSnap.exists() ? (userSnap.data() as any) : null;

  // 2) children – dzieci jako osobna kolekcja (prawdziwe źródło)
  const kidsSnap = await getDocs(
    query(collection(db, "children"), where("parentId", "==", parentId))
  );

  const children: Child[] = kidsSnap.docs
    .map((d) => {
      const data = d.data() as any;

      return {
        id: d.id,
        firstName: String(data.firstName ?? ""),
        lastName: String(data.lastName ?? ""),
        ageYears: Number(data.ageYears ?? 0),
        parentId: String(data.parentId ?? parentId),
        active: data.active !== false,
        createdAt: Number(data.createdAt ?? Date.now()),
      } satisfies Child;
    })
    .filter((c) => c.active)
    .filter((c) => c.firstName && c.lastName && c.ageYears > 0);

  return {
    id: parentId,
    ...(userData ?? {}),
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
