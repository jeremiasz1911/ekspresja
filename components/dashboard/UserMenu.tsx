"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex gap-2 items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? undefined} />
            <AvatarFallback>
              {user.displayName?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>

          <span className="text-sm hidden sm:block">
            {user.displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
          Profil
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          Ustawienia
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-red-600"
          onClick={() => signOut(auth)}
        >
          Wyloguj
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
