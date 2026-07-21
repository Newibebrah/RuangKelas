import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot } from "firebase/storage";
import { storage } from "./firebase";

export interface UploadProgress {
  progress: number;
  snapshot: UploadTaskSnapshot;
}

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.({ progress, snapshot });
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

export function generateFilePath(
  roomId: string,
  folder: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `rooms/${roomId}/${folder}/${timestamp}_${safeName}`;
}
