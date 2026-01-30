export type RecurrenceType = "none" | "weekly" | "biweekly" | "monthly";

export type ClassRecurrence = {
  type: RecurrenceType;
  interval: number;       // 1=co tydzień, 2=co 2 tyg.
  startDate: string;      // YYYY-MM-DD
  endDate?: string;
};

export type ClassIcon =
  | "music"
  | "guitar"
  | "piano"
  | "mic"
  | "headphones"
  | "drums";

export type ClassCategory = "music" | "theory" | "workshop" | "other";

export type Class = {
  id: string;

  title: string;
  description?: string;

  instructorName: string;
  color: string;


  location: string;
  category: ClassCategory;

  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7; // pon=1
  startTime: string; // "14:00"
  endTime: string;   // "15:00"

  recurrence: ClassRecurrence;

  enrolledChildrenIds: string[];
  groupIds?: string[];            

  icon?: ClassIcon;
  imageUrl?: string;

  capacity?: number;
  
  isActive: boolean;
  createdAt: number;
  createdBy: string;
};
