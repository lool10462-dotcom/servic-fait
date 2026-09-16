import { 
  Search, 
  Bot, 
  Upload, 
  FolderOpen, 
  FileText, 
  FileSpreadsheet, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  Download, 
  ArrowRight, 
  HardDrive, 
  Cpu, 
  Layers,
  FolderSync,
  FolderPlus,
  Laptop,
  Zap,
  Command
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { InstitutionDocument } from '../../types/documentPlatform';
import LocalFolderSyncManager from './LocalFolderSyncManager';

interface DocPlatformDashboardProps {
  documents: InstitutionDocument[];
  onSelectTab: (tab: string) => void;
  onSelectDocument: (doc: InstitutionDocument) => void;
  onAskAiPrompt: (promptText: string) => void;
  onTriggerUpload: () => void;
  onAddDocument: (doc: InstitutionDocument) => void;
  onAddMultipleDocuments: (docs: InstitutionDocument[]) => void;
  onPurgeDemoDocs?: () => void;
}

export default function DocPlatformDashboard({
  documents,
  onSelectTab,
  onSelectDocument,
  onAskAiPrompt,
  onTriggerUpload,
  onAddDocument,
  onAddMultipleDocuments,
  onPurgeDemoDocs
}: DocPlatformDashboardProps) {
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(true);

  // Global hotkeys for instant quick navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSelectTab('search');
      } else if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        onSelectTab('chat');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectTab]);
  const quickPrompts = [
    "Trouve-moi le rapport annuel sur la corruption de 2025.",
    "Donne-moi le document concernant la sensibilisation dans les écoles.",
    "Quels documents parlent de prévention de la corruption ?",
    "Synthèse des déclarations de patrimoine des hauts fonctionnaires.",
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Portail Officiel d'Intelligence Documentaire &amp; RAG
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Centralisation &amp; Analyse Intelligente des Documents
          </h1>
          <p className="text-slate-350 text-sm sm:text-base mt-2.5 leading-relaxed font-sans">
            Recherchez en langage naturel, interrogez l'assistant IA avec citations de sources vérifiées, gérez vos fichiers sécurisés en stockage local souverain et générez des rapports officiels conformes.
          </p>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <button
              onClick={() => onSelectTab('search')}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <span>Rechercher un document</span>
            </button>

            <button
              onClick={() => onSelectTab('chat')}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <span>Demander à l'IA</span>
            </button>

            <button
              onClick={() => {
                onSelectTab('documents');
                setTimeout(() => onTriggerUpload(), 100);
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <span>Ajouter un document</span>
            </button>

            <button
              onClick={() => onSelectTab('documents')}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
              <span>Ouvrir mes dossiers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Centralisation & Alimentation : Dossier Complet & Synchronisation Bureau */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Alimentation de masse &amp; Synchronisation Bureau
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Formats pris en charge : PDF, Word, Excel, PowerPoint, Images (Détection automatique)
          </span>
        </div>

        <LocalFolderSyncManager
          onAddMultipleDocuments={onAddMultipleDocuments}
          onAddDocument={onAddDocument}
          existingDocumentsCount={documents.length}
          onPurgeDemoDocs={onPurgeDemoDocs}
        />
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Documents Indexés</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {documents.length}
            </span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">
              100% traités et prêts pour le RAG
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Stockage Cloudflare R2</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              14.2 <span className="text-base font-normal text-slate-400">Mo</span>
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Bucket souverain : cniplc-r2-prod
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Vecteurs Qdrant</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              2,265
            </span>
            <span className="text-[11px] text-purple-400 block mt-0.5">
              Embeddings 768d normalisés
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sécurité &amp; RLS</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              Actif
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Contrôle strict des permissions
            </span>
          </div>
        </div>
      </div>

      {/* Suggested AI Questions */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Exemples de requêtes naturelles à tester avec l'IA
          </span>
          <button 
            onClick={() => onSelectTab('chat')}
            className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
          >
            <span>Ouvrir l'Assistant</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                onAskAiPrompt(prompt);
                onSelectTab('chat');
              }}
              className="text-left p-3 rounded-xl bg-slate-950/60 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-xs text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <span className="italic font-sans">« {prompt} »</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Documents Récents du CNIPLC
            </h2>
            <p className="text-xs text-slate-400">
              Derniers fichiers administratifs indexés et vérifiés par les protocoles RLS
            </p>
          </div>
          <button
            onClick={() => onSelectTab('documents')}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>Voir tous les documents</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {documents.slice(0, 5).map((doc) => {
              const isPdf = doc.mimeType === 'application/pdf';
              const isWord = doc.mimeType.includes('word');
              const isExcel = doc.mimeType.includes('sheet');

              return (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPdf ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                      isWord ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                      isExcel ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                      'bg-slate-700/20 text-slate-300'
                    }`}>
                      {isExcel ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>

                    <div>
                      <h3 
                        onClick={() => onSelectDocument(doc)}
                        className="text-sm font-bold text-white hover:text-amber-300 cursor-pointer transition-colors leading-snug"
                      >
                        {doc.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-300">{doc.department}</span>
                        <span>•</span>
                        <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} Mo</span>
                        <span>•</span>
                        <span>{doc.pageCount} pages</span>
                        <span>•</span>
                        <span className="bg-white/5 px-2 py-0.5 rounded text-slate-400 border border-white/5">
                          {doc.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <button
                      onClick={() => onSelectDocument(doc)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all cursor-pointer"
                    >
                      Détails
                    </button>
                    <button
                      onClick={() => {
                        onAskAiPrompt(`Résume-moi le document : "${doc.title}". Quels sont les points clés ?`);
                        onSelectTab('chat');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-medium border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Bot className="w-3 h-3" />
                      <span>Analyser IA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Quick Access Bar for Semantic Search & AI Assistant */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {isQuickAccessOpen ? (
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl shadow-black/60 anim-card">
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-400 border-r border-white/10 shrink-0">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Accès Rapide</span>
            </div>

            <button
              onClick={() => onSelectTab('search')}
              title="Recherche Sémantique (Alt+S)"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Recherche Sémantique</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950/80 text-amber-300/80 border border-amber-500/30">
                Alt+S
              </kbd>
            </button>

            <button
              onClick={() => onSelectTab('chat')}
              title="Assistant IA RAG (Alt+A)"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>Assistant IA</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-950/80 text-purple-300/80 border border-purple-500/30">
                Alt+A
              </kbd>
            </button>

            <button
              onClick={() => setIsQuickAccessOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs"
              title="Réduire l'accès rapide"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsQuickAccessOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Ouvrir l'accès rapide IA & Recherche"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Accès Rapide</span>
          </button>
        )}
      </div>
    </div>
  );
}
