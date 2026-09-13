import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Lock, 
  KeyRound, 
  Bot, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  FileText, 
  Database,
  Cloud,
  ChevronRight,
  Fingerprint,
  Layers,
  ExternalLink,
  ShieldAlert,
  Wrench
} from 'lucide-react';

interface AuthWelcomeLandingProps {
  onCreateSpace: () => void;
  onLogin: () => void;
  onQuickDemoLogin?: () => void;
  onOpenSignalement: () => void;
  onOpenTechnician: () => void;
}

export default function AuthWelcomeLanding({
  onCreateSpace,
  onLogin,
  onQuickDemoLogin,
  onOpenSignalement,
  onOpenTechnician
}: AuthWelcomeLandingProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px]" />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-10 border-b border-white/10 px-4 sm:px-6 lg:px-12 py-4 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img 
              src="/logo.jpeg" 
              alt="CNIPLC Logo" 
              className="w-11 h-11 object-contain rounded-xl border border-white/20 bg-white p-0.5 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white">CNIPLC</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  République de Djibouti
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Plateforme Souveraine d'Intelligence Documentaire
              </p>
            </div>
          </div>

          {/* Quick Institutional Utilities & Auth Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
            {/* Quick Access: Portail OfficeLink */}
            <a
              href="/officelink"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Accéder au portail collaboratif intranet OfficeLink"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Portail OfficeLink</span>
              <span className="md:hidden">OfficeLink</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Quick Access: PDF Studio */}
            <a
              href="/pdf-studio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Ouvrir le studio officiel d'édition et signature PDF"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">PDF Studio</span>
              <span className="md:hidden">PDF</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Quick Access: Signaler un Incident IT */}
            <button
              onClick={onOpenSignalement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm"
              title="Déclarer une anomalie, incident réseau ou panne IT"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              <span className="hidden lg:inline">Signaler un Incident IT</span>
              <span className="lg:hidden">Signalement IT</span>
            </button>

            {/* Auth Actions */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <button
                onClick={onLogin}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Se connecter
              </button>
              <button
                onClick={onCreateSpace}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Créer mon espace
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10 lg:py-16">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-white/15 text-slate-300 text-xs shadow-inner"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Chiffrement Souverain AES-256 &amp; Supabase RLS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </motion.div>

          {/* Title and Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Bienvenue sur votre <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                espace documentaire
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Stockez, centralisez et exploitez vos documents officiels (PDF, Word, Excel, PowerPoint, Images) en toute sécurité avec synchronisation locale et assistant IA souverain.
            </p>
          </motion.div>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={onCreateSpace}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm sm:text-base shadow-2xl shadow-amber-500/25 border border-amber-400/40 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <span>Créer mon espace</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm sm:text-base border border-white/15 hover:border-white/30 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Se connecter</span>
            </button>
          </motion.div>

          {/* Dedicated Institutional Services Strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="pt-4"
          >
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Outils &amp; Services Institutionnels d'Accès Direct</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="/officelink"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>Portail OfficeLink</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-300" />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Intranet LAN &amp; Collaboration</p>
                  </div>
                </a>

                <a
                  href="/pdf-studio"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>PDF Studio</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-purple-300" />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Édition &amp; Signature électronique</p>
                  </div>
                </a>

                <button
                  onClick={onOpenSignalement}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 transition-all text-left group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Signaler un Incident IT</span>
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Assistance &amp; Dépannage prioritaire</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Security & Sovereign Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 text-left"
          >
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>Code Personnel Sécurisé</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Accès rapide et ultra-sécurisé par code hashé PBKDF2 avec sel cryptographique et protection anti brute-force.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>Cloisonnement Absolu (RLS)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Vos documents et dossiers synchronisés sont cloisonnés dans votre bucket Cloudflare R2 souverain dédié.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Bot className="w-4 h-4" />
                <span>Assistant RAG Anti-Hallucination</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Recherche sémantique vectorielle et réponses factuelles strictes fondées sur vos documents indexés.
              </p>
            </div>
          </motion.div>

          {/* Fast testing helper */}
          {onQuickDemoLogin && (
            <div className="pt-2">
              <button
                onClick={onQuickDemoLogin}
                className="text-xs text-slate-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer transition-colors"
              >
                Tester immédiatement avec le profil officiel CNIPLC (Driss Mahamoud Farah • Code: 123456)
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Institutional Legal Footer */}
      <footer className="relative z-10 border-t border-white/5 py-4 px-6 bg-slate-950/80 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} CNIPLC — République de Djibouti</span>
          <span>•</span>
          <span>Commission Nationale Indépendante pour la Prévention et la Lutte contre la Corruption</span>
        </div>

        <div className="flex items-center gap-4">
          <a href="/officelink" className="hover:text-slate-300 transition-colors">Portail OfficeLink</a>
          <a href="/pdf-studio" className="hover:text-slate-300 transition-colors">PDF Studio</a>
          <button 
            onClick={onOpenSignalement}
            className="hover:text-red-300 text-slate-400 transition-colors cursor-pointer"
          >
            Signaler un Incident IT
          </button>

          {/* Discreet Almost Invisible Point for "Espace Technicien IT" */}
          <div className="relative group flex items-center ml-1">
            <button
              onClick={onOpenTechnician}
              className="w-2.5 h-2.5 rounded-full bg-slate-800/50 hover:bg-emerald-500/80 transition-all cursor-pointer opacity-25 hover:opacity-100 hover:scale-150"
              title="Point d'accès"
              aria-label="Accès discret Espace Technicien"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
