import { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  ShieldAlert, 
  X, 
  Check, 
  Database, 
  HardDrive, 
  Layers, 
  FolderMinus,
  RefreshCw
} from 'lucide-react';
import { InstitutionDocument, DocumentFolder } from '../../types/documentPlatform';

export type DeleteModalType = 
  | { kind: 'single_doc_permanent'; doc: InstitutionDocument }
  | { kind: 'empty_trash'; count: number; totalSize: number }
  | { kind: 'folder_delete'; folder: DocumentFolder; docCount: number }
  | { kind: 'user_purge'; userId: string; userName: string; docCount: number };

interface DocPlatformDeleteModalProps {
  isOpen: boolean;
  modalData: DeleteModalType | null;
  onClose: () => void;
  onConfirmSinglePermanent: (doc: InstitutionDocument) => Promise<void>;
  onConfirmEmptyTrash: () => Promise<void>;
  onConfirmFolderDelete: (folderId: string, mode: 'keep_docs' | 'trash_docs' | 'permanent_delete') => Promise<void>;
  onConfirmUserPurge: (userId: string) => Promise<void>;
}

export default function DocPlatformDeleteModal({
  isOpen,
  modalData,
  onClose,
  onConfirmSinglePermanent,
  onConfirmEmptyTrash,
  onConfirmFolderDelete,
  onConfirmUserPurge
}: DocPlatformDeleteModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [folderDeleteMode, setFolderDeleteMode] = useState<'keep_docs' | 'trash_docs' | 'permanent_delete'>('keep_docs');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !modalData) return null;

  const handleClose = () => {
    if (isProcessing) return;
    setConfirmationInput('');
    setError(null);
    onClose();
  };

  const handleExecute = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      if (modalData.kind === 'single_doc_permanent') {
        await onConfirmSinglePermanent(modalData.doc);
      } else if (modalData.kind === 'empty_trash') {
        await onConfirmEmptyTrash();
      } else if (modalData.kind === 'folder_delete') {
        await onConfirmFolderDelete(modalData.folder.id, folderDeleteMode);
      } else if (modalData.kind === 'user_purge') {
        if (confirmationInput.trim().toUpperCase() !== 'PURGER') {
          setError('Veuillez taper exactement "PURGER" pour valider la suppression totale.');
          setIsProcessing(false);
          return;
        }
        await onConfirmUserPurge(modalData.userId);
      }
      handleClose();
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue lors de la suppression.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {modalData.kind === 'single_doc_permanent' && 'Suppression Définitive du Document'}
                {modalData.kind === 'empty_trash' && 'Vidage Complet de la Corbeille'}
                {modalData.kind === 'folder_delete' && 'Suppression du Dossier'}
                {modalData.kind === 'user_purge' && 'Purge Totale de l\'Espace Utilisateur'}
              </h3>
              <p className="text-xs text-rose-300/80 font-mono">
                Protection Anti-Suppression Accidentelle
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/20 flex items-start gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Attention : Cette action est strictement irréversible.</span>
            <span className="text-[11px] text-rose-300/80 block">
              Toutes les données associées (fichiers binaires du stockage local, chunks &amp; vecteurs sémantiques ChromaDB) seront définitivement effacées.
            </span>
          </div>
        </div>

        {/* Dynamic Body according to kind */}
        {modalData.kind === 'single_doc_permanent' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Document :</span>
              <span className="font-bold text-white truncate max-w-[260px]">{modalData.doc.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fichier original :</span>
              <span className="font-mono text-slate-300 truncate max-w-[260px]">{modalData.doc.originalFilename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Taille :</span>
              <span className="font-mono text-slate-300">{(modalData.doc.fileSize / 1024 / 1024).toFixed(2)} Mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Indexation ChromaDB :</span>
              <span className="font-mono text-emerald-400">
                {modalData.doc.chromaVectorCount ?? modalData.doc.qdrantVectorCount ?? 0} vecteurs à purger
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Chemin local :</span>
              <span className="font-mono text-[10px] text-slate-400 truncate max-w-[260px]">
                {modalData.doc.storagePath || modalData.doc.r2Key}
              </span>
            </div>
          </div>
        )}

        {modalData.kind === 'empty_trash' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-center">
                <span className="text-slate-400 text-[10px] block">Documents en corbeille</span>
                <span className="text-lg font-bold text-rose-400">{modalData.count}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-center">
                <span className="text-slate-400 text-[10px] block">Espace libéré</span>
                <span className="text-lg font-bold text-white">{(modalData.totalSize / 1024 / 1024).toFixed(2)} Mo</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Le vidage de la corbeille supprimera physiquement les blobs binaires d'IndexedDB et supprimera tous les embeddings associés dans ChromaDB sans laisser d'orphelins.
            </p>
          </div>
        )}

        {modalData.kind === 'folder_delete' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-slate-400 block text-[11px]">Dossier cible :</span>
              <span className="text-white font-bold text-sm">{modalData.folder.name}</span>
              <span className="text-amber-400 font-mono text-[11px] block mt-0.5">
                Contient {modalData.docCount} document(s)
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-slate-300 font-semibold block text-[11px]">
                Que souhaitez-vous faire des documents contenus ?
              </span>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-white/10 hover:border-amber-500/40 cursor-pointer">
                <input
                  type="radio"
                  name="folder_action"
                  checked={folderDeleteMode === 'keep_docs'}
                  onChange={() => setFolderDeleteMode('keep_docs')}
                  className="accent-amber-500"
                />
                <div>
                  <span className="font-semibold text-white block">Conserver les documents</span>
                  <span className="text-[10px] text-slate-400 block">Les documents seront replacés à la racine principale.</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-white/10 hover:border-rose-500/40 cursor-pointer">
                <input
                  type="radio"
                  name="folder_action"
                  checked={folderDeleteMode === 'trash_docs'}
                  onChange={() => setFolderDeleteMode('trash_docs')}
                  className="accent-rose-500"
                />
                <div>
                  <span className="font-semibold text-rose-300 block">Mettre les documents à la corbeille</span>
                  <span className="text-[10px] text-slate-400 block">Les documents pourront être restaurés depuis la corbeille.</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-rose-500/30 hover:border-rose-500 cursor-pointer">
                <input
                  type="radio"
                  name="folder_action"
                  checked={folderDeleteMode === 'permanent_delete'}
                  onChange={() => setFolderDeleteMode('permanent_delete')}
                  className="accent-rose-600"
                />
                <div>
                  <span className="font-semibold text-rose-400 block">Supprimer définitivement le dossier et ses documents</span>
                  <span className="text-[10px] text-rose-300/70 block">Suppression irréversible du stockage et de ChromaDB.</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {modalData.kind === 'user_purge' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/30 space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block">Utilisateur ciblé :</span>
              <span className="text-white font-bold">{modalData.userName}</span>
              <span className="font-mono text-[10px] text-slate-500 block">UUID : {modalData.userId}</span>
              <span className="text-rose-400 font-mono text-[11px] block">
                {modalData.docCount} documents &amp; tous les chunks vectoriels seront définitivement purgés.
              </span>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                Tapez <span className="text-rose-400 font-mono font-bold">PURGER</span> pour confirmer :
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="PURGER"
                className="w-full px-3 py-2 bg-slate-950 border border-rose-500/40 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer disabled:opacity-40"
          >
            Annuler
          </button>

          <button
            onClick={handleExecute}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Suppression en cours…</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {modalData.kind === 'single_doc_permanent' && 'Confirmer la suppression irréversible'}
                  {modalData.kind === 'empty_trash' && 'Vider définitivement la corbeille'}
                  {modalData.kind === 'folder_delete' && 'Supprimer le dossier'}
                  {modalData.kind === 'user_purge' && 'Purger l\'espace utilisateur'}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
