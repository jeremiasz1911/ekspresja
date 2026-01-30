export type PaymentProvider = "tpay";

export type PaymentIntentStatus =
  | "created"
  | "redirected"
  | "paid"
  | "failed"
  | "cancelled";

export type PaymentIntent = {
  id: string;

  parentId: string;
  childId?: string; // zależy od planu
  planId: string;

  amountCents: number;
  currency: "PLN";

  provider: PaymentProvider;
  providerTransactionId?: string;

  status: PaymentIntentStatus;

  // kontekst zakupu
  metadata?: {
    classId?: string;
    occurrenceId?: string; // dla jednorazówek
  };

  createdAt: number;
  paidAt?: number;
};
