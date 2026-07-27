import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type WishlistItem = {
  id: string;
  title: string;
  url: string;
  imageUrl: string | null;
  createdAt: Timestamp | null;
};

function toWishlistItem(id: string, data: Record<string, unknown>): WishlistItem {
  return {
    id,
    title: (data.title as string) ?? "",
    url: (data.url as string) ?? "",
    imageUrl: (data.imageUrl as string | null) ?? null,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

export async function addWishlistItem(title: string, url: string, imageUrl: string) {
  await addDoc(collection(db, "wishlist"), {
    title: title.trim(),
    url: url.trim(),
    imageUrl: imageUrl.trim() || null,
    createdAt: serverTimestamp(),
  });
}

export async function deleteWishlistItem(id: string) {
  await deleteDoc(doc(db, "wishlist", id));
}

export function subscribeWishlist(callback: (items: WishlistItem[]) => void) {
  const q = query(collection(db, "wishlist"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toWishlistItem(d.id, d.data())));
  });
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const q = query(collection(db, "wishlist"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toWishlistItem(d.id, d.data()));
}
