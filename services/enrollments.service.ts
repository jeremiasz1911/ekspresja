import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import type { Enrollment, Class } from "@/types";

/**
 * Sprawdza czy dziecko jest już zapisane na dane zajęcia
 */
export async function isChildEnrolled(
  childId: string,
  classId: string
): Promise<boolean> {
  const q = query(
    collection(db, "enrollments"),
    where("childId", "==", childId),
    where("classId", "==", classId)
  );

  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Pobiera wszystkie zapisy rodzica
 */
export async function getParentEnrollments(
  parentId: string
): Promise<Enrollment[]> {
  const q = query(
    collection(db, "enrollments"),
    where("parentId", "==", parentId)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Enrollment, "id">),
  }));
}

/**
 * Zapisuje dziecko na zajęcia
 */
export async function enrollChildToClass(params: {
  parentId: string;
  childId: string;
  classId: string;
}) {
  const { parentId, childId, classId } = params;

  // 1. Czy już zapisany?
  const already = await isChildEnrolled(childId, classId);
  if (already) {
    throw new Error("Dziecko jest już zapisane na te zajęcia");
  }

  // 2. Zobacz ile osób już zapisanych
  const enrollmentsSnap = await getDocs(
    query(
      collection(db, "enrollments"),
      where("classId", "==", classId)
    )
  );

  const enrolledCount = enrollmentsSnap.size;

  // 3. Pobierz limit z class
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      throw new Error("Zajęcia nie istnieją");
    }

    const classData = classSnap.data() as Class;

    if (classData.capacity && enrolledCount >= classData.capacity) {
      throw new Error("Brak wolnych miejsc na zajęcia");
    }


  if (!classSnap) {
    throw new Error("Zajęcia nie istnieją");
  }

  if (classData.capacity && enrolledCount >= classData.capacity) {
    throw new Error("Brak wolnych miejsc na zajęcia");
  }

  // 4. Zapis
  await addDoc(collection(db, "enrollments"), {
    parentId,
    childId,
    classId,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
}

/**
 * Wypisanie dziecka z zajęć
 */
export async function cancelEnrollment(enrollmentId: string) {
  await deleteDoc(doc(db, "enrollments", enrollmentId));
}
