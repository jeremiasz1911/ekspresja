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

  childId?: string; // (opcjonalne) jeśli gdzieś tego używasz
  planId: string;

  amountCents: number;
  currency: "PLN";
  description: string;

  provider: PaymentProvider;
  providerTransactionId?: string;

  status: PaymentIntentStatus;
  providerTitle?: string;

  processingAt?: number;          // ✅ było w intentKeys u Ciebie
  finalizedAt?: number;
  finalizeError?: string | null;  // ✅ NOWE: żeby UI nie wisiało

  updatedAt?: number;

  metadata?: {
    classId?: string;
    childId?: string;
    occurrenceId?: string;
    enrollNow?: boolean;

    dateYMD?: string;
    dates?: string[];
  };

  createdAt: number;
  paidAt?: number;
};