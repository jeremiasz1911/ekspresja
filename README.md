# Ekspresja Studio

Aplikacja Next.js (App Router) + TypeScript + Firebase (Auth/Firestore/Admin) + TPay OpenAPI dla zapiswww rodzicwww i dzieci na zajechocia cykliczne.

## Development

```bash
npm run dev
npm run build
npm run lint
```

## Data model (Firestore)

- `users/{uid}`  
  Profil rodzica/admina (dane konta, rola, kontakt).

- `children/{childId}`  
  Dziecko przypisane do rodzica (`parentId`), dane wieku i aktywnoci.

- `classes/{classId}`  
  Definicja zajecho cyklicznych (`weekday`, `startTime`, `recurrence`, `capacity`).

- `enrollment_requests/{classId_childId}`  
  Wniosek zapisu (pending/approved/rejected), metoda patnoci i daty.

- `payment_intents/{intentId}`  
  Intencja patnoci (source of truth dla flow TPay): status, metadata (`classId`, `childId`, `dateYMD/dates`).

- `entitlements/{entitlementId}`  
  Uprawnienia po opaceniu planu: `validFrom/validTo`, `limits.credits`, `usage.credits`.

- `reservations/{childId__classId__dateYMD}`  
  Rezerwacja per konkretna data zajecho; klucz idempotentny per dziecko/zajechocia/data.

- `plans/{planId}`  
  Oferta komercyjna: one-off, pakiety miesiechoczne, subskrypcje, limity i benefity.

## Billing invariants (must keep)

- Flow patnoci: `create -> webhook -> finalizePaidIntent`.
- Kredyty spalaj siecho wg `periodKey` wyliczanego z **daty terminu**, nie z "teraz".
- Rezerwacja przyszej daty jest dozwolona tylko przy aktywnym `entitlement` dla tej daty.

## Refactor quality checks

nvm install 18dym kroku:
  - `git status -sb`
  - `npm run build`

## Suggested unit tests (credits/validity)

1.  liczy miesic na podstawie daty terminu (`YYYY-MM-DD`).
2. `validateDateInEntitlement` odrzuca daty poza `validFrom/validTo`.
3. `consumeCredits` agreguje spalanie per klucz okresu przy wielu datach.
4. Brak podwjjjnego spalania przy idempotentnej rezerwacji tej samej daty.
5. Rezerwacja przyszej daty przechodzi tylko gdy plan/entitlement obejmuje ten dzie.
