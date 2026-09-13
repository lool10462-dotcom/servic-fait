import { InstitutionDocument, RagChatMessage, AuditLogEntry } from '../../types/documentPlatform';
import { INITIAL_DOCUMENTS, INITIAL_AUDIT_LOGS } from '../../data/mockDocuments';

const USER_DOCS_PREFIX = 'cniplc_user_docs_';
const USER_CHAT_PREFIX = 'cniplc_user_chat_';
const USER_AUDIT_PREFIX = 'cniplc_user_audit_';

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

    // If first time for the default agent, initialize with initial documents with Sovereign R2 paths
    if (userId === '550e8400-e29b-41d4-a716-446655440000') {
      const initialized = INITIAL_DOCUMENTS.map(doc => ({
        ...doc,
        // Enforce sovereign path rule #13: r2/users/{userId}/documents/{filename}
        r2Key: `r2/users/${userId}/documents/${doc.originalFilename}`,
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
      r2Key: `r2/users/${userId}/documents/Guide_Accueil_Securite_CNIPLC.pdf`,
      fileHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      version: '1.0',
      language: 'Français',
      pageCount: 14,
      status: 'indexed',
      ocrApplied: true,
      qdrantVectorCount: 28,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Commission Anti-Corruption',
      description: 'Document officiel d\'initialisation de votre coffre-fort documentaire souverain.',
      tags: ['Sécurité', 'Espace Privé', 'CNIPLC', 'Souveraineté'],
      summarySnippet: 'Bienvenue sur votre espace documentaire souverain dédié. Vos documents, recherches et conversations sont strictement partitionnés avec chiffrement AES-256 et Row Level Security.',
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
