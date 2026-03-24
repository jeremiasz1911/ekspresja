"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { invalidateAuthGateCache } from "@/components/auth/AuthGate";
import { ParentProfileForm } from "@/components/profile/ParentProfileForm";
import type { ParentFormData } from "@/types/profile";
import { createParentAndChildren } from "@/features/profile/children";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertTriangleIcon, CheckCircle2, Info, Sparkles } from "lucide-react";

function CompleteProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
      uid: user!.uid,
      parent: {
        ...data,
        role: "user",
      },
      children: data.children,
    });

    invalidateAuthGateCache(user!.uid);

    const next = searchParams.get("next");
    router.replace(next || "/dashboard");
  }

  return (
    <main className="min-h-screen bg-zinc-50 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 sm:px-6">
        <Card className="overflow-hidden border-zinc-200 bg-white">
          <div className="hero-gradient-slow h-1.5 w-full" />
          <CardHeader className="pb-3">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              <Sparkles className="h-3.5 w-3.5" />
              Ostatni krok konfiguracji konta
            </div>
            <CardTitle className="text-2xl font-bold text-zinc-900">
              Uzupełnij profil
            </CardTitle>
            <p className="text-sm text-zinc-600">
              Po zapisaniu danych od razu przejdziesz do panelu i zapisów na zajęcia.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-zinc-600">
                <span>Postęp uruchomienia konta</span>
                <span className="font-semibold text-zinc-800">80%</span>
              </div>
              <Progress value={80} />
            </div>

            <div className="grid gap-2 text-xs sm:grid-cols-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Konto aktywne
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Logowanie gotowe
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                <AlertTriangleIcon className="h-4 w-4" />
                Brakuje danych profilu
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
            <AlertTriangleIcon />
            <AlertTitle>Uzupełnij dane</AlertTitle>
            <AlertDescription>
              Aby korzystać z aplikacji, uzupełnij dane kontaktowe i dane dzieci.
            </AlertDescription>
          </Alert>

          <Alert className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-50">
            <Info />
            <AlertTitle>Logowanie Google</AlertTitle>
            <AlertDescription>
              Jeśli część informacji nie została pobrana z konta Google, wpisz je ręcznie i zapisz profil.
            </AlertDescription>
          </Alert>
        </div>

        <Card className="border-zinc-200 bg-white">
          <CardContent className="pt-6">
            <ParentProfileForm
              initialValues={initialValues}
              mode="complete"
              submitLabel="Zapisz profil"
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>

        <Separator />
        <p className="text-center text-xs text-zinc-500">
          Dane możesz później edytować w panelu: Profil.
        </p>
      </div>
    </main>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <CompleteProfileContent />
    </Suspense>
  );
}