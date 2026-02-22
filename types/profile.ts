import type { ChildInput } from "./auth";

export type ParentFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  street: string;
  houseNumber: string;
  apartmentNumber?: string;
  postalCode: string;
  city: string;

  // 🔥 żeby móc update/delete w kolekcji children
  children: (ChildInput & { id?: string })[];
};
