"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getAdminUsers } from "@/features/admin";
import type { AdminUser } from "@/types/admin";
import type { PaymentIntent } from "@/types/payment-intents";
import type { Plan } from "@/types/plans";
import type { Entitlement } from "@/types/entitlements";
import type { Reservation } from "@/types/reservations";
import type { EnrollmentRequest } from "@/types/enrollment-request";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("pl-PL");
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [recentPaid, setRecentPaid] = useState<PaymentIntent[]>([]);
  const [allPaymentIntents, setAllPaymentIntents] = useState<PaymentIntent[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [chatThreads, setChatThreads] = useState<Array<{ unreadForAdmin?: number; status?: string; lastMessageAt?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardView, setDashboardView] = useState<"overview" | "finance" | "matrix" | "credits">("overview");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAdminUsers(),
      getDocs(
        query(
          collection(db, "payment_intents"),
          orderBy("createdAt", "desc"),
          limit(500)
        )
      ),
      getDocs(collection(db, "plans")),
      getDocs(collection(db, "entitlements")),
      getDocs(collection(db, "reservations")),
      getDocs(collection(db, "enrollment_requests")),
      getDocs(collection(db, "admin_chats")),
    ])
      .then(([usersRows, paidSnap, plansSnap, entitlementsSnap, reservationsSnap, enrollmentRequestsSnap, chatsSnap]) => {
        const paymentRows = paidSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentIntent, "id">) }))
        const paidRows = paymentRows.filter((p) => p.status === "paid");

        setUsers(usersRows);
        setRecentPaid(paidRows);
        setAllPaymentIntents(paymentRows);
        setPlans(plansSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Plan, "id">) })));
        setEntitlements(
          entitlementsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Entitlement, "id">) }))
        );
        setReservations(
          reservationsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reservation, "id">) }))
        );
        setEnrollmentRequests(
          enrollmentRequestsSnap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as Omit<EnrollmentRequest, "id">) })
          )
        );
        setChatThreads(chatsSnap.docs.map((d) => d.data() as { unreadForAdmin?: number; status?: string; lastMessageAt?: number }));
      })
      .finally(() => setLoading(false));
  }, []);

  const totalChildren = useMemo(
    () => users.reduce((sum, u) => sum + (u.children?.length ?? 0), 0),
    [users]
  );
  const usersWithPaid = useMemo(
    () => new Set(recentPaid.map((p) => p.parentId)).size,
    [recentPaid]
  );
  const planById = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);
  const monthLabel = useMemo(
    () => ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"],
    []
  );
  const recentMonths = useMemo(() => {
    const now = new Date();
    const out: Array<{ key: string; label: string; year: number; month: number }> = [];
    for (let offset = -2; offset <= 2; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      out.push({ key, label: `${monthLabel[d.getMonth()]} ${d.getFullYear()}`, year: d.getFullYear(), month: d.getMonth() });
    }
    return out;
  }, [monthLabel]);
  const purchaseDetailsByParentMonth = useMemo(() => {
    const map = new Map<string, Map<string, string[]>>();
    const push = (parentId: string, period: string, value: string) => {
      if (!map.has(parentId)) map.set(parentId, new Map<string, string[]>());
      const monthMap = map.get(parentId)!;
      if (!monthMap.has(period)) monthMap.set(period, []);
      monthMap.get(period)!.push(value);
    };

    for (const p of recentPaid) {
      const ts = p.paidAt ?? p.createdAt;
      if (!ts) continue;
      const d = new Date(ts);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const plan = planById.get(p.planId);
      const purchaseType = (plan?.type ?? "").startsWith("subscription")
        ? "Subskrypcja online"
        : "Jednorazowa / pakiet online";
      push(
        p.parentId,
        period,
        `${purchaseType} • ${(p.amountCents / 100).toFixed(2)} PLN • ${new Date(ts).toLocaleDateString("pl-PL")}`
      );
    }

    for (const r of enrollmentRequests) {
      const ts = r.createdAt;
      if (!ts) continue;
      const d = new Date(ts);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (r.paymentMethod === "cash" || r.paymentMethod === "declaration") {
        const label = r.paymentMethod === "cash" ? "Gotówka" : "Deklaracja";
        push(r.parentId, period, `${label} • ${r.status} • ${new Date(ts).toLocaleDateString("pl-PL")}`);
      }
    }
    return map;
  }, [recentPaid, planById, enrollmentRequests]);
  const paymentMix = useMemo(() => {
    const out = {
      subscription: { count: 0, amount: 0 },
      packageOrOneOff: { count: 0, amount: 0 },
    };
    for (const p of recentPaid) {
      const plan = planById.get(p.planId);
      const isSub = (plan?.type ?? "").startsWith("subscription");
      if (isSub) {
        out.subscription.count += 1;
        out.subscription.amount += p.amountCents;
      } else {
        out.packageOrOneOff.count += 1;
        out.packageOrOneOff.amount += p.amountCents;
      }
    }
    return out;
  }, [recentPaid, planById]);
  const weeklyDue = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const oneOffPlan = plans.find((p) => p.type === "one_off_class");
    const oneOffPrice = oneOffPlan?.priceCents ?? 0;
    const relevant = reservations.filter((r) => {
      if (r.status !== "active") return false;
      const d = new Date(`${r.dateYMD}T12:00:00`);
      return d >= start && d <= end;
    });
    const oneOffCount = relevant.filter((r) => r.paymentMethod === "one_off").length;
    const onlineCount = relevant.filter((r) => r.paymentMethod === "online").length;
    const creditsCount = relevant.filter((r) => r.paymentMethod === "credits").length;

    return {
      totalCount: relevant.length,
      oneOffCount,
      onlineCount,
      creditsCount,
      estimatedAmountCents: (oneOffCount + onlineCount) * oneOffPrice,
    };
  }, [reservations, plans]);
  const currentPeriodKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const creditsByParent = useMemo(() => {
    const out = new Map<string, { total: number; used: number; remaining: number }>();
    for (const e of entitlements) {
      if (e.status !== "active") continue;
      const amount = e.limits?.credits?.amount ?? 0;
      if (!amount) continue;
      const used = e.usage?.credits?.[currentPeriodKey] ?? 0;
      const prev = out.get(e.parentId) ?? { total: 0, used: 0, remaining: 0 };
      const total = prev.total + amount;
      const usedSum = prev.used + used;
      out.set(e.parentId, { total, used: usedSum, remaining: Math.max(0, total - usedSum) });
    }
    return out;
  }, [entitlements, currentPeriodKey]);
  const participationStatusByParent = useMemo(() => {
    const now = Date.now();
    const out = new Map<string, { canAttend: boolean; remainingClasses: number; activeSubscription: boolean }>();
    const activeSubByParent = new Map<string, boolean>();

    for (const e of entitlements) {
      if (e.status !== "active") continue;
      if (e.validTo < now) continue;
      if (String(e.type).startsWith("subscription")) activeSubByParent.set(e.parentId, true);
    }
    for (const u of users) {
      const remaining = creditsByParent.get(u.id)?.remaining ?? 0;
      const hasFutureReservation = reservations.some((r) => {
        if (r.parentId !== u.id || r.status !== "active") return false;
        return new Date(`${r.dateYMD}T12:00:00`).getTime() >= now;
      });
      const activeSub = activeSubByParent.get(u.id) ?? false;
      const canAttend = activeSub || remaining > 0 || hasFutureReservation;
      out.set(u.id, { canAttend, remainingClasses: remaining, activeSubscription: activeSub });
    }
    return out;
  }, [users, entitlements, creditsByParent, reservations]);
  const paymentStatusStats = useMemo(() => {
    const paid = allPaymentIntents.filter((p) => p.status === "paid").length;
    const other = Math.max(0, allPaymentIntents.length - paid);
    const paidPct = allPaymentIntents.length ? Math.round((paid / allPaymentIntents.length) * 100) : 0;
    return { paid, other, paidPct };
  }, [allPaymentIntents]);
  const chatStats = useMemo(() => {
    const total = chatThreads.length;
    const unreadThreads = chatThreads.filter((t) => Number(t.unreadForAdmin ?? 0) > 0).length;
    const openThreads = chatThreads.filter((t) => (t.status ?? "open") === "open").length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeLast7d = chatThreads.filter((t) => Number(t.lastMessageAt ?? 0) >= weekAgo).length;
    return { total, unreadThreads, openThreads, activeLast7d };
  }, [chatThreads]);
  const paymentMixMax = useMemo(
    () => Math.max(paymentMix.subscription.count, paymentMix.packageOrOneOff.count, 1),
    [paymentMix]
  );
  const cardClass = "rounded-2xl border bg-white p-4 shadow-sm h-full";
  const metricClass = "rounded-2xl border bg-white p-4 shadow-sm h-full";
  const tabClass = "rounded-full border px-3 py-1.5 text-xs font-medium transition";

  return (
    <div className="mx-auto w-full max-w-[1460px] space-y-4 overflow-x-hidden">
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard admina</h1>
        <p className="mt-2 text-sm text-zinc-600">Podgląd użytkowników, dzieci i ostatnich opłaconych zamówień.</p>
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDashboardView("overview")}
          className={`${tabClass} ${dashboardView === "overview" ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-50"}`}
        >
          Przegląd
        </button>
        <button
          type="button"
          onClick={() => setDashboardView("finance")}
          className={`${tabClass} ${dashboardView === "finance" ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-50"}`}
        >
          Płatności i tabele
        </button>
        <button
          type="button"
          onClick={() => setDashboardView("matrix")}
          className={`${tabClass} ${dashboardView === "matrix" ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-50"}`}
        >
          Matryca miesięczna
        </button>
        <button
          type="button"
          onClick={() => setDashboardView("credits")}
          className={`${tabClass} ${dashboardView === "credits" ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-50"}`}
        >
          Kredyty
        </button>
      </section>

      {dashboardView === "overview" ? (
        <>
      <section className="grid auto-rows-fr gap-4 md:grid-cols-3">
        <div className={metricClass}>
          <p className="text-sm text-zinc-500">Użytkownicy</p>
          <p className="mt-1 text-2xl font-bold">{loading ? "…" : users.length}</p>
        </div>
        <div className={metricClass}>
          <p className="text-sm text-zinc-500">Dzieci w systemie</p>
          <p className="mt-1 text-2xl font-bold">{loading ? "…" : totalChildren}</p>
        </div>
        <div className={metricClass}>
          <p className="text-sm text-zinc-500">Rodzice z opłaconym zamówieniem</p>
          <p className="mt-1 text-2xl font-bold">{loading ? "…" : usersWithPaid}</p>
        </div>
      </section>

      <section className="grid auto-rows-fr gap-4 lg:grid-cols-3">
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-zinc-700">Status płatności (koło)</h2>
          {loading ? (
            <div className="mt-4 flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <div
                className="grid h-24 w-24 place-items-center rounded-full transition-all duration-700"
                style={{
                  background: `conic-gradient(#16a34a ${paymentStatusStats.paidPct}%, #e4e4e7 ${paymentStatusStats.paidPct}% 100%)`,
                }}
              >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xs font-semibold text-zinc-700">
                  {paymentStatusStats.paidPct}%
                </div>
              </div>
              <div className="text-xs text-zinc-600">
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" /> opłacone: {paymentStatusStats.paid}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-300" /> pozostałe: {paymentStatusStats.other}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-zinc-700">Mix płatności (słupki)</h2>
          {loading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-xs text-zinc-600">
              <div>
                <div className="mb-1 flex justify-between">
                  <span>Subskrypcje</span>
                  <span>{paymentMix.subscription.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                    style={{ width: `${Math.round((paymentMix.subscription.count / paymentMixMax) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span>Jednorazowe / pakiety</span>
                  <span>{paymentMix.packageOrOneOff.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-700"
                    style={{ width: `${Math.round((paymentMix.packageOrOneOff.count / paymentMixMax) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-zinc-700">Chaty (dashboard)</h2>
          {loading ? (
            <div className="mt-4 grid gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="mt-4 grid gap-2 text-xs">
              <div className="rounded-lg border bg-zinc-50 p-2">
                <span className="text-zinc-500">Wątki łącznie</span>
                <p className="text-base font-semibold text-zinc-800">{chatStats.total}</p>
              </div>
              <div className="rounded-lg border bg-zinc-50 p-2">
                <span className="text-zinc-500">Nieodczytane / otwarte</span>
                <p className="text-base font-semibold text-zinc-800">
                  {chatStats.unreadThreads} / {chatStats.openThreads}
                </p>
              </div>
              <div className="rounded-lg border bg-zinc-50 p-2">
                <span className="text-zinc-500">Aktywne w 7 dni</span>
                <p className="text-base font-semibold text-zinc-800">{chatStats.activeLast7d}</p>
              </div>
            </div>
          )}
        </div>
      </section>
        </>
      ) : null}

      {dashboardView === "finance" ? (
        <>
      <section className="grid auto-rows-fr gap-4 md:grid-cols-3">
        <div className={metricClass}>
          <p className="text-sm text-zinc-500">Subskrypcje (opłacone)</p>
          <p className="mt-1 text-xl font-bold">
            {paymentMix.subscription.count} • {(paymentMix.subscription.amount / 100).toFixed(2)} PLN
          </p>
        </div>
        <div className={metricClass}>
          <p className="text-sm text-zinc-500">Jednorazowe / pakiety</p>
          <p className="mt-1 text-xl font-bold">
            {paymentMix.packageOrOneOff.count} • {(paymentMix.packageOrOneOff.amount / 100).toFixed(2)} PLN
          </p>
        </div>
        <div className={metricClass}>
          <p className="text-sm text-zinc-500">Szacunek do opłacenia (7 dni)</p>
          <p className="mt-1 text-xl font-bold">{(weeklyDue.estimatedAmountCents / 100).toFixed(2)} PLN</p>
          <p className="mt-1 text-xs text-zinc-500">
            online: {weeklyDue.onlineCount}, one_off: {weeklyDue.oneOffCount}, credits: {weeklyDue.creditsCount}
          </p>
        </div>
      </section>

      <section className="grid auto-rows-fr gap-4 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="mb-3 text-lg font-semibold">Użytkownicy i dzieci</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-500">
                  <th className="py-2">Rodzic</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Dzieci</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 12).map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">{u.firstName} {u.lastName}</td>
                    <td className="py-2 text-zinc-600">{u.email}</td>
                    <td className="py-2">{u.children?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="mb-3 text-lg font-semibold">Ostatnie opłaty</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-500">
                  <th className="py-2">Parent ID</th>
                  <th className="py-2">Kwota</th>
                  <th className="py-2">Typ płatności</th>
                  <th className="py-2">Plan</th>
                  <th className="py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentPaid.slice(0, 12).map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 text-zinc-600">{p.parentId}</td>
                    <td className="py-2 font-medium">{(p.amountCents / 100).toFixed(2)} {p.currency}</td>
                    <td className="py-2">
                      {(planById.get(p.planId)?.type ?? "").startsWith("subscription")
                        ? "Subskrypcja"
                        : "Jednorazowa / pakiet"}
                    </td>
                    <td className="py-2">{p.planId}</td>
                    <td className="py-2 text-zinc-600">{formatDate(p.paidAt ?? p.createdAt)}</td>
                  </tr>
                ))}
                {recentPaid.length === 0 ? (
                  <tr>
                    <td className="py-3 text-zinc-500" colSpan={5}>Brak opłaconych zamówień.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
        </>
      ) : null}

      {dashboardView === "matrix" ? (
      <section className={cardClass}>
        <h2 className="mb-1 text-lg font-semibold">Rodzice / dzieci vs zakupy i status miesięczny</h2>
        <p className="mb-3 text-sm text-zinc-500">
          W komórce widzisz: co kupiono (online/gotówka/deklaracja), kiedy i czy rodzic ma zajęcia do wykorzystania.
        </p>
        <div className="space-y-3 md:hidden">
          {users.map((u) => {
            const kids = (u.children ?? []).map((c) => c.firstName).filter(Boolean).join(", ");
            const status = participationStatusByParent.get(u.id) ?? {
              canAttend: false,
              remainingClasses: 0,
              activeSubscription: false,
            };
            return (
              <div key={`m-${u.id}`} className="rounded-xl border bg-zinc-50 p-3">
                <div className="font-medium">{u.firstName} {u.lastName}</div>
                <div className="text-xs text-zinc-500">{kids || "Brak dzieci"}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-700">
                    zajęcia do wykorzystania: {status.remainingClasses}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      status.canAttend ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {status.canAttend ? "może uczestniczyć" : "wymaga opłaty"}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {recentMonths.map((m) => {
                    const entries = purchaseDetailsByParentMonth.get(u.id)?.get(m.key) ?? [];
                    return (
                      <div key={`mobile-${u.id}-${m.key}`} className="rounded-lg border bg-white p-2">
                        <div className="text-xs font-medium text-zinc-700">{m.label}</div>
                        {entries.length === 0 ? (
                          <div className="mt-1 text-xs text-zinc-400">brak zakupu</div>
                        ) : (
                          <div className="mt-1 space-y-1">
                            {entries.slice(0, 2).map((entry, idx) => (
                              <div key={idx} className="rounded-md bg-zinc-50 px-2 py-1 text-xs text-zinc-700">
                                {entry}
                              </div>
                            ))}
                            {entries.length > 2 ? (
                              <div className="text-[11px] text-zinc-500">+{entries.length - 2} więcej</div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1180px] text-sm lg:min-w-[1320px]">
            <thead>
              <tr className="border-b text-left text-zinc-500">
                <th className="sticky left-0 z-10 bg-white py-2 pr-3">Rodzic / Dzieci / Status</th>
                {recentMonths.map((m) => (
                  <th key={m.key} className="py-2 text-center">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const kids = (u.children ?? []).map((c) => c.firstName).filter(Boolean).join(", ");
                const status = participationStatusByParent.get(u.id) ?? {
                  canAttend: false,
                  remainingClasses: 0,
                  activeSubscription: false,
                };
                return (
                  <tr key={u.id} className="border-b align-top last:border-0">
                    <td className="sticky left-0 z-10 bg-white py-3 pr-3">
                      <div className="font-medium">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-zinc-500">{kids || "Brak dzieci"}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-700">
                          zajęcia do wykorzystania: {status.remainingClasses}
                        </span>
                        {status.activeSubscription ? (
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] text-cyan-700">
                            aktywna subskrypcja
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${
                            status.canAttend
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {status.canAttend ? "może uczestniczyć" : "wymaga opłaty"}
                        </span>
                      </div>
                    </td>
                    {recentMonths.map((m) => {
                      const entries = purchaseDetailsByParentMonth.get(u.id)?.get(m.key) ?? [];
                      return (
                        <td key={m.key} className="p-2">
                          <div className="min-h-[120px] rounded-xl border bg-zinc-50 p-2">
                            {entries.length === 0 ? (
                              <div className="mt-8 text-center text-xs text-zinc-400">brak zakupu</div>
                            ) : (
                              <div className="space-y-1.5">
                                {entries.slice(0, 3).map((entry, idx) => (
                                  <div key={idx} className="rounded-md bg-white px-2 py-1 text-xs text-zinc-700 shadow-sm">
                                    {entry}
                                  </div>
                                ))}
                                {entries.length > 3 ? (
                                  <div className="text-[11px] text-zinc-500">+{entries.length - 3} więcej</div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {dashboardView === "credits" ? (
      <section className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold">Kredyty (aktywny miesiąc)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-zinc-500">
                <th className="py-2">Rodzic</th>
                <th className="py-2">Dzieci</th>
                <th className="py-2">Kredyty łącznie</th>
                <th className="py-2">Zużyte</th>
                <th className="py-2">Pozostało</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const c = creditsByParent.get(u.id) ?? { total: 0, used: 0, remaining: 0 };
                return (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="py-2">{u.children?.length ?? 0}</td>
                    <td className="py-2">{c.total}</td>
                    <td className="py-2">{c.used}</td>
                    <td className="py-2">{c.remaining}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}
    </div>
  );
}
