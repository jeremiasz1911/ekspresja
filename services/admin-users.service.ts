import { db } from "@/lib/firebase/client";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import type { AdminUser } from "@/types/admin";

export async function getAdminUsers(): Promise<AdminUser[]> {
  const [usersSnap, childrenSnap, presenceSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "children")),
    getDocs(collection(db, "presence")), // 👈 presence
  ]);

  // --- dzieci grupowane po parentId ---
  const childrenByParent: Record<string, AdminUser["children"]> = {};

  childrenSnap.docs.forEach((doc) => {
    const c = doc.data();
    if (!c.parentId) return;

    if (!childrenByParent[c.parentId]) {
      childrenByParent[c.parentId] = [];
    }

    childrenByParent[c.parentId].push({
      id: doc.id,
      firstName: c.firstName ?? "",
      lastName: c.lastName ?? "",
    });
  });

  // --- presence map ---
  const presenceByUser: Record<
    string,
    { lastSeenAt?: number; state?: "online" | "offline" }
  > = {};

  presenceSnap.docs.forEach((doc) => {
    const p = doc.data();

    presenceByUser[doc.id] = {
      lastSeenAt: p.lastSeenAt,
      state: p.state,
    };
  });

  // --- users ---
  return usersSnap.docs.map((docSnap) => {
    const u = docSnap.data();

    return {
      id: docSnap.id,
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      email: u.email ?? "",
      phone: u.phone,
      provider: u.provider ?? "password",
      lastLoginAt: u.lastLoginAt,
      children: childrenByParent[docSnap.id] ?? [],

      // 👇 presence wpięte w usera
      presence: presenceByUser[docSnap.id],
    };
  });
}

export async function updateUser(
  id: string,
  patch: Partial<AdminUser>
) {
  await updateDoc(doc(db, "users", id), patch);
}

export async function deleteUser(id: string) {
  await deleteDoc(doc(db, "users", id));
}
