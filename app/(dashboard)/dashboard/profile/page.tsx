"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParentProfileForm } from "@/components/profile/ParentProfileForm";
import type { ParentFormData } from "@/types/profile";
import {
  getUserProfile,
  updateUserProfile,
} from "@/features/profile/children";
import { getActiveEntitlements } from "@/features/billing";
import { getActiveClasses, getParentEnrollments } from "@/features/classes";

export default function ProfilePage() {
  const { user } = useAuth();
  const [initialValues, setInitialValues] =
    useState<ParentFormData | null>(null);
  const [childInsights, setChildInsights] = useState<
    Record<string, { activeEntitlements: number; activeEnrollments: number; classTitles: string[] }>
  >({});

  const [loading, setLoading] = useState(true);

  async function hydrateProfile(uid: string) {
    const [profile, entitlements, enrollments, classes] = await Promise.all([
      getUserProfile(uid),
      getActiveEntitlements(uid),
      getParentEnrollments(uid),
      getActiveClasses(),
    ]);

    setInitialValues(profile);

    const classTitleById = new Map(classes.map((cls) => [cls.id, cls.title]));
    const perChild: Record<string, { activeEntitlements: number; activeEnrollments: number; classTitles: string[] }> = {};

    profile.children.forEach((child) => {
      if (!child.id) return;
      const childEntitlements = entitlements.filter((e) => e.childId === child.id);
      const childEnrollments = enrollments.filter(
        (e) => e.childId === child.id && e.status !== "cancelled"
      );
      const classTitles = [...new Set(childEnrollments.map((e) => classTitleById.get(e.classId) ?? "Nieznane zajęcia"))].slice(0, 3);

      perChild[child.id] = {
        activeEntitlements: childEntitlements.length,
        activeEnrollments: childEnrollments.length,
        classTitles,
      };
    });

    setChildInsights(perChild);
  }

  useEffect(() => {
    if (!user) return;

    hydrateProfile(user.uid)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="p-6">Ładowanie profilu...</div>;
  }

  if (!initialValues) {
    return <div className="p-6">Nie znaleziono profilu.</div>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Edytuj dane profilu</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Aktualizuj dane kontaktowe i informacje o dzieciach.
        </p>
      </section>

      <section className="mx-auto w-full max-w-3xl rounded-3xl border bg-white p-4 shadow-sm md:p-6">
        <ParentProfileForm
        initialValues={initialValues}
        childInsights={childInsights}
        mode="edit"
        submitLabel="Zapisz zmiany"
        onSubmit={async (data) => {
          if (!user) return;
          await updateUserProfile(user.uid, data);
          await hydrateProfile(user.uid);
        }}
      />
      </section>
    </div>
  );
}
