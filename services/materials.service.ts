import { db, storage } from "@/lib/firebase/client";
import { getDownloadURL, ref } from "firebase/storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Entitlement } from "@/types/entitlements";
import type {
  Material,
  MaterialWithAccess,
  MaterialsForParent,
} from "@/types/materials";
import type { MaterialsAccess } from "@/types/plans";

const MATERIALS_ACCESS_ORDER: Record<MaterialsAccess, number> = {
  none: 0,
  partial: 1,
  all: 2,
};

function resolveMaterialsAccess(entitlements: Entitlement[]): MaterialsAccess {
  if (entitlements.length === 0) return "none";

  return entitlements.reduce<MaterialsAccess>((current, entitlement) => {
    const next = entitlement.benefits?.materials ?? "none";
    return MATERIALS_ACCESS_ORDER[next] > MATERIALS_ACCESS_ORDER[current]
      ? next
      : current;
  }, "none");
}

function canAccessMaterial(material: Material, access: MaterialsAccess): boolean {
  if (material.accessLevel === "free") return true;
  if (material.accessLevel === "partial") {
    return access === "partial" || access === "all";
  }
  return access === "all";
}

async function resolveMaterialUrl(material: Material): Promise<string | undefined> {
  if (material.externalUrl) return material.externalUrl;
  if (!material.storagePath) return undefined;

  try {
    return await getDownloadURL(ref(storage, material.storagePath));
  } catch {
    return undefined;
  }
}

export async function getAllMaterials(): Promise<Material[]> {
  const snap = await getDocs(collection(db, "materials"));

  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Material, "id">) }))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

export async function createMaterial(data: Omit<Material, "id">): Promise<{ id: string }> {
  const created = await addDoc(collection(db, "materials"), data);
  return { id: created.id };
}

export async function updateMaterial(id: string, data: Partial<Material>): Promise<void> {
  await updateDoc(doc(db, "materials", id), data);
}

export async function toggleMaterialActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, "materials", id), {
    isActive,
    updatedAt: Date.now(),
  });
}

export async function deleteMaterial(id: string): Promise<void> {
  await deleteDoc(doc(db, "materials", id));
}

export async function deleteMaterialAsAdmin(
  id: string,
  idToken: string
): Promise<void> {
  const response = await fetch(`/api/admin/materials/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (response.ok) return;

  const payload = await response.json().catch(() => null);
  const message =
    typeof payload?.error === "string"
      ? payload.error
      : "Nie udało się usunąć materiału.";
  throw new Error(message);
}

export async function getActiveMaterials(): Promise<Material[]> {
  const snap = await getDocs(
    query(collection(db, "materials"), where("isActive", "==", true))
  );

  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Material, "id">) }))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

async function getActiveEntitlementsForParent(parentId: string): Promise<Entitlement[]> {
  const now = Date.now();
  const snap = await getDocs(
    query(
      collection(db, "entitlements"),
      where("parentId", "==", parentId),
      where("status", "==", "active")
    )
  );

  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Entitlement, "id">) }))
    .filter((entitlement) => Number(entitlement.validTo || 0) >= now);
}

export async function getMaterialsForParent(parentId: string): Promise<MaterialsForParent> {
  const [materials, entitlements] = await Promise.all([
    getActiveMaterials(),
    getActiveEntitlementsForParent(parentId),
  ]);

  const materialsAccess = resolveMaterialsAccess(entitlements);

  const withAccess: MaterialWithAccess[] = await Promise.all(
    materials.map(async (material) => {
      const canAccess = canAccessMaterial(material, materialsAccess);
      const resolvedUrl = canAccess ? await resolveMaterialUrl(material) : undefined;

      return {
        ...material,
        canAccess,
        requiresPlanUpgrade: !canAccess,
        resolvedUrl,
      };
    })
  );

  return {
    materialsAccess,
    available: withAccess.filter((item) => item.canAccess),
    locked: withAccess.filter((item) => !item.canAccess),
  };
}
