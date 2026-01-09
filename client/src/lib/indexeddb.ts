const DB_NAME = "rsvp-reader-db";
const DB_VERSION = 1;

export interface StoredText {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  currentWordIndex: number;
  wpm: number;
  lastReadAt: Date;
  createdAt: Date;
  fileType: "text" | "paste";
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("texts")) {
        const store = db.createObjectStore("texts", { keyPath: "id" });
        store.createIndex("lastReadAt", "lastReadAt", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });

  return dbPromise;
}

export async function saveText(text: StoredText): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["texts"], "readwrite");
    const store = transaction.objectStore("texts");
    const request = store.put(text);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getText(id: string): Promise<StoredText | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["texts"], "readonly");
    const store = transaction.objectStore("texts");
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getAllTexts(): Promise<StoredText[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["texts"], "readonly");
    const store = transaction.objectStore("texts");
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const texts = request.result as StoredText[];
      texts.sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());
      resolve(texts);
    };
  });
}

export async function deleteText(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["texts"], "readwrite");
    const store = transaction.objectStore("texts");
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function updateProgress(id: string, wordIndex: number): Promise<void> {
  const text = await getText(id);
  if (text) {
    text.currentWordIndex = wordIndex;
    text.lastReadAt = new Date();
    await saveText(text);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
