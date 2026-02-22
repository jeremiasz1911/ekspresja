import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

import { orderBy, limit } from "firebase/firestore";
import type { EnrollmentRequest, PaymentMethod } from "@/types";

/**
 * User: wysyła prośbę o zapis dziecka na zajęcia
 */
export async function createEnrollmentRequest(params: {
  parentId: string;
  childId: string;
  classId: string;
  paymentMethod: PaymentMethod;
}) {
  const { parentId, childId, classId, paymentMethod } = params;

  // zabezpieczenie: czy nie ma już requesta
  const existing = await getDocs(
    query(
      collection(db, "enrollment_requests"),
      where("childId", "==", childId),
      where("classId", "==", classId),
      where("status", "in", ["pending", "approved"])
    )
  );

  if (!existing.empty) {
    throw new Error("Zgłoszenie już istnieje dla tego dziecka i zajęć.");
  }

  await addDoc(collection(db, "enrollment_requests"), {
    parentId,
    childId,
    classId,
    paymentMethod,
    status: paymentMethod === "online" ? "approved" : "pending",
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
}

/**
 * User: pobiera swoje zgłoszenia
 */
export async function getParentenrollment_requests(
  parentId: string
): Promise<EnrollmentRequest[]> {
  const q = query(
    collection(db, "enrollment_requests"),
    where("parentId", "==", parentId)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<EnrollmentRequest, "id">),
  }));
}

/**
 * User: anulowanie zgłoszenia (tylko pending)
 */
export async function cancelEnrollmentRequest(requestId: string) {
  await updateDoc(doc(db, "enrollment_requests", requestId), {
    status: "rejected",
  });
}

/**
 * Sprawdza czy istnieje zgłoszenie dla dziecka i zajęć
 */
export async function getEnrollmentRequestForChild(
  childId: string,
  classId: string
): Promise<EnrollmentRequest | null> {
  const snap = await getDocs(
    query(
      collection(db, "enrollment_requests"),
      where("childId", "==", childId),
      where("classId", "==", classId)
    )
  );

  if (snap.empty) return null;

  const all = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<EnrollmentRequest, "id">),
  })) as EnrollmentRequest[];

  // preferuj aktywne statusy
  const active = all.find((r) => r.status === "approved" || r.status === "pending");
  if (active) return active;

  // fallback: zwróć “jakiś” (np. ostatni po createdAt jeśli jest)
  all.sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  return all[0] ?? null;
}

/**
 * User: wycofanie zgłoszenia
 */
export async function withdrawEnrollmentRequest(
  requestId: string
) {
  console.log("DELETE enrollment_requests:", requestId);

  await deleteDoc(
    doc(db, "enrollment_requests", requestId)
  );
}