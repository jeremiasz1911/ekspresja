import { storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadClassImage(
  file: File,
  classId: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `classes/${classId}/cover.${ext}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);

  return getDownloadURL(storageRef);
}

export async function uploadMaterialAsset(
  file: File,
  materialId: string
): Promise<{ storagePath: string; downloadUrl: string }> {
  const ext = file.name.split(".").pop();
  const storagePath = `materials/${materialId}/asset.${ext}`;

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file);

  const downloadUrl = await getDownloadURL(storageRef);
  return { storagePath, downloadUrl };
}
