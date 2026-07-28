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
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type WishlistItem = {
  id: string;
  title: string;
  url: string | null;
  imageUrl: string | null;
  description: string | null;
  lockable: boolean;
  purchased: boolean;
  purchasedByName: string | null;
  purchasedByUid: string | null;
  createdAt: Timestamp | null;
};

function toWishlistItem(id: string, data: Record<string, unknown>): WishlistItem {
  return {
    id,
    title: (data.title as string) ?? "",
    url: (data.url as string | null) ?? null,
    imageUrl: (data.imageUrl as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    lockable: (data.lockable as boolean) ?? false,
    purchased: (data.purchased as boolean) ?? false,
    purchasedByName: (data.purchasedByName as string | null) ?? null,
    purchasedByUid: (data.purchasedByUid as string | null) ?? null,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

export async function addWishlistItem(
  title: string,
  url: string,
  imageUrl: string,
  description: string = "",
  lockable: boolean = false
) {
  await addDoc(collection(db, "wishlist"), {
    title: title.trim(),
    url: url.trim() || null,
    imageUrl: imageUrl.trim() || null,
    description: description.trim() || null,
    lockable,
    purchased: false,
    purchasedByName: null,
    purchasedByUid: null,
    createdAt: serverTimestamp(),
  });
}

export async function updateWishlistItem(
  id: string,
  title: string,
  url: string,
  imageUrl: string,
  description: string,
  lockable: boolean
) {
  await updateDoc(doc(db, "wishlist", id), {
    title: title.trim(),
    url: url.trim() || null,
    imageUrl: imageUrl.trim() || null,
    description: description.trim() || null,
    lockable,
  });
}

// Marca/desmarca un elemento bloqueable como comprado. Cualquier testigo
// autenticado puede marcarlo (sin necesidad de ser el admin) — así, en
// cuanto alguien decide comprar el regalo, se bloquea para los demás.
// Desmarcarlo (deshacer) queda reservado al admin desde el panel, para
// evitar que alguien "libere" por error una compra real de otra persona.
export async function setWishlistItemPurchased(
  id: string,
  purchased: boolean,
  purchasedBy: { uid: string; name: string } | null
) {
  await updateDoc(doc(db, "wishlist", id), {
    purchased,
    purchasedByUid: purchased ? (purchasedBy?.uid ?? null) : null,
    purchasedByName: purchased ? (purchasedBy?.name ?? null) : null,
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
