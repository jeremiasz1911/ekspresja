import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { PaymentIntent } from "@/types/payment-intents";

export async function getParentPaymentIntents(parentId: string): Promise<PaymentIntent[]> {
  const snap = await getDocs(
    query(collection(db, "payment_intents"), where("parentId", "==", parentId))
  );

  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentIntent, "id">) }))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}
