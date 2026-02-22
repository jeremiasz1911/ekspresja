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

function stripUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) return obj as any;
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out;
  }
  return obj;
}

export async function createPaymentIntent(
  data: Omit<PaymentIntent, "id" | "status" | "createdAt">
) {
  const payload = stripUndefined({
    ...data,
    status: "created" satisfies PaymentIntentStatus,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });

  const ref = await addDoc(collection(db, "payment_intents"), payload);
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
  const payload = stripUndefined({
    status,
    ...(patch ?? {}),
    updatedAt: Date.now(),
  });

  await updateDoc(doc(db, "payment_intents", id), payload);
}
