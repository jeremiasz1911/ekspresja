export type EnrollmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "canceled_by_admin";  

export type enrollment_requeststatus =
  | "pending"              // wysłane, czeka
  | "approved"             // zapisany
  | "rejected"             // odrzucone przez admina
  | "canceled_by_admin";   // anulowane przez admina

export type PaymentMethod =
  | "credits"
  | "online"
  | "cash"
  | "declaration";

export type EnrollmentRequest = {
  id: string;
  classId: string;
  childId: string;
  parentId: string;

  status: EnrollmentStatus;
  paymentMethod: PaymentMethod;

  createdAt: number;
};
