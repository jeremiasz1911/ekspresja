import type { Class } from "./classes";
import type { Child } from "./child";
import type { Enrollment } from "./enrollments";

export type ScheduleItem = {
  class: Class;
  child: Child;
  enrollment: Enrollment;
};
