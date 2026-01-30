import { db } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { PaymentIntent, PaymentIntentStatus } from "@/types/payment-intents";

export async function createPaymentIntent(data: Omit<PaymentIntent, "id" | "status" | "createdAt">) {
  const ref = await addDoc(collection(db, "payment_intents"), {
    ...data,
    status: "created" satisfies PaymentIntentStatus,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
  return ref.id;
}

export async function getPaymentIntent(id: string): Promise<PaymentIntent | null> {
  const snap = await getDoc(doc(db, "payment_intents", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<PaymentIntent, "id">) };
}

export async function updatePaymentIntentStatus(
  id: string,
  status: PaymentIntentStatus,
  patch?: Partial<Pick<PaymentIntent, "providerTransactionId" | "paidAt">>
) {
  await updateDoc(doc(db, "payment_intents", id), {
    status,
    ...(patch ?? {}),
    updatedAt: Date.now(),
  });
}
