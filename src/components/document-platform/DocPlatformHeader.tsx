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
  previousTab?: string | null;
  onSelectTab: (tab: string) => void;
  onQuickJumpToAi?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSecurity?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
}

export default function DocPlatformHeader({
  activeTab,
  previousTab,
  onSelectTab,
  onQuickJumpToAi,
  searchQuery,
  onSearchChange,
  onOpenSecurity,
  onOpenLogin,
  onOpenRegister
}: DocPlatformHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const isAiActive = activeTab === 'chat' || activeTab === 'search';

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Official CNIPLC Brand & Logo (Large & Professionally Animated) */}
        <div className="flex items-center gap-4 shrink-0">
          <div 
            className="relative group cursor-pointer" 
            onClick={() => onSelectTab('dashboard')}
            title="CNIPLC - Accueil du Tableau de Bord"
          >
            {/* Animated Ambient Aura & Glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-500/40 via-emerald-500/30 to-blue-500/30 rounded-2xl blur-md opacity-80 group-hover:opacity-100 animate-pulse transition duration-500" />
            
            {/* Institutional Decorative Frame */}
            <div className="relative rounded-2xl p-0.5 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 shadow-xl shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
              <img 
                src="/logo.jpeg" 
                alt="CNIPLC Logo Officiel de la République de Djibouti" 
                className="anim-logo w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-[14px] bg-white p-1 border border-white/40 shadow-inner relative z-10 transition-all duration-300" 
              />
              {/* Subtle animated status badge */}
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 z-20">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950" />
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-wider text-white font-sans drop-shadow-sm">
                CNIPLC
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-500/30 shadow-sm">
                République de Djibouti
              </span>
            </div>
            <p className="hidden sm:block text-[11.5px] text-slate-300 font-medium truncate max-w-md">
              Commission Nationale Indépendante pour la Prévention et la Lutte contre la Corruption
            </p>
          </div>
        </div>

        {/* Center: Global Instant Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
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

        {/* Right: Quick Access AI shortcut + User Badge */}
        <div className="flex items-center gap-2.5">
          {/* Quick Access Shortcut to Recherche Sémantique & Assistant IA */}
          <button
            onClick={onQuickJumpToAi}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-sm cursor-pointer ${
              isAiActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-amber-500/20'
                : 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20 hover:from-amber-500/30 hover:via-purple-500/30 hover:to-blue-500/30 border-amber-500/40 text-amber-200 hover:text-white font-semibold'
            }`}
            title="Raccourci Accès Rapide : Recherche Sémantique & Assistant IA (Alt+A)"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiActive ? 'text-slate-950 animate-spin' : 'text-amber-400 animate-pulse'}`} />
            <span className="hidden sm:inline text-xs">
              {isAiActive && previousTab ? '← Retour Position' : 'Accès Rapide IA'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              isAiActive ? 'bg-slate-900/30 text-slate-950 font-bold' : 'bg-black/40 text-slate-300 border border-white/10'
            }`}>
              Alt+A
            </span>
          </button>
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
