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
