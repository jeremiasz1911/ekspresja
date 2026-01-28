import { db } from "@/lib/firebase/client";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import type { ChildWithParent } from "@/types/children";

export async function getAllChildren(): Promise<ChildWithParent[]> {
  const snap = await getDocs(collection(db, "children"));

  const children = await Promise.all(
    snap.docs.map(async (docSnap) => {
      const data = docSnap.data();

      let parentName = "—";

      if (data.parentId) {
        const parentSnap = await getDoc(
          doc(db, "users", String(data.parentId))
        );

        if (parentSnap.exists()) {
          const p = parentSnap.data();
          parentName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—";
        }
      }

      return {
        id: docSnap.id,
        firstName: String(data.firstName ?? ""),
        lastName: String(data.lastName ?? ""),
        ageYears: Number(data.ageYears ?? 0),
        parentId: String(data.parentId ?? ""),
        parentName,
      };
    })
  );

  return children;
}
