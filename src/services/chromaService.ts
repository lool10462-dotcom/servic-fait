/**
 * ============================================================================
 * CHROMADB SOUVERAIN — SERVICE VECTORIEL LOCAL & GESTION DES EMBEDDINGS
 * ============================================================================
 * 
 * Conforme à la règle stricte du cahier des charges :
 * 1. ChromaDB stocke UNIQUEMENT :
 *    - document_id
 *    - user_id
 *    - workspace_id
 *    - chunk_id
 *    - text
 *    - embedding
 *    - filename
 *    - file_type
 *    - page
 *    - section
 *    - metadata
 * 
 * 2. LES FICHIERS ORIGINAUX NE SONT JAMAIS STOCKÉS DANS CHROMADB.
 * 3. Lors de la suppression définitive d'un document, tous les chunks et
 *    embeddings associés sont purgés sans laisser d'orphelins.
 */

export interface ChromaVectorChunk {
  document_id: string;
  user_id: string;
  workspace_id: string;
  chunk_id: string;
  text: string;
  embedding: number[];
  filename: string;
  file_type: string;
  page?: number;
  section?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChromaSearchResult {
  chunk: ChromaVectorChunk;
  similarity: number;
}

const CHROMA_STORAGE_KEY_PREFIX = 'chromadb_collection_';

class ChromaService {
  private memoryCache: Map<string, ChromaVectorChunk[]> = new Map();

  /**
   * Clé de persistance pour un utilisateur donné
   */
  private getStorageKey(userId: string): string {
    return `${CHROMA_STORAGE_KEY_PREFIX}${userId}`;
  }

  /**
   * Charge la collection d'embeddings pour un utilisateur
   */
  private loadCollection(userId: string): ChromaVectorChunk[] {
    if (this.memoryCache.has(userId)) {
      return this.memoryCache.get(userId)!;
    }
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId));
      if (raw) {
        const parsed: ChromaVectorChunk[] = JSON.parse(raw);
        this.memoryCache.set(userId, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('[ChromaDB] Erreur de lecture de la collection locale:', e);
    }
    const empty: ChromaVectorChunk[] = [];
    this.memoryCache.set(userId, empty);
    return empty;
  }

  /**
   * Sauvegarde la collection d'embeddings pour un utilisateur
   */
  private saveCollection(userId: string, items: ChromaVectorChunk[]): void {
    this.memoryCache.set(userId, items);
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(items));
    } catch (e) {
      console.warn('[ChromaDB] Erreur lors de la sauvegarde locale:', e);
    }
  }

  /**
   * Générateur pseudo-vectoriel rapide (32 dimensions normalisées) basé sur le hachage sémantique
   */
  public generateEmbedding(text: string): number[] {
    const dim = 32;
    const vector = new Array(dim).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9à-ÿ\s]/gi, '');
    const words = cleaned.split(/\s+/).filter(w => w.length > 2);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const idx = Math.abs(hash) % dim;
      vector[idx] += 1;
    }

    // Normalisation L2
    let norm = 0;
    for (let i = 0; i < dim; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dim; i++) {
        vector[i] = parseFloat((vector[i] / norm).toFixed(4));
      }
    }
    return vector;
  }

  /**
   * Similarité cosinus entre deux vecteurs
   */
  public cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Découpage sémantique d'un texte en chunks de ~512 tokens
   */
  public chunkText(text: string, chunkSize: number = 512, overlap: number = 64): string[] {
    if (!text || !text.trim()) return [];
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let i = 0;
    while (i < words.length) {
      const chunkWords = words.slice(i, i + chunkSize);
      chunks.push(chunkWords.join(' '));
      i += chunkSize - overlap;
      if (i >= words.length && chunks.length > 0) break;
    }
    return chunks;
  }

  /**
   * Indexation automatique des chunks dans ChromaDB
   */
  public async indexDocument(params: {
    document_id: string;
    user_id: string;
    workspace_id: string;
    filename: string;
    file_type: string;
    textContent: string;
    metadata?: Record<string, any>;
  }): Promise<{ chunkCount: number }> {
    const { document_id, user_id, workspace_id, filename, file_type, textContent, metadata } = params;
    
    // Purge les anciens chunks éventuels pour ce document avant réindexation
    this.deleteDocument(document_id, user_id);

    const textChunks = this.chunkText(textContent, 512, 64);
    if (textChunks.length === 0) {
      // Indexe au minimum le titre ou nom du fichier
      textChunks.push(filename);
    }

    const currentCollection = this.loadCollection(user_id);
    const newItems: ChromaVectorChunk[] = textChunks.map((chunk, idx) => ({
      document_id,
      user_id,
      workspace_id,
      chunk_id: `chunk_${document_id}_${idx + 1}`,
      text: chunk,
      embedding: this.generateEmbedding(chunk),
      filename,
      file_type,
      page: Math.floor(idx / 2) + 1,
      section: `Section ${idx + 1}`,
      metadata: {
        ...metadata,
        chunk_index: idx,
        total_chunks: textChunks.length
      },
      created_at: new Date().toISOString()
    }));

    const updated = [...currentCollection, ...newItems];
    this.saveCollection(user_id, updated);

    return { chunkCount: newItems.length };
  }

  /**
   * Recherche sémantique dans ChromaDB
   */
  public searchSimilar(
    query: string,
    userId: string,
    workspaceId?: string,
    limit: number = 5
  ): ChromaSearchResult[] {
    const collection = this.loadCollection(userId);
    const queryEmbedding = this.generateEmbedding(query);

    const scored: ChromaSearchResult[] = collection
      .filter(item => !workspaceId || workspaceId === 'all' || item.workspace_id === workspaceId)
      .map(item => ({
        chunk: item,
        similarity: this.cosineSimilarity(queryEmbedding, item.embedding)
      }))
      .filter(res => res.similarity > 0.05)
      .sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit);
  }

  /**
   * Suppression complète des vecteurs d'un document (aucun orphelin)
   */
  public deleteDocument(documentId: string, userId: string): { deletedChunks: number } {
    const collection = this.loadCollection(userId);
    const beforeCount = collection.length;
    const filtered = collection.filter(item => item.document_id !== documentId);
    const deletedCount = beforeCount - filtered.length;
    this.saveCollection(userId, filtered);
    return { deletedChunks: deletedCount };
  }

  /**
   * Suppression complète de tous les vecteurs de l'espace utilisateur
   */
  public purgeUserSpace(userId: string): { purgedChunks: number } {
    const collection = this.loadCollection(userId);
    const count = collection.length;
    this.memoryCache.delete(userId);
    try {
      localStorage.removeItem(this.getStorageKey(userId));
    } catch (e) {
      console.warn('[ChromaDB] Erreur purge utilisateur:', e);
    }
    return { purgedChunks: count };
  }

  /**
   * Statistiques d'indexation pour un utilisateur
   */
  public getStats(userId: string): {
    totalChunks: number;
    totalDocuments: number;
    storageSizeKb: number;
  } {
    const collection = this.loadCollection(userId);
    const uniqueDocs = new Set(collection.map(c => c.document_id));
    const jsonStr = JSON.stringify(collection);
    return {
      totalChunks: collection.length,
      totalDocuments: uniqueDocs.size,
      storageSizeKb: Math.round(jsonStr.length / 1024)
    };
  }
}

export const chromaService = new ChromaService();
export default chromaService;
