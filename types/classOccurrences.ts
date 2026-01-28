type ClassOccurrence = {
  classId: string;
  date: "2026-02-03";
  startTime: "14:00";
  endTime: "15:00";

  overridden?: boolean;
  cancelled?: boolean;

  attendance?: {
    childId: string;
    present: boolean;
  }[];
};
