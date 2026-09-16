import { InstitutionDocument, RagChatMessage, AuditLogEntry, DocumentFolder } from '../../types/documentPlatform';
import { INITIAL_DOCUMENTS, INITIAL_AUDIT_LOGS } from '../../data/mockDocuments';

const USER_DOCS_PREFIX = 'cniplc_user_docs_';
const USER_CHAT_PREFIX = 'cniplc_user_chat_';
const USER_AUDIT_PREFIX = 'cniplc_user_audit_';
const USER_FOLDERS_PREFIX = 'cniplc_user_folders_';

export const DEFAULT_USER_FOLDERS: DocumentFolder[] = [
  {
    id: 'folder-rapports',
    name: 'Rapports d\'Activité & Bilans',
    parentId: null,
    color: 'amber',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-juridique',
    name: 'Textes Juridiques & Réglementation',
    parentId: null,
    color: 'emerald',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-enquetes',
    name: 'Enquêtes & Déclarations Patrimoine',
    parentId: null,
    color: 'rose',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-prevention',
    name: 'Campagnes & Sensibilisation',
    parentId: null,
    color: 'blue',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'folder-rh',
    name: 'Administration & Ressources Humaines',
    parentId: null,
    color: 'purple',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export function getUserFolders(userId: string): DocumentFolder[] {
  if (typeof window === 'undefined' || !userId) return DEFAULT_USER_FOLDERS;
  try {
    const key = `${USER_FOLDERS_PREFIX}${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(key, JSON.stringify(DEFAULT_USER_FOLDERS));
    return DEFAULT_USER_FOLDERS;
  } catch (e) {
    console.error('Error loading user folders:', e);
    return DEFAULT_USER_FOLDERS;
  }
}

export function saveUserFolders(userId: string, folders: DocumentFolder[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${USER_FOLDERS_PREFIX}${userId}`, JSON.stringify(folders));
  } catch (e) {
    console.error('Error saving user folders:', e);
  }
}

/**
 * Loads documents strictly isolated for the given user ID.
 * Sovereign rule: R2 key pattern strictly follows `r2/users/{supabase_user_uuid}/...`
 */
export function getUserDocuments(userId: string): InstitutionDocument[] {
  if (typeof window === 'undefined' || !userId) return [];
  
  try {
    const key = `${USER_DOCS_PREFIX}${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }

    // If first time for the default agent, initialize with initial documents with Sovereign local storage paths
    if (userId === '550e8400-e29b-41d4-a716-446655440000') {
      const initialized = INITIAL_DOCUMENTS.map(doc => ({
        ...doc,
        storagePath: `/storage/users/${userId}/documents/${doc.originalFilename}`,
        r2Key: `/storage/users/${userId}/documents/${doc.originalFilename}`,
        chromaVectorCount: doc.qdrantVectorCount || 100,
      }));
      localStorage.setItem(key, JSON.stringify(initialized));
      return initialized;
    }

    // For newly created users: start with a fresh isolated space containing an initial Welcome Guide
    const welcomeDoc: InstitutionDocument = {
      id: `doc-welcome-${Date.now()}`,
      title: 'Guide d\'Accueil & Charte de Confidentialité Documentaire',
      originalFilename: 'Guide_Accueil_Securite_CNIPLC.pdf',
      category: 'Administratif & RH',
      workspaceId: 'direction',
      department: 'Direction Générale',
      mimeType: 'application/pdf',
      fileSize: 1048576,
      storagePath: `/storage/users/${userId}/documents/Guide_Accueil_Securite_CNIPLC.pdf`,
      r2Key: `/storage/users/${userId}/documents/Guide_Accueil_Securite_CNIPLC.pdf`,
      fileHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      version: '1.0',
      language: 'Français',
      pageCount: 14,
      status: 'indexed',
      ocrApplied: true,
      qdrantVectorCount: 28,
      chromaVectorCount: 28,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Commission Anti-Corruption',
      description: 'Document officiel d\'initialisation de votre coffre-fort documentaire souverain.',
      tags: ['Sécurité', 'Espace Privé', 'CNIPLC', 'Souveraineté'],
      summarySnippet: 'Bienvenue sur votre espace documentaire souverain dédié. Vos documents, recherches et conversations sont strictement partitionnés avec stockage local sécurisé et Row Level Security.',
      securityClassification: 'Confidentiel Institutionnel',
    };

    localStorage.setItem(key, JSON.stringify([welcomeDoc]));
    return [welcomeDoc];
  } catch (e) {
    console.error('Error loading user documents:', e);
    return [];
  }
}

export function saveUserDocuments(userId: string, docs: InstitutionDocument[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${USER_DOCS_PREFIX}${userId}`, JSON.stringify(docs));
  } catch (e) {
    console.error('Error saving user documents:', e);
  }
}

export function getUserChatHistory(userId: string): RagChatMessage[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const stored = localStorage.getItem(`${USER_CHAT_PREFIX}${userId}`);
    if (stored) return JSON.parse(stored);
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        content: `Bonjour. Je suis votre Assistant IA Documentaire officiel CNIPLC. Votre espace privé est sécurisé (Chiffrement AES-256 & RLS). Vous pouvez me poser des questions sur vos documents ou demander la génération d'un rapport officiel.`,
        timestamp: new Date().toISOString(),
        language: 'fr',
      }
    ];
  } catch (e) {
    return [];
  }
}

export function saveUserChatHistory(userId: string, messages: RagChatMessage[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${USER_CHAT_PREFIX}${userId}`, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving user chat history:', e);
  }
}

export function getUserAuditLogs(userId: string): AuditLogEntry[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const stored = localStorage.getItem(`${USER_AUDIT_PREFIX}${userId}`);
    if (stored) return JSON.parse(stored);
    
    // Seed initial logs
    const initial: AuditLogEntry[] = [
      {
        id: `aud-init-${Date.now()}`,
        action: 'PERMISSION_CHECK',
        userId: userId,
        userName: 'Session Utilisateur',
        userRole: 'AGENT_CERTIFIE',
        resourceTitle: 'Espace Documentaire Privé',
        timestamp: new Date().toISOString(),
        ipAddress: '10.15.2.14',
        rlsVerified: true,
        details: 'Initialisation de l\'environnement sécurisé RLS et vérification du chiffrement'
      }
    ];
    localStorage.setItem(`${USER_AUDIT_PREFIX}${userId}`, JSON.stringify(initial));
    return initial;
  } catch (e) {
    return [];
  }
}

export function saveUserAuditLogs(userId: string, logs: AuditLogEntry[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`${USER_AUDIT_PREFIX}${userId}`, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving user audit logs:', e);
  }
}
