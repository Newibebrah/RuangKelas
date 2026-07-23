import {
  collection,
  doc,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

interface AddNotificationParams {
  userId: string;
  type: "assignment" | "bill" | "role" | "materi" | "payment_verified" | "payment_rejected";
  title: string;
  message: string;
  roomId: string;
  link: string;
}

export async function addNotification(params: AddNotificationParams) {
  await addDoc(collection(db, "notifications", params.userId, "items"), {
    ...params,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function notifyAllMembers(
  roomId: string,
  params: Omit<AddNotificationParams, "userId">
) {
  const membersSnap = await getDocs(
    collection(db, "rooms", roomId, "members")
  );
  const promises = membersSnap.docs.map((d) =>
    addNotification({ ...params, userId: d.data().userId })
  );
  await Promise.all(promises);
}
