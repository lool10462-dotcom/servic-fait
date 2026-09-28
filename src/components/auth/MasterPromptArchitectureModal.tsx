import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Terminal, 
  Workflow, 
  Cpu, 
  Database, 
  ShieldCheck, 
  FolderSync, 
  FileText, 
  Bot, 
  Server, 
  Layers, 
  CheckCircle2, 
  HardDrive,
  ExternalLink,
  Code2,
  Lock,
  Search,
  Sparkles,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface MasterPromptArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MasterPromptArchitectureModal({
  isOpen,
  onClose
}: MasterPromptArchitectureModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'tools' | 'storage' | 'rules'>('overview');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
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
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-amber-500/15 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-inner">
                <Workflow className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Master Architecture — Système Documentaire IA
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wide">
                    <Sparkles className="w-2.5 h-2.5" />
                    69 Directives Souveraines
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Spécifications d'ingénierie : Next.js + FastAPI + Supabase/PostgreSQL + ChromaDB + Watchdog + NVIDIA NIM + LangGraph
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Bar inside modal */}
          <div className="px-6 pt-3 bg-slate-950/60 border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: '1. Architecture Globale', icon: Server },
              { id: 'graph', label: '2. Graphe LangGraph & États', icon: Workflow },
              { id: 'tools', label: '3. Outils Contrôlés (Tools)', icon: Terminal },
              { id: 'storage', label: '4. Stockage & Watchdog', icon: HardDrive },
              { id: 'rules', label: '5. Règles Anti-Hallucination', icon: ShieldCheck },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-amber-400 border-amber-400 bg-white/5'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-xs leading-relaxed">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                  <span className="font-bold block mb-1">Architecture Cible Validée pour Production Institutionnelle</span>
                  Chaque composant technique répond à un rôle exclusif sans enchevêtrement. Zéro dépendance obligatoire à LangChain générale, utilisation de LangGraph comme orchestrateur autonome d'état, avec ChromaDB comme moteur vectoriel et PostgreSQL pour la persistance.
                </div>

                {/* 7 Core Components Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold">
                      <Server className="w-4 h-4" />
                      <span>FastAPI / Python</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      API REST souveraine, authentification Supabase, validation Pydantic, gestion des permissions, contrôle d'accès IDOR &amp; anti-traversal.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <Database className="w-4 h-4" />
                      <span>Supabase / PostgreSQL</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Utilisateurs isolés, profils, workspaces, documents, métadonnées, conversations, messages, logs d'audit et corbeille (Trash items).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold">
                      <HardDrive className="w-4 h-4" />
                      <span>Stockage Local Dédié</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Arborescence physique stricte <code className="text-amber-300 font-mono">/storage/users/{'{user_id}'}/</code> avec isolation par sous-dossiers et versions originales.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-teal-400 font-bold">
                      <Layers className="w-4 h-4" />
                      <span>ChromaDB Vector Store</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Embeddings, chunks structurés (1000 tokens / 150 overlap), recherche vectorielle hybride et métadonnées RAG. Ne contient pas les fichiers bruts.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <FolderSync className="w-4 h-4" />
                      <span>Watchdog Agent Local</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Surveillance temps-réel du système de fichiers : CREATE, MODIFY, DELETE, MOVE, RENAME avec vérification de stabilité et calcul SHA-256.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <Cpu className="w-4 h-4" />
                      <span>NVIDIA NIM &amp; Ollama</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Modèle de raisonnement documentaire d'élite (Llama 3.2 Vision / GLM 5.3) avec abstraction LLMProvider et fallback local Ollama.
                    </p>
                  </div>
                </div>

                {/* Flow Schema */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  <div className="text-amber-400 font-bold mb-2">// FLUX GLOBAL INSTITUTIONNEL DU MASTER PROMPT :</div>
                  <pre className="text-slate-400">
{`UTILISATEUR (Navigateur)
   ↓ (HTTPS / RLS)
Next.js / React (TypeScript)
   ↓
FastAPI (Python Backend + Sécurité)
   ├── Supabase / PostgreSQL (Métadonnées & RLS)
   ├── Stockage Local /storage/users/{id}/ (Fichiers & Versions)
   └── ChromaDB (Base Vectorielle & Index Chunks)
   ↓
RAG SERVICE (Extraction, OCR, Chunking 1000/150)
   ↓
LANGGRAPH (Agent Orchestrator & State Graph)
   ├── Tool Calling (DocumentSearchTool, ExportPDFTool, etc.)
   ├── NVIDIA NIM API (Raisonnement haute précision)
   └── Vérification Anti-Hallucination & Sources`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 2: LANGGRAPH & STATE GRAPH */}
            {activeTab === 'graph' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-sm">Graphe d'Exécution LangGraph &amp; États Structurés</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-500/30">
                      Stateful Workflow
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    L'agent ne se contente pas d'interroger un LLM en boucle aveugle. Il traverse un graphe déterministe avec validation d'étapes, gestion de mémoire d'exécution et capacité de recherche itérative si le premier résultat est insuffisant.
                  </p>
                </div>

                {/* State Graph Visual Steps */}
                <div className="space-y-2">
                  {[
                    { step: '1. START -> classify_request', desc: 'Identifie l\'intention (DOCUMENT_SEARCH, DOCUMENT_SUMMARY, EXPORT_REQUEST, GENERAL_QUESTION).' },
                    { step: '2. route_request', desc: 'Aiguille vers les outils appropriés sans exécuter de RAG inutile si la question est générale.' },
                    { step: '3. retrieve_context', desc: 'Appelle DocumentSearchTool via ChromaDB avec filtrage strict des permissions par user_id et workspace_id.' },
                    { step: '4. evaluate_retrieval', desc: 'Évalue la pertinence des chunks. Si insuffisant : refine_search (reformulation, max 3 tentatives).' },
                    { step: '5. generate_answer', desc: 'Sollicite NVIDIA NIM avec le contexte vérifié et l\'instruction institutionnelle formelle.' },
                    { step: '6. verify_answer', desc: 'Vérification anti-hallucination : conformité de chaque fait, présence de citation de page et absence d\'invention.' },
                    { step: '7. generate_sources -> END', desc: 'Retourne la réponse finale avec les sources documentaires strictes (documentId, filename, page, section).' },
                  ].map((node, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-white/5 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs font-mono">{node.step}</div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{node.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200">
                  <span className="font-bold block mb-1">Human-in-the-Loop &amp; Opérations Sensibles (Point 23)</span>
                  Pour les actions irréversibles telles que la suppression définitive de fichiers ou l'exportation massive de données classifiées, l'agent LangGraph suspend son graphe et exige une validation manuelle formelle de l'utilisateur.
                </div>
              </div>
            )}

            {/* TAB 3: TOOLS */}
            {activeTab === 'tools' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10">
                  <span className="font-bold text-white block mb-1">Outils Contrôlés de l'Agent (Points 12 &amp; 45)</span>
                  <span className="text-slate-400 text-xs">
                    Le modèle IA ne possède JAMAIS d'accès direct au système de fichiers ni aux disques. Il agit exclusivement via des outils surveillés par le backend avec contrôle de permissions côté serveur.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'DocumentSearchTool', role: 'Recherche sémantique vectorielle dans ChromaDB avec filtre RLS.', icon: Search },
                    { name: 'DocumentGetTool', role: 'Récupère le contenu d\'un document autorisé par son ID.', icon: FileText },
                    { name: 'DocumentMetadataTool', role: 'Consulte nom, type, taille, hash SHA-256, version et date.', icon: Database },
                    { name: 'FolderSearchTool', role: 'Recherche hiérarchique dans les dossiers autorisés de l\'agent.', icon: HardDrive },
                    { name: 'ConversationSearchTool', role: 'Interroge l\'historique persistant des dialogues PostgreSQL.', icon: Bot },
                    { name: 'DocumentSummaryTool', role: 'Génère un résumé fidèle respectant les articles originaux.', icon: Sparkles },
                    { name: 'ExportPDFTool', role: 'Génère un PDF officiel 1 page A4 structuré avec logo CNIPLC.', icon: FileText },
                    { name: 'ExportDOCXTool', role: 'Exporte en Word administratif formel (.docx) éditable.', icon: FileText },
                  ].map((t, i) => {
                    const Icon = t.icon;
                    return (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-amber-300 font-bold font-mono text-xs">
                          <Icon className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.name}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{t.role}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: STORAGE & WATCHDOG */}
            {activeTab === 'storage' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <span className="font-bold text-white block">Arborescence Souveraine du Stockage Local (Point 33)</span>
                  <p className="text-slate-400 text-xs">
                    Chaque utilisateur dispose d'un espace isolé au niveau du système de fichiers hôte :
                  </p>
                  <pre className="p-3 rounded-xl bg-slate-900 text-amber-300 font-mono text-[11px] overflow-x-auto">
{`/storage/users/{user_id}/
├── documents/       # Fichiers bureautiques (PDF, Word, TXT)
├── images/          # Scans d'originaux et pièces justificatives
├── presentations/   # Diaporamas institutionnels (PPTX)
├── spreadsheets/    # Tableurs et bilans financiers (XLSX, CSV)
├── generated/       # Rapports créés par l'agent IA
├── exports/         # Fichiers exportés PDF & DOCX
├── trash/           # Corbeille avant suppression définitive
└── temporary/       # Fichiers en cours d'écriture / queue`}
                  </pre>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <span className="font-bold text-emerald-400 block">Agent Watchdog de Synchronisation Locale (Points 31 &amp; 32)</span>
                  <p className="text-slate-400 text-xs">
                    Surveillance en continu du dossier local. Détection des événements <code>CREATE</code>, <code>MODIFY</code>, <code>DELETE</code>, <code>MOVE</code> et <code>RENAME</code> avec temporisation de stabilité de fichier avant calcul d'empreinte SHA-256 et vectorisation ChromaDB.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: ANTI-HALLUCINATION RULES */}
            {activeTab === 'rules' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <span className="font-bold text-emerald-300 text-sm block">
                    Principes Fondamentaux de Vérité Documentaire (Points 17 &amp; 64)
                  </span>
                  <p className="text-slate-300 text-xs">
                    <strong className="text-white">« Document evidence &gt; modèle &gt; hypothèse »</strong> : Le document est l'unique source de vérité légale. L'IA ne peut jamais faire prévaloir son inférence sur le texte d'un décret ou rapport officiel.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Interdiction formelle d\'inventer un article de loi, un montant ou une date.',
                    'Obligation de citer le document source, le titre et la page exacte.',
                    'Déclaration solennelle d\'absence d\'information si le document ne répond pas à la question.',
                    'Vérification croisée et signalement explicite des contradictions entre pièces.',
                    'Contrôle automatique de fidélité numérique sur les chiffres, surfaces et montants en FDJ/USD.',
                    'Purge définitive certifiée sans reliquat lors du vidage de la corbeille.'
                  ].map((rule, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-white/5 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-[11px] leading-relaxed">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer inside modal */}
          <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Conformité intégrale au Master Prompt CNIPLC</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer"
            >
              Compris &amp; Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
