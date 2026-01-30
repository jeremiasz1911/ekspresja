// services/payments.service.ts

import { db } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import type { Payment, PaymentStatus } from "@/types/payments";

/* ================= CREATE ================= */

export async function createPayment(params: {
  parentId: string;
  childId: string;
  classId: string;
  enrollmentRequestId: string;
  amountCents: number;
}): Promise<string> {
  const ref = await addDoc(collection(db, "payments"), {
    parentId: params.parentId,
    childId: params.childId,
    classId: params.classId,
    enrollmentRequestId: params.enrollmentRequestId,

    amountCents: params.amountCents,
    currency: "PLN",

    provider: "tpay",
    status: "created",

    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });

  return ref.id;
}

/* ================= READ ================= */

export async function getPaymentById(
  paymentId: string
): Promise<Payment | null> {
  const snap = await getDoc(doc(db, "payments", paymentId));
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<Payment, "id">),
  };
}

export async function getPaymentForEnrollment(
  enrollmentRequestId: string
): Promise<Payment | null> {
  const q = query(
    collection(db, "payments"),
    where("enrollmentRequestId", "==", enrollmentRequestId)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const d = snap.docs[0];
  return {
    id: d.id,
    ...(d.data() as Omit<Payment, "id">),
  };
}

/* ================= UPDATE ================= */

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  providerTransactionId?: string
) {
  const data: any = {
    status,
  };

  if (status === "paid") {
    data.paidAt = Date.now();
  }

  if (providerTransactionId) {
    data.providerTransactionId = providerTransactionId;
  }

  await updateDoc(doc(db, "payments", paymentId), data);
}
