export type Enrollment = {
  id: string;
  classId: string;
  childId: string;
  parentId: string;

  status?: "active" | "cancelled";

  createdAt: number;
};
