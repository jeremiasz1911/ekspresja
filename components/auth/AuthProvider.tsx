"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import type { AuthState } from "@/types/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { heartbeat, setOffline, setOnline } from "@/services/presence.service";

const AuthContext = createContext<AuthState | null>(null);

function normalizeProvider(u: User): "google" | "facebook" | "password" {
  // providerData bywa puste lub ma wiele wpisów; bierzemy pierwszy sensowny
  const pid = u.providerData?.find((p) => p?.providerId)?.providerId;

  if (pid === "google.com") return "google";
  if (pid === "facebook.com") return "facebook";
  return "password";
}

async function updateLoginMeta(u: User) {
  // setDoc + merge => nie wywali błędu gdy users/{uid} nie istnieje jeszcze
  await setDoc(
    doc(db, "users", u.uid),
    {
      provider: normalizeProvider(u),
      lastLoginAt: Date.now(),
      lastLoginAtServer: serverTimestamp(),
    },
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) tylko listen auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2) metadane + presence (osobny effect => poprawny cleanup)
  useEffect(() => {
    if (!user) return;

    let alive = true;

    // ---- meta logowania (jednorazowo po wejściu usera) ----
    updateLoginMeta(user).catch((err) => {
      console.warn("Nie udało się zapisać meta logowania", err);
    });

    // ---- presence start ----
    setOnline(user.uid).catch(() => {});

    // heartbeat co 30s
    const intervalId = window.setInterval(() => {
      if (!alive) return;
      heartbeat(user.uid).catch(() => {});
    }, 30_000);

    // gdy tab znika => offline; gdy wraca => online
    const onVis = () => {
      if (!alive) return;
      if (document.visibilityState === "hidden") {
        setOffline(user.uid).catch(() => {});
      } else {
        setOnline(user.uid).catch(() => {});
      }
    };

    // zamknięcie karty / reload (best effort)
    const onBeforeUnload = () => {
      setOffline(user.uid).catch(() => {});
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onBeforeUnload);

      // best effort offline na cleanup (np. wylogowanie / zmiana usera)
      setOffline(user.uid).catch(() => {});
    };
  }, [user]);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
