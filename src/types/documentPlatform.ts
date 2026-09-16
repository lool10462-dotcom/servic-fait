export type DocumentMimeType = 
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'application/vnd.ms-powerpoint'
  | 'text/plain'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/svg+xml'
  | string;

export type DocumentCategory = 
  | 'Rapports Annuels'
  | 'Juridique & Lois'
  | 'Prévention & Sensibilisation'
  | 'Déclarations de Patrimoine'
  | 'Administratif & RH'
  | 'Enquêtes & Signalements';

export type WorkspaceId = 
  | 'all'
  | 'direction'
  | 'juridique'
  | 'prevention'
  | 'rh'
  | 'communication'
  | 'commun';

export interface WorkspaceInfo {
  id: WorkspaceId;
  name: string;
  description: string;
  iconName: string;
  documentCount: number;
  memberCount: number;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionItem {
  id: string;
  versionNumber: string;
  createdAt: string;
  fileSize: number;
  storagePath: string;
  r2Key?: string; // Compatibilité ascendante
  author: string;
  changelog?: string;
}

export interface DocumentShareItem {
  targetType: 'user' | 'workspace';
  targetId: string;
  targetName: string;
  permission: 'read' | 'comment' | 'edit';
  sharedAt: string;
}

export type PipelineStatus = 
  | 'UPLOADING' 
  | 'PROCESSING' 
  | 'OCR' 
  | 'INDEXING' 
  | 'READY' 
  | 'ERROR' 
  | 'DELETED';

export interface InstitutionDocument {
  id: string;
  title: string;
  originalFilename: string;
  category: DocumentCategory;
  workspaceId: WorkspaceId;
  department: string;
  mimeType: DocumentMimeType;
  fileSize: number; // in bytes
  storagePath: string;
  r2Key?: string; // Compatibilité
  fileHash: string;
  sha256?: string;
  version: string;
  language: 'Français' | 'Arabe' | 'Somali' | 'Anglais';
  pageCount: number;
  status: 'indexed' | 'processing' | 'ocr_pending' | 'error';
  ocrApplied: boolean;
  qdrantVectorCount?: number;
  chromaVectorCount?: number;
  uploadedAt: string;
  updatedAt: string;
  author: string;
  description: string;
  tags: string[];
  summarySnippet: string;
  securityClassification: 'Public Interne' | 'Confidentiel Institutionnel' | 'Strictement Restreint';
  localFolderSource?: string;
  isLocalSynced?: boolean;
  fileTypeGroup?: 'pdf' | 'word' | 'excel' | 'powerpoint' | 'image' | 'other';
  folderId?: string | null;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalFolderName?: string;
  originalFolderPath?: string;
  versions?: DocumentVersionItem[];
  shares?: DocumentShareItem[];
  pipelineStatus?: PipelineStatus;
}

export interface FolderDeleteSummary {
  folderId: string;
  folderName: string;
  documentCount: number;
  subFolderCount: number;
  totalSizeBytes: number;
}

export interface LocalSyncOptions {
  autoSync: boolean;
  localDeletePolicy: 'trash' | 'permanent'; // 'trash' = déplace dans la corbeille du site, 'permanent' = suppression définitive
  ocrEnabled: boolean;
  chunkTokens: number;
  allowedExtensions: string[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  sectionTitle?: string;
  textSnippet: string;
  similarityScore: number;
  workspaceId: WorkspaceId;
  securityLevel: string;
}

export interface RagChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: {
    documentId: string;
    documentTitle: string;
    page: number;
    excerpt: string;
    confidenceScore: number;
  }[];
  generatedDocumentUrl?: string;
  language?: 'fr' | 'so' | 'ar' | 'en';
}

export interface AuditLogEntry {
  id: string;
  action: 'UPLOAD' | 'DOWNLOAD' | 'RAG_QUERY' | 'SEMANTIC_SEARCH' | 'GENERATE_DOCX' | 'GENERATE_PDF' | 'PERMISSION_CHECK';
  userId: string;
  userName: string;
  userRole: string;
  resourceId?: string;
  resourceTitle?: string;
  timestamp: string;
  ipAddress: string;
  rlsVerified: boolean;
  details: string;
}
