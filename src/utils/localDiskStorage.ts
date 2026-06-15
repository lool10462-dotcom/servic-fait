/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("cniplc_disk_db", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("handles")) {
        request.result.createObjectStore("handles");
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("handles", "readwrite");
      const store = tx.objectStore("handles");
      store.put(handle, "save_dir");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open("cniplc_disk_db", 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("handles")) {
        request.result.createObjectStore("handles");
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("handles")) {
        resolve(null);
        return;
      }
      const tx = db.transaction("handles", "readonly");
      const store = tx.objectStore("handles");
      const getReq = store.get("save_dir");
      getReq.onsuccess = () => {
        resolve(getReq.result || null);
      };
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}

export async function deleteDirectoryHandle(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("cniplc_disk_db", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("handles", "readwrite");
      const store = tx.objectStore("handles");
      store.delete("save_dir");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function writeJsonToDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string,
  content: string
): Promise<void> {
  // Fast query permissions
  try {
    const handle = directoryHandle as any;
    const options = { mode: "readwrite" as const };
    if ((await handle.queryPermission(options)) !== "granted") {
      if ((await handle.requestPermission(options)) !== "granted") {
        throw new Error("Permission de modification refusée.");
      }
    }
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    // Same for writeable stream just in case
    const writable = await (fileHandle as any).createWritable();
    await writable.write(content);
    await writable.close();
  } catch (err: any) {
    throw new Error(err.message || "Impossible d'écrire sur le disque dur.");
  }
}
