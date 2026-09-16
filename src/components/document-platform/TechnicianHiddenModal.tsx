import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Cpu, 
  Terminal,
  Activity,
  Database,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud
} from 'lucide-react';

interface TechnicianHiddenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TechnicianHiddenModal({ isOpen, onClose }: TechnicianHiddenModalProps) {
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden z-10 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-emerald-500/15 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Espace Technicien IT
                    </h2>
                    <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wide">
                      <Terminal className="w-2.5 h-2.5 text-emerald-400" />
                      Maintenance Admin
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Console d'administration technique et consignation des opérations
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

            {/* Body content */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-0.5">Accès Technicien Privilégié</strong>
                  Bienvenue dans l'espace technique réservé aux administrateurs réseau et techniciens de support du CNIPLC. Vous pouvez consigner les interventions, générer des fiches de service fait ou accéder au réseau intranet OfficeLink.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {/* Registre des Interventions */}
                <a
                  href="/officelink/registre-it"
                  className="group p-4 bg-slate-950/70 hover:bg-emerald-950/30 border border-white/10 hover:border-emerald-500/40 rounded-2xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Registre IT &amp; Service Fait
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Saisie vocale IA, édition des fiches administratives Word et PDF d'attestation de service fait.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-4 group-hover:translate-x-1 transition-transform">
                    <span>Ouvrir le Registre</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </a>

                {/* Portail Intranet OfficeLink */}
                <a
                  href="/officelink"
                  className="group p-4 bg-slate-950/70 hover:bg-blue-950/30 border border-white/10 hover:border-blue-500/40 rounded-2xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      Portail OfficeLink LAN
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Tableau de bord intranet, messagerie instantanée locale P2P et annuaire des agents.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 mt-4 group-hover:translate-x-1 transition-transform">
                    <span>Accéder à OfficeLink</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </a>

                {/* PDF Studio */}
                <a
                  href="/pdf-studio"
                  className="group p-4 bg-slate-950/70 hover:bg-purple-950/30 border border-white/10 hover:border-purple-500/40 rounded-2xl transition-all flex flex-col justify-between sm:col-span-2"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        Outils PDF Studio
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Fusionner, découper, compresser, convertir en Word et signer numériquement les documents administratifs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-purple-400 mt-3 group-hover:translate-x-1 transition-transform">
                    <span>Lancer PDF Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </a>

                {/* Supabase & Stockage Local Souverain Setup */}
                <div className="sm:col-span-2 p-4 bg-slate-950/80 border border-emerald-500/30 rounded-2xl">
                  <div 
                    onClick={() => setShowCloudConfig(!showCloudConfig)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          Architecture Souveraine : Supabase, Stockage Local &amp; ChromaDB
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                            100% Autonome
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Scripts SQL Supabase, arborescence locale /storage/users/&#123;id&#125;/ et indexation ChromaDB.
                        </p>
                      </div>
                    </div>
                    <div className="text-slate-400 hover:text-white transition-colors">
                      {showCloudConfig ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {showCloudConfig && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                          <span className="text-slate-400 block font-semibold">Base de Données Supabase</span>
                          <span className="text-emerald-400 font-mono text-[10px]">RLS &amp; Realtime Actifs</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`-- TABLES OFFICIELLES SUPABASE CNIPLC
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_title TEXT,
  client_department TEXT,
  device_type TEXT NOT NULL,
  device_brand TEXT,
  date DATE DEFAULT CURRENT_DATE,
  raw_notes TEXT,
  professional_summary TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Terminé',
  technician_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  role TEXT DEFAULT 'Agent',
  phone TEXT,
  office TEXT,
  status TEXT DEFAULT 'Actif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acces authentifie" ON public.interventions FOR ALL TO authenticated USING (true);
CREATE POLICY "Acces authentifie emp" ON public.employees FOR ALL TO authenticated USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.interventions;`, 'sql-tech');
                            }}
                            className="mt-1 w-full py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            {copiedType === 'sql-tech' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedType === 'sql-tech' ? 'Copié !' : 'Copier Script SQL'}</span>
                          </button>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                          <span className="text-slate-400 block font-semibold">Stockage Local &amp; ChromaDB</span>
                          <span className="text-amber-400 font-mono text-[10px]">/storage/users/&#123;id&#125;/ (Sans R2)</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`/storage
  /users/{user_id}
    /documents
    /images
    /presentations
    /spreadsheets
    /generated
    /exports
    /trash
  /shared
  /temporary`, 'cors-tech');
                            }}
                            className="mt-1 w-full py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            {copiedType === 'cors-tech' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedType === 'cors-tech' ? 'Copié !' : 'Copier Arborescence'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-300 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-purple-300">
                          Assistant IA : NVIDIA NIM API (Llama 3.2 Vision)
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(`VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
NVIDIA_API_KEY=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`, 'env-tech');
                          }}
                          className="py-1 px-2.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          {copiedType === 'env-tech' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedType === 'env-tech' ? 'Copié !' : 'Copier .env Souverain'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-950/80 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-emerald-500" />
                Noeud serveur : 0.0.0.0:3000 • CNIPLC Core IT
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
