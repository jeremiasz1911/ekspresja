import { db } from "@/lib/firebase/client";
import {
  collection,
  getDocsFromServer,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export type Reservation = {
  id: string;
  parentId: string;
  childId: string;
  classId: string;
  dateYMD: string; // YYYY-MM-DD
  status: "active" | "cancelled";
  paymentMethod?: "credits" | "one_off" | "online";
  entitlementId?: string;
  createdAt?: number;
};

export async function getParentReservationsInRange(params: {
  parentId: string;
  fromYMD: string; // inclusive
  toYMD: string;   // inclusive
}) {
  const { parentId, fromYMD, toYMD } = params;

  // ⚠️ może wymagać indeksu złożonego:
  // parentId + status + dateYMD
  const q = query(
    collection(db, "reservations"),
    where("parentId", "==", parentId),
    where("status", "==", "active"),
    where("dateYMD", ">=", fromYMD),
    where("dateYMD", "<=", toYMD),
    orderBy("dateYMD", "asc")
  );

  const snap = await getDocsFromServer(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Reservation, "id">),
  })) as Reservation[];
}
