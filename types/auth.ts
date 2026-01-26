import type { User } from "firebase/auth";

export type AuthState = {
  user: User | null;
  loading: boolean;
};

export type ParentProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  street: string;
  houseNumber: string;
  apartmentNumber?: string;
  postalCode: string;
  city: string;

  role: "user" | "admin";
  createdAt?: number;
};


export type ChildInput = {
  firstName: string;
  lastName: string;
  ageYears: number | "";
};
