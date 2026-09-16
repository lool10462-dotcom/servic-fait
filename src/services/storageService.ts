/**
 * ============================================================================
 * SERVICE DE STOCKAGE LOCAL SOUVERAIN (100% SANS CLOUDFLARE R2)
 * ============================================================================
 * 
 * Structure normalisée du stockage :
 * /storage
 *    /users
 *       /{user_id}
 *          /documents
 *          /images
 *          /presentations
 *          /spreadsheets
 *          /generated
 *          /exports
 *          /trash
 *    /shared
 *    /temporary
 * 
 * Formats pris en charge :
 * PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, JPEG, PNG, WEBP, TIFF, BMP.
 * 
 * Stockage persistant et performant géré localement via IndexedDB sans aucun
 * appel externe ni dépendance vers Cloudflare R2.
 */

export const STORAGE_ROOT = '/storage';
export const SOVEREIGN_USERS_ROOT = `${STORAGE_ROOT}/users`;
export const SOVEREIGN_SHARED_ROOT = `${STORAGE_ROOT}/shared`;
export const SOVEREIGN_TEMP_ROOT = `${STORAGE_ROOT}/temporary`;

// Alias de rétrocompatibilité conservé pour éviter toute rupture d'import,
// mais pointant rigoureusement sur le stockage local souverain.
export const R2_BUCKET_NAME = 'sovereign-local-storage';
export const R2_SOVEREIGN_ROOT = SOVEREIGN_USERS_ROOT;

export type SupportedFolder = 
  | 'documents' 
  | 'images' 
  | 'presentations' 
  | 'spreadsheets' 
  | 'generated' 
  | 'exports' 
  | 'trash'
  | string;

export interface StorageUploadOptions {
  folder?: SupportedFolder;
  contentType?: string;
  upsert?: boolean;
  cacheControl?: string;
  metadata?: Record<string, any>;
}

export interface StorageUploadResult {
  success: boolean;
  storagePath: string;
  r2Key: string; // Alias de compatibilité
  fileName: string;
  folder: string;
  fileSize: number;
  mimeType: string;
  sha256: string;
  signedUrl?: string;
  publicUrl?: string;
  error?: string;
}

export interface StorageSignedUrlResult {
  signedUrl: string | null;
  storagePath: string;
  r2Key: string; // Alias
  expiresIn: number;
  error?: string;
}

export interface StoredFileRecord {
  storagePath: string;
  userId: string;
  folder: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
  data: ArrayBuffer;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

const DB_NAME = 'sovereign_local_storage_db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

/**
 * Gestionnaire IndexedDB pour le stockage binaire local
 */
function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non disponible dans cet environnement.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'storagePath' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('folder', 'folder', { unique: false });
        store.createIndex('sha256', 'sha256', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Calcul d'empreinte cryptographique SHA-256 natif
 */
export async function computeSha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // fallback
    }
  }
  // Fallback hachage simple
  let hash = 0;
  const bytes = new Uint8Array(data);
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) - hash) + bytes[i];
    hash |= 0;
  }
  return `sha256_fallback_${Math.abs(hash).toString(16)}`;
}

/**
 * Nettoie le nom de fichier pour garantir l'intégrité du chemin
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return `file_${Date.now()}`;
  return fileName
    .replace(/\\/g, '/')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

/**
 * Construit un chemin de stockage local souverain selon la structure obligatoire :
 * /storage/users/{user_id}/{folder}/{fileName}
 */
export function buildUserStoragePath(
  userId: string,
  folder: SupportedFolder = 'documents',
  fileName: string
): string {
  if (!userId || typeof userId !== 'string') {
    throw new Error('[StorageService] user_id obligatoire pour construire le chemin de stockage.');
  }
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9\-_]/g, '_');
  const cleanFileName = sanitizeFileName(fileName);
  return `${SOVEREIGN_USERS_ROOT}/${userId}/${cleanFolder}/${cleanFileName}`;
}

// Alias historique pour compatibilité ascendante immédiate
export const buildUserR2Path = buildUserStoragePath;

/**
 * Valide l'accès souverain de l'utilisateur à un chemin
 */
export function validateUserAccess(userId: string, storagePath: string): boolean {
  if (!userId || !storagePath) return false;
  const userPrefix = `${SOVEREIGN_USERS_ROOT}/${userId}/`;
  const legacyPrefix = `r2/users/${userId}/`;
  return storagePath.startsWith(userPrefix) || storagePath.startsWith(legacyPrefix) || storagePath.startsWith(`${SOVEREIGN_SHARED_ROOT}/`);
}

