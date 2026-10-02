import type { SavedReturn } from "./savedReturn.ts";

/**
 * Returns are kept in this browser's IndexedDB, on this device only.
 * Nothing is sent anywhere.
 */
const DB_NAME = "opentax";
const STORE = "returns";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function listReturns(): Promise<SavedReturn[]> {
  const all = await run("readonly", (store) => store.getAll() as IDBRequest<SavedReturn[]>);
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const getReturn = (id: string) => run("readonly", (store) => store.get(id) as IDBRequest<SavedReturn | undefined>);

export const saveReturn = (saved: SavedReturn) => run("readwrite", (store) => store.put(saved)).then(() => undefined);

export const deleteReturn = (id: string) => run("readwrite", (store) => store.delete(id)).then(() => undefined);

/** Asks the browser not to evict our data under storage pressure. */
export async function requestPersistence(): Promise<boolean> {
  return (await navigator.storage?.persist?.()) ?? false;
}
