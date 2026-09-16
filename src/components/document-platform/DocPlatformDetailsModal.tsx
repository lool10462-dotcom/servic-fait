import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Download, 
  Bot, 
  ShieldCheck, 
  HardDrive, 
  Hash, 
  Calendar, 
  User, 
  Layers,
  FileCheck
} from 'lucide-react';
import { InstitutionDocument } from '../../types/documentPlatform';

interface DocPlatformDetailsModalProps {
  docItem: InstitutionDocument | null;
  onClose: () => void;
  onAskAi: (docTitle: string) => void;
}

export default function DocPlatformDetailsModal({
  docItem,
  onClose,
  onAskAi
}: DocPlatformDetailsModalProps) {
  if (!docItem) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-slate-950/80 border-b border-white/10 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                  {docItem.department} • v{docItem.version}
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight mt-1 leading-snug">
                  {docItem.title}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            {/* Summary */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Résumé Exécutif &amp; Données Vectorisées (Qdrant)
              </span>
              <p className="text-slate-300 leading-relaxed">
                {docItem.summarySnippet}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Taille de fichier</span>
                <span className="text-white font-mono font-semibold">{(docItem.fileSize / 1024 / 1024).toFixed(2)} Mo</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Pagination</span>
                <span className="text-white font-mono font-semibold">{docItem.pageCount} pages</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Vecteurs ChromaDB</span>
                <span className="text-emerald-400 font-mono font-semibold">{docItem.chromaVectorCount ?? docItem.qdrantVectorCount ?? 0} chunks</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Classification</span>
                <span className="text-amber-300 font-semibold">{docItem.securityClassification}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Auteur / Source</span>
                <span className="text-white truncate block">{docItem.author}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Langue</span>
                <span className="text-white">{docItem.language}</span>
              </div>
            </div>

            {/* Sovereign Storage Info */}
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10.5px]">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <span>Sovereign Storage Path :</span>
              </div>
              <div className="text-slate-300 font-mono text-[10px] truncate">
                {docItem.storagePath || docItem.r2Key}
              </div>
              <div className="text-slate-500 font-mono text-[10px] truncate">
                Hash SHA-256 : {docItem.sha256 || docItem.fileHash}
              </div>
            </div>

            {/* Tags */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Mots-clés &amp; Indexation thématique
              </span>
              <div className="flex flex-wrap gap-1.5">
                {docItem.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5 text-[11px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-950/80 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                const blob = new Blob([docItem.summarySnippet], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = docItem.originalFilename;
                a.click();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le Fichier</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onAskAi(docItem.title);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Analyser avec l'IA RAG</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
