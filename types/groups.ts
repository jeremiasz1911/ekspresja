export type Group = {
  id: string;
  name: string;
  description?: string;
  color?: string;

  childIds: string[];

  createdAt: number;
};
