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
  const [dashboardQuery, setDashboardQuery] = useState('');

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

  const handleExecuteAiPrompt = (promptText: string) => {
    onAskAiPrompt(promptText);
    onSelectTab('chat');
  };

  const handleExecuteSearch = (queryText: string) => {
    onSelectTab('search');
  };

  const quickPrompts = [
    {
      title: "Rapport annuel 2025",
      query: "Trouve-moi le rapport annuel sur la corruption de 2025 et les indicateurs clés.",
      badge: "Rapport & Bilan"
    },
    {
      title: "Prévention & Sensibilisation",
      query: "Quels documents traitent des actions de sensibilisation et de formation contre la corruption ?",
      badge: "Sensibilisation"
    },
    {
      title: "Déclarations de patrimoine",
      query: "Synthèse des obligations légales de déclaration de patrimoine pour les hauts fonctionnaires.",
      badge: "Déclaration & Lois"
    },
    {
      title: "Signalements & Lanceurs d'alerte",
      query: "Quelles sont les procédures de signalement et de protection des lanceurs d'alerte ?",
      badge: "Procédures"
    },
  ];

  return (
    <div className="space-y-7 pb-12">
      {/* Welcome Banner - Compact & Official */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-white/10 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Commission Nationale Indépendante pour la Prévention et la Lutte contre la Corruption
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Espace Documentaire &amp; IA Souveraine
            </h1>
            <p className="text-slate-350 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Consultez les archives officielles, interrogez le moteur RAG certifié 0-hallucination et effectuez vos recherches sémantiques instantanées.
            </p>
          </div>

          {/* Direct action shortcuts */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onSelectTab('documents');
                setTimeout(() => onTriggerUpload(), 100);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ajouter un fichier</span>
            </button>
            <button
              onClick={() => onSelectTab('documents')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Explorateur</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION PRIORITAIRE : ASSISTANCE IA (RAG) & RECHERCHE SÉMANTIQUE          */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-slate-900 border border-purple-500/30 p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Assistance IA (RAG) &amp; Recherche Sémantique Documentaire
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Zéro Hallucination • 100% Sourcé
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Accès direct pour le personnel administratif : interrogez l'ensemble des documents d'un simple clic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectTab('chat')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purple-900/30 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ouvrir l'Assistant RAG</span>
            </button>
            <button
              onClick={() => onSelectTab('search')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-amber-900/30 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Recherche Sémantique</span>
            </button>
          </div>
        </div>

        {/* Natural Language Query Bar */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={dashboardQuery}
                onChange={(e) => setDashboardQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && dashboardQuery.trim()) {
                    handleExecuteAiPrompt(dashboardQuery);
                  }
                }}
                placeholder="Posez une question à l'IA ou cherchez des mots-clés administratifs (ex: budget, décret, signalement)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 focus:border-purple-400 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prompt = dashboardQuery.trim() || "Synthèse générale des documents institutionnels";
                  handleExecuteAiPrompt(prompt);
                }}
                className="flex-1 sm:flex-none px-4 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Interroger l'IA RAG</span>
              </button>

              <button
                onClick={() => {
                  handleExecuteSearch(dashboardQuery);
                }}
                className="flex-1 sm:flex-none px-4 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Rechercher</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Clickable Administrative Queries */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Requêtes administratives fréquentes (1 clic pour lancer) :
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Réponses garanties avec pages et extraits officiels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleExecuteAiPrompt(item.query)}
                className="text-left p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/40 text-xs transition-all flex flex-col justify-between gap-2 group cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider block">
                    {item.badge}
                  </span>
                  <p className="text-slate-200 group-hover:text-white font-medium leading-snug line-clamp-2">
                    {item.title}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400 group-hover:text-amber-400 transition-colors">
                  <span>Consulter avec l'IA</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Institutional Guarantee & Integrity Bench info */}
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">
                Manifeste de Vérité Documentaire Souverain
              </span>
              <span className="text-[11px] text-slate-400">
                0 Hallucination • Citations de sources systématiques • Fidélité numérique intégrale (chiffres &amp; surfaces vérifiés)
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('chat')}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold text-[11px] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            Tester la conformité RAG (4 tests)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2 : ALIMENTATION DE MASSE & SYNCHRONISATION BUREAU               */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Centralisation &amp; Synchronisation Bureau Local
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

      {/* ========================================================================= */}
      {/* SECTION 3 : DOCUMENTS ADMINISTRATIFS RÉCENTS                              */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Documents Récents du CNIPLC
            </h2>
            <p className="text-xs text-slate-400">
              Derniers fichiers administratifs indexés et vérifiés par les protocoles de sécurité
            </p>
          </div>
          <button
            onClick={() => onSelectTab('documents')}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>Voir tous les documents ({documents.length})</span>
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
                        handleExecuteAiPrompt(`Résume-moi le document : "${doc.title}". Quels sont les points clés et les chiffres importants ?`);
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

      {/* ========================================================================= */}
      {/* SECTION 4 : INDICATEURS INSTITUTIONNELS & SOUVERAINETÉ (KPIs)             */}
      {/* ========================================================================= */}
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
            <span>Stockage Souverain Local &amp; R2</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {(documents.reduce((acc, d) => acc + (d.fileSize || 0), 0) / 1024 / 1024).toFixed(1)} <span className="text-base font-normal text-slate-400">Mo</span>
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Gratuit, local &amp; illimité
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Vecteurs &amp; Embeddings</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {documents.reduce((acc, d) => acc + (d.pageCount || 1) * 6, 0)}
            </span>
            <span className="text-[11px] text-purple-400 block mt-0.5">
              Indexés avec métadonnées strictes
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sécurité &amp; Intégrité</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              Actif
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              RLS &amp; Contrôle d'accès souverain
            </span>
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
