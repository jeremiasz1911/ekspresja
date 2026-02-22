export type Enrollment = {
  id: string;
  classId: string;
  childId: string;
  parentId: string;

  status?: "active" | "cancelled";

  /**
   * standing  = stały zapis (kalendarz generuje tygodnie z recurrence)
   * occurrences = zapis na konkretne daty (one-off / kredyty)
   */
  mode?: "standing" | "occurrences";

  /** używane tylko gdy mode==="occurrences" */
  occurrenceDates?: string[]; // ["2026-02-07", "2026-02-14", ...]

  createdAt: number;
};
