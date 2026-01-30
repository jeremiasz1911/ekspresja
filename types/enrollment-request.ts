export type EnrollmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "canceled_by_admin";  

export type EnrollmentRequestStatus =
  | "pending"              // wysłane, czeka
  | "approved"             // zapisany
  | "rejected"             // odrzucone przez admina
  | "canceled_by_admin";   // anulowane przez admina

export type PaymentMethod =
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
