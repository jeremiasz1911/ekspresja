export type AdminChild = {
  id: string;
  firstName: string;
  lastName: string;
};

export type AdminUser = {
  id: string;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  provider: "google" | "facebook" | "password";
  lastLoginAt?: number;
  
  children: AdminChild[];

  presence?: {
    lastSeenAt?: number;
    state?: "online" | "offline";
  };

  createdAt?: number;
};
