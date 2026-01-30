// types/payments.ts

export type PaymentProvider = "tpay";

export type PaymentStatus =
  | "created"     // utworzona lokalnie
  | "pending"     // przekierowano do Tpay
  | "paid"        // webhook potwierdził
  | "failed"      // płatność nieudana
  | "cancelled";  // anulowana

export type Payment = {
  id: string;

  // powiązania
  parentId: string;
  childId: string;
  classId: string;
  enrollmentRequestId: string;

  // kwota
  amountCents: number;
  currency: "PLN";

  // provider
  provider: PaymentProvider;
  providerTransactionId?: string; // np. tpay transactionId

  status: PaymentStatus;

  createdAt: number;
  paidAt?: number;
};
