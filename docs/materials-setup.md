# E-materialy - struktura wdrozenia

## 1. Kolekcja Firestore: materials

Kazdy dokument w kolekcji materials powinien miec pola:

- title: string
- description?: string
- kind: "video" | "audio" | "sheet" | "link"
- category?: string
- accessLevel: "free" | "partial" | "premium"
- isActive: boolean
- storagePath?: string (np. materials/{materialId}/asset.mp4)
- externalUrl?: string
- createdAt: number
- updatedAt?: number

Przykladowy dokument:

```json
{
  "title": "Wprowadzenie - rytmika",
  "description": "Darmowe cwiczenia startowe.",
  "kind": "video",
  "category": "Rytmika",
  "accessLevel": "free",
  "isActive": true,
  "storagePath": "materials/ryt01/asset.mp4",
  "createdAt": 1770000000000
}
```

## 2. Logika dostepu

Dostep jest liczony na podstawie najwyzszego poziomu z aktywnych entitlements:

- none: tylko materialy accessLevel=free
- partial: free + partial
- all: free + partial + premium

W projekcie jest to zaimplementowane w:
- services/materials.service.ts

## 3. Firebase Storage

Pliki materialow przechowuj pod sciezka:

- materials/{materialId}/asset.{ext}

Do uploadu jest helper:

- services/upload.service.ts -> uploadMaterialAsset(file, materialId)

## 4. Przykadowe reguly Firestore (szkic)

Dopasuj do swojego modelu auth/roles. To jest punkt startowy.

```txt
match /materials/{materialId} {
  allow read: if request.auth != null;
  allow write: if false; // tylko przez admin SDK / backend
}
```

## 5. Przykadowe reguly Storage (szkic)

Kluczowe: nie dawac publicznego read na caly bucket.

```txt
match /materials/{materialId}/{fileName} {
  allow read: if request.auth != null;
  allow write: if false; // tylko backend/admin
}
```

## 6. Uwaga produkcyjna

Aktualna strona dashboardowa blokuje premium po stronie aplikacji i nie pokazuje URL dla zablokowanych materialow.
Aby domknac bezpieczenstwo end-to-end, reguly Firestore/Storage powinny dodatkowo odrzucac nieuprawniony odczyt po stronie Firebase.
