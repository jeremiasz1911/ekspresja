import type { Plan } from "./plans";

export type PurchaseContext =
  | {
      type: "class_enrollment";
      classId: string;
      childId: string;
      dateYMD?: string; // optional initial date for credits enrollment (YYYY-MM-DD)
    }
  | {
      type: "music_access";
    }
  | {
      type: "generic";
    };

export type PurchaseResult =
  | {
      status: "redirect";
      paymentIntentId: string;
    }
  | {
      status: "completed";
    };
