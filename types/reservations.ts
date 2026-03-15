export type Reservation = {
  id: string;
  parentId: string;
  childId: string;
  classId: string;
  dateYMD: string;
  status: "active" | "cancelled";
  paymentMethod?: "credits" | "one_off" | "online";
  entitlementId?: string;
  createdAt?: number;
};
