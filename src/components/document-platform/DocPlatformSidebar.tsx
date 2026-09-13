import { 
  LayoutDashboard, 
  Files, 
  Search, 
  Bot, 
  Building2, 
  FileCheck, 
  ShieldAlert, 
  Database,
  Cloud,
  ChevronRight,
  Laptop,
  KeyRound
} from 'lucide-react';

interface DocPlatformSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  documentCount: number;
  onOpenSecurity?: () => void;
}

export default function DocPlatformSidebar({
  activeTab,
  onSelectTab,
  documentCount,
  onOpenSecurity
}: DocPlatformSidebarProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: LayoutDashboard,
      badge: null,
      color: 'text-amber-400'
    },
    {
      id: 'documents',
      label: 'Mes Documents & GED',
      icon: Files,
      badge: `${documentCount}`,
      color: 'text-blue-400'
    },
    {
      id: 'search',
      label: 'Recherche Sémantique',
      icon: Search,
      badge: 'IA',
      color: 'text-emerald-400'
    },
    {
      id: 'chat',
      label: 'Assistant IA & RAG',
      icon: Bot,
      badge: 'Ollama/Gemini',
      color: 'text-purple-400'
    },
    {
      id: 'workspaces',
      label: 'Espaces Institutionnels',
      icon: Building2,
      badge: '6 déps',
      color: 'text-indigo-400'
    },
    {
      id: 'generator',
      label: 'Générateur de Rapports',
      icon: FileCheck,
      badge: 'Word/PDF',
      color: 'text-teal-400'
    },
    {
      id: 'audit',
      label: 'Journal d\'Audit & Sécurité',
      icon: ShieldAlert,
      badge: 'RLS',
      color: 'text-rose-400'
    }
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-950/60 border-r border-white/5 p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 block">
            Navigation Principale
          </span>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isActive 
                        ? 'bg-amber-500/30 text-amber-200' 
                        : 'bg-white/5 text-slate-400 border border-white/5'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
            {onOpenSecurity && (
              <button
                onClick={onOpenSecurity}
                className="w-full mt-2 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-amber-400" />
                  <span>Sécurité &amp; Appareils</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Gérer
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Infrastructure Status Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              Stockage R2 Actif
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">12.4 Go</span>
          </div>
          
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-1.5 rounded-full w-[14%]" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-purple-400" />
              Supabase RLS
            </span>
            <span className="text-emerald-400">Sécurisé</span>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="pt-4 border-t border-white/5 text-[10px] text-slate-400 flex items-center justify-between px-2">
        <span>v2.5 • RAG Hybride</span>
        <span className="text-slate-400 font-mono">Qdrant Vector</span>
      </div>
    </aside>
  );
}
