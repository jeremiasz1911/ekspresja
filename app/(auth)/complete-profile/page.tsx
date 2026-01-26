"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParentProfileForm } from "@/components/profile/ParentProfileForm";
import type { ParentFormData } from "@/types/profile";
import { createParentAndChildren } from "@/services/registration.service";

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const [firstName = "", lastName = ""] = user.displayName?.split(" ") ?? [];

  const initialValues: ParentFormData = {
    firstName,
    lastName,
    email: user.email ?? "",
    phone: "",

    street: "",
    houseNumber: "",
    apartmentNumber: "",
    postalCode: "",
    city: "",

    children: [{ firstName: "", lastName: "", ageYears: "" }],
};


  async function handleSubmit(data: ParentFormData) {
    await createParentAndChildren({
      uid: user.uid,
      parent: {
        ...data,
        role: "user",
      },
      children: data.children,
    });

    router.replace("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Uzupełnij profil</h1>

      <ParentProfileForm
        initialValues={initialValues}
        mode="complete"
        submitLabel="Zapisz profil"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
