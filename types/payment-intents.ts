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
  email?: string;
  payerName?: string;
  childId?: string; // zależy od planu
  planId: string;
  
  amountCents: number;
  currency: "PLN";
  description: string;
  
  provider: PaymentProvider;
  providerTransactionId?: string;

  status: PaymentIntentStatus;

  // kontekst zakupu
  metadata?: {
    classId?: string;
    childId?: string;
    occurrenceId?: string;
    enrollNow?: boolean;
  };

  createdAt: number;
  paidAt?: number;
};
