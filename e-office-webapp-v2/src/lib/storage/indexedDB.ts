/**
 * IndexedDB helper untuk menyimpan File objects besar
 * IndexedDB dapat menyimpan File/Blob objects langsung tanpa konversi base64
 * Kapasitas jauh lebih besar dari localStorage (ratusan MB)
 */

const DB_NAME = 'pkl-attachments-db';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

let dbInstance: IDBDatabase | null = null;

/**
 * Open atau create IndexedDB database
 */
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Error opening database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('category', 'category', { unique: false });
      }
    };
  });
};

/**
 * Store File object ke IndexedDB
 */
export const storeFile = async (id: string, file: File, category: 'proposal' | 'ktm' | 'tambahan'): Promise<void> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data = {
        id,
        file, // Store File object directly
        category,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        storedAt: Date.now(),
      };
      
      const request = store.put(data);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Error storing file:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Error in storeFile:', error);
    throw error;
  }
};

/**
 * Get File object dari IndexedDB
 */
export const getFile = async (id: string): Promise<File | null> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.file) {
          resolve(result.file);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Error getting file:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Error in getFile:', error);
    return null;
  }
};

/**
 * Delete File object dari IndexedDB
 */
export const deleteFile = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Error deleting file:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Error in deleteFile:', error);
    throw error;
  }
};

/**
 * Clear all files dari IndexedDB
 */
export const clearAllFiles = async (): Promise<void> => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Error clearing all files:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[IndexedDB] Error in clearAllFiles:', error);
    throw error;
  }
};
