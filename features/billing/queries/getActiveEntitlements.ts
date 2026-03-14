import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Entitlement } from "@/types/entitlements";

export async function getActiveEntitlements(parentId: string): Promise<Entitlement[]> {
  const snap = await getDocs(
    query(
      collection(db, "entitlements"),
      where("parentId", "==", parentId),
      where("status", "==", "active")
    )
  );

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Entitlement, "id">) }));
}
