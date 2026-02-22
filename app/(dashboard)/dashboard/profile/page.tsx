"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParentProfileForm } from "@/components/profile/ParentProfileForm";
import type { ParentFormData } from "@/types/profile";
import {
  getUserProfile,
  updateUserProfile,
} from "@/services/profile.service";

export default function ProfilePage() {
  const { user } = useAuth();
  const [initialValues, setInitialValues] =
    useState<ParentFormData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    getUserProfile(user.uid)
      .then(setInitialValues)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="p-6">Ładowanie profilu...</div>;
  }

  if (!initialValues) {
    return <div className="p-6">Nie znaleziono profilu.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Edytuj dane profilu</h1>

     <ParentProfileForm
        initialValues={initialValues}
        mode="edit"
        submitLabel="Zapisz zmiany"
        onSubmit={async (data) => {
          if (!user) return;
          await updateUserProfile(user.uid, data);

          // 🔥 refetch, żeby pobrać dzieci już z id i nie robić duplikatów przy kolejnym zapisie
          const fresh = await getUserProfile(user.uid);
          setInitialValues(fresh);
        }}
      />

    </div>
  );
}