/**
 * Décompose un chemin de stockage
 */
export function parseUserStoragePath(storagePath: string): {
  userId: string;
  folder: string;
  fileName: string;
} | null {
  if (!storagePath) return null;
  const clean = storagePath.replace(/^\/storage\/users\//, '').replace(/^r2\/users\//, '');
  const parts = clean.split('/');
  if (parts.length < 3) return null;
  return {
    userId: parts[0],
    folder: parts[1],
    fileName: parts.slice(2).join('/')
  };
}

export const parseUserR2Path = parseUserStoragePath;

/**
 * Objet principal de service de stockage local souverain
 */
export const storageService = {
  root: STORAGE_ROOT,
  bucketName: R2_BUCKET_NAME,
  buildPath: buildUserStoragePath,
  parsePath: parseUserStoragePath,

  /**
   * Téléverse / Enregistre un fichier localement avec intégrité SHA-256
   */
  async uploadFile(
    userId: string,
    file: File | Blob | ArrayBuffer,
    fileName: string,
    options: StorageUploadOptions = {}
  ): Promise<StorageUploadResult> {
    const folder = options.folder || 'documents';
    const storagePath = buildUserStoragePath(userId, folder, fileName);

    let arrayBuffer: ArrayBuffer;
    let mimeType = options.contentType || 'application/octet-stream';
    let size = 0;

    if (file instanceof ArrayBuffer) {
      arrayBuffer = file;
      size = file.byteLength;
    } else if (file instanceof Blob) {
      arrayBuffer = await file.arrayBuffer();
      size = file.size;
      mimeType = file.type || mimeType;
    } else {
      throw new Error('Format de fichier non pris en charge pour le stockage local.');
    }

    const sha256 = await computeSha256(arrayBuffer);

    try {
      const db = await openLocalDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record: StoredFileRecord = {
        storagePath,
        userId,
        folder,
        fileName: sanitizeFileName(fileName),
        mimeType,
        fileSize: size,
        sha256,
        data: arrayBuffer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };

      await new Promise<void>((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Génère une URL d'accès local blob sécurisée
      const blob = new Blob([arrayBuffer], { type: mimeType });
      const localUrl = URL.createObjectURL(blob);

      return {
        success: true,
        storagePath,
        r2Key: storagePath,
        fileName: record.fileName,
        folder,
        fileSize: size,
        mimeType,
        sha256,
        signedUrl: localUrl,
        publicUrl: localUrl
      };
    } catch (err: any) {
      console.error('[StorageService Local] Erreur de sauvegarde locale:', err);
      return {
        success: false,
        storagePath,
        r2Key: storagePath,
        fileName,
        folder,
        fileSize: size,
        mimeType,
        sha256,
        error: err.message || 'Erreur inconnue lors de la sauvegarde locale'
      };
    }
  },

  /**
   * Récupère le fichier binaire sous forme de Blob
   */
  async getFile(userId: string, storagePath: string): Promise<Blob | null> {
    if (!validateUserAccess(userId, storagePath)) {
      console.warn(`[StorageService] Accès refusé à ${storagePath} pour ${userId}`);
      return null;
    }

    try {
      const db = await openLocalDb();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      const record = await new Promise<StoredFileRecord | undefined>((resolve, reject) => {
        const req = store.get(storagePath);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!record) return null;
      return new Blob([record.data], { type: record.mimeType });
    } catch (e) {
      console.error('[StorageService] Erreur lecture fichier:', e);
      return null;
    }
  },

  /**
   * Crée une URL d'accès locale valide pour le téléchargement ou l'affichage
   */
  async createSignedUrl(
    userId: string,
    storagePath: string,
    expiresInSeconds: number = 3600
  ): Promise<StorageSignedUrlResult> {
    const blob = await this.getFile(userId, storagePath);
    if (!blob) {
      return {
        signedUrl: null,
        storagePath,
        r2Key: storagePath,
        expiresIn: expiresInSeconds,
        error: 'Fichier non trouvé dans le stockage local'
      };
    }

    const signedUrl = URL.createObjectURL(blob);
    return {
      signedUrl,
      storagePath,
      r2Key: storagePath,
      expiresIn: expiresInSeconds
    };
  },

  /**
   * URL locale directe
   */
  getPublicUrl(userId: string, storagePath: string): { publicUrl: string; error?: string } {
    return {
      publicUrl: storagePath
    };
  },

  /**
   * Déplace un fichier vers le dossier corbeille
   */
  async moveToTrash(userId: string, storagePath: string): Promise<{ success: boolean; newPath?: string }> {
    try {
      const db = await openLocalDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = await new Promise<StoredFileRecord | undefined>((resolve, reject) => {
        const req = store.get(storagePath);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!record) return { success: false };

      const trashPath = buildUserStoragePath(userId, 'trash', record.fileName);
      record.isDeleted = true;
      record.deletedAt = new Date().toISOString();
      record.folder = 'trash';
      record.storagePath = trashPath;

      await new Promise<void>((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Supprime l'ancienne clé si le chemin a changé
      if (trashPath !== storagePath) {
        store.delete(storagePath);
      }

      return { success: true, newPath: trashPath };
    } catch (e) {
      console.error('[StorageService] Erreur mise en corbeille:', e);
      return { success: false };
    }
  },

  /**
   * Restaure un fichier de la corbeille vers son emplacement d'origine
   */
  async restoreFromTrash(
    userId: string, 
    currentPath: string, 
    targetFolder: string = 'documents'
  ): Promise<{ success: boolean; restoredPath?: string }> {
    try {
      const db = await openLocalDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = await new Promise<StoredFileRecord | undefined>((resolve, reject) => {
        const req = store.get(currentPath);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!record) return { success: false };

      const restoredPath = buildUserStoragePath(userId, targetFolder, record.fileName);
      record.isDeleted = false;
      record.deletedAt = undefined;
      record.folder = targetFolder;
      record.storagePath = restoredPath;

      await new Promise<void>((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      if (restoredPath !== currentPath) {
        store.delete(currentPath);
      }

      return { success: true, restoredPath };
    } catch (e) {
      console.error('[StorageService] Erreur restauration:', e);
      return { success: false };
    }
  },

  /**
   * Supprime définitivement un fichier du stockage local
   */
  async deleteFile(userId: string, storagePath: string): Promise<{ success: boolean; error?: string }> {
    if (!validateUserAccess(userId, storagePath)) {
      return { success: false, error: 'Tentative de suppression non autorisée' };
    }

    try {
      const db = await openLocalDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const req = store.delete(storagePath);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Suppression définitive groupée
   */
  async deleteFiles(userId: string, storagePaths: string[]): Promise<{ success: boolean; deleted: string[] }> {
    const deleted: string[] = [];
    for (const p of storagePaths) {
      const res = await this.deleteFile(userId, p);
      if (res.success) deleted.push(p);
    }
    return { success: true, deleted };
  },

  /**
   * Liste les fichiers d'un utilisateur dans un dossier donné
   */
  async listFiles(userId: string, folder?: string): Promise<StoredFileRecord[]> {
    try {
      const db = await openLocalDb();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const userIndex = store.index('userId');

      const records = await new Promise<StoredFileRecord[]>((resolve, reject) => {
        const req = userIndex.getAll(userId);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      if (folder) {
        return records.filter(r => r.folder === folder);
      }
      return records;
    } catch (e) {
      console.warn('[StorageService] Erreur listage:', e);
      return [];
    }
  },

  /**
   * Vide entièrement la corbeille d'un utilisateur
   */
  async purgeTrash(userId: string): Promise<{ count: number }> {
    try {
      const files = await this.listFiles(userId, 'trash');
      for (const f of files) {
        await this.deleteFile(userId, f.storagePath);
      }
      return { count: files.length };
    } catch (e) {
      return { count: 0 };
    }
  },

  /**
   * Suppression définitive complète de l'espace utilisateur (Action Administrateur)
   */
  async deleteUserStorage(userId: string): Promise<{ deletedCount: number }> {
    try {
      const files = await this.listFiles(userId);
      for (const f of files) {
        await this.deleteFile(userId, f.storagePath);
      }
      return { deletedCount: files.length };
    } catch (e) {
      return { deletedCount: 0 };
    }
  },

  /**
   * Diagnostic de santé du stockage local souverain
   */
  async checkBucketHealth(): Promise<{
    operational: boolean;
    storageType: string;
    message: string;
  }> {
    try {
      await openLocalDb();
      return {
        operational: true,
        storageType: 'Local Souverain IndexedDB (Aucun R2)',
        message: 'Stockage local cloisonné opérationnel, sécurisé et 100% autonome.'
      };
    } catch (e: any) {
      return {
        operational: false,
        storageType: 'Erreur',
        message: `Erreur d'accès au stockage local : ${e.message}`
      };
    }
  }
};

export default storageService;
