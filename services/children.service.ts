import { db } from "@/lib/firebase/client";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";


import type { Child } from "@/types/children";
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
export async function getChildrenForParent(parentId: string) {
  const q = query(
    collection(db, "children"),
    where("parentId", "==", parentId)
  );

  const snap = await getDocs(q);

  console.log("getChildrenForParent", parentId, "=>", snap.size);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  }));
}

export async function syncChildrenForParent(params: {
  parentId: string;
  children: Array<{ firstName: string; lastName: string; ageYears: number | string }>;
}) {
  const { parentId, children } = params;

  // 1) pobierz obecne dzieci tego rodzica
  const existingSnap = await getDocs(
    query(collection(db, "children"), where("parentId", "==", parentId))
  );

  const batch = writeBatch(db);

  // 2) oznacz stare jako nieaktywne (żeby nie dublować)
  existingSnap.forEach((d) => {
    batch.update(d.ref, {
      active: false,
      updatedAtServer: serverTimestamp(),
    });
  });

  // 3) wstaw nowe jako aktywne
  for (const c of children) {
    const firstName = String(c.firstName ?? "").trim();
    const lastName = String(c.lastName ?? "").trim();
    const ageYears = Number(c.ageYears);

    if (!firstName || !lastName || !ageYears) continue;

    const ref = doc(collection(db, "children"));
    batch.set(ref, {
      parentId,
      firstName,
      lastName,
      ageYears,
      active: true,
      createdAt: Date.now(),
      createdAtServer: serverTimestamp(),
    });
  }

  await batch.commit();
}
export type ChildUpsertInput = {
  id?: string;
  firstName: string;
  lastName: string;
  ageYears: number | string;
};

export async function upsertChildrenForParent(params: {
  parentId: string;
  children: ChildUpsertInput[];
}) {
  const { parentId, children } = params;

  // obecne dzieci rodzica
  const existingSnap = await getDocs(
    query(collection(db, "children"), where("parentId", "==", parentId))
  );

  const existingIds = new Set(existingSnap.docs.map((d) => d.id));
  const incoming = children
    .map((c) => ({
      id: c.id?.trim() || undefined,
      firstName: String(c.firstName ?? "").trim(),
      lastName: String(c.lastName ?? "").trim(),
      ageYears: Number(c.ageYears),
    }))
    .filter((c) => c.firstName && c.lastName && c.ageYears > 0);

  const keepIds = new Set(incoming.filter((c) => c.id).map((c) => c.id!));

  const batch = writeBatch(db);

  // 1) dzieci, których nie ma już w formularzu → active:false
  existingSnap.docs.forEach((d) => {
    if (!keepIds.has(d.id)) {
      batch.update(d.ref, {
        active: false,
        updatedAtServer: serverTimestamp(),
      });
    }
  });

  // 2) upsert dzieci z formularza
  for (const c of incoming) {
    if (c.id && existingIds.has(c.id)) {
      batch.update(doc(db, "children", c.id), {
        firstName: c.firstName,
        lastName: c.lastName,
        ageYears: c.ageYears,
        active: true,
        updatedAtServer: serverTimestamp(),
      });
    } else {
      const ref = doc(collection(db, "children"));
      batch.set(ref, {
        parentId,
        firstName: c.firstName,
        lastName: c.lastName,
        ageYears: c.ageYears,
        active: true,
        createdAt: Date.now(),
        createdAtServer: serverTimestamp(),
      });
    }
  }

  await batch.commit();
}