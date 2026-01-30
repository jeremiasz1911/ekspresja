export type Event = {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  location?: string;
  createdAt: number;
};