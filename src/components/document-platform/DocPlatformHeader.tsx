import { 
  Building2, 
  Search, 
  Bell, 
  ShieldCheck, 
  ExternalLink, 
  FileText, 
  Layers,
  Sparkles,
  Database,
  KeyRound,
  Shield,
  Laptop
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface DocPlatformHeaderProps {
  activeTab?: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSecurity?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export default function DocPlatformHeader({
  onSelectTab,
  searchQuery,
  onSearchChange,
  onOpenSecurity,
  onOpenLogin,
  onOpenRegister
}: DocPlatformHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Official CNIPLC Brand & Logo */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="relative group cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300" />
            <img 
              src="/logo.jpeg" 
              alt="CNIPLC Logo Officiel" 
              className="w-11 h-11 object-contain rounded-xl border border-white/20 bg-white p-0.5 shadow-lg relative z-10" 
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-white font-sans">
                CNIPLC
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Plateforme IA Documentaire
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 font-medium truncate max-w-md">
              Commission Nationale Indépendante pour la Prévention et la Lutte contre la Corruption
            </p>
          </div>
        </div>

        {/* Center: Global Instant Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (e.target.value.trim().length > 0) {
                  onSelectTab('search');
                }
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  onSelectTab('search');
                }
              }}
              placeholder="Recherche sémantique : rapport 2025, corruption, écoles..."
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-20 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                IA RAG
              </span>
            </div>
          </div>
        </div>

        {/* Right: User Badge / Auth trigger */}
        <div className="flex items-center gap-2.5">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSecurity}
                title="Gérer les appareils autorisés et la sécurité"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all text-left group cursor-pointer border border-transparent hover:border-white/10"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 text-xs font-black border border-amber-400/40 shadow-sm group-hover:scale-105 transition-transform">
                  {user.avatarInitials}
                </div>
                <div className="hidden xl:block leading-tight">
                  <div className="text-xs font-semibold text-white flex items-center gap-1">
                    <span>{user.fullName}</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Laptop className="w-2.5 h-2.5 text-amber-400" />
                    <span>Sécurité &amp; Appareils</span>
                  </div>
                </div>
              </button>

              <button
                onClick={logout}
                title="Se déconnecter de la session"
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <span className="sr-only">Déconnexion</span>
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 cursor-pointer transition-all"
              >
                Se connecter
              </button>
              <button
                onClick={onOpenRegister}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer transition-all"
              >
                Créer mon espace
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
