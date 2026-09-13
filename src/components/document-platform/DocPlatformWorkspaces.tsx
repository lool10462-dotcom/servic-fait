import { useState } from 'react';
import { 
  Building2, 
  Scale, 
  GraduationCap, 
  Users, 
  Megaphone, 
  FolderArchive, 
  Files, 
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { InstitutionDocument, WorkspaceId, WorkspaceInfo } from '../../types/documentPlatform';
import { INITIAL_WORKSPACES } from '../../data/mockDocuments';

interface DocPlatformWorkspacesProps {
  documents: InstitutionDocument[];
  onSelectDocument: (doc: InstitutionDocument) => void;
  onAskAiPrompt: (prompt: string) => void;
  onSelectTab: (tab: string) => void;
}

export default function DocPlatformWorkspaces({
  documents,
  onSelectDocument,
  onAskAiPrompt,
  onSelectTab
}: DocPlatformWorkspacesProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('direction');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scale': return <Scale className="w-6 h-6 text-emerald-400" />;
      case 'GraduationCap': return <GraduationCap className="w-6 h-6 text-amber-400" />;
      case 'Users': return <Users className="w-6 h-6 text-blue-400" />;
      case 'Megaphone': return <Megaphone className="w-6 h-6 text-purple-400" />;
      case 'FolderArchive': return <FolderArchive className="w-6 h-6 text-teal-400" />;
      default: return <Building2 className="w-6 h-6 text-indigo-400" />;
    }
  };

  const currentWorkspaceInfo = INITIAL_WORKSPACES.find(w => w.id === activeWorkspace) || INITIAL_WORKSPACES[0];
  const workspaceDocs = documents.filter(d => d.workspaceId === activeWorkspace);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-indigo-400" />
          Espaces Documentaires Institutionnels
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Partitionnement des archives par direction et département avec règles d'isolation RLS
        </p>
      </div>

      {/* Workspace Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INITIAL_WORKSPACES.map((ws) => {
          const isSelected = activeWorkspace === ws.id;
          const count = documents.filter(d => d.workspaceId === ws.id).length;

          return (
            <div
              key={ws.id}
              onClick={() => setActiveWorkspace(ws.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10 scale-[1.02]'
                  : 'bg-slate-900/50 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {getIcon(ws.iconName)}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                    {count} doc(s)
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-tight">
                  {ws.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                  {ws.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5 text-[11px]">
                <span className="text-slate-500">{ws.memberCount} agents habilités</span>
                <span className={`font-semibold flex items-center gap-1 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                  {isSelected ? 'Espace Actif' : 'Ouvrir'}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed view of active workspace */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {currentWorkspaceInfo.name}
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                RLS Isolé
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentWorkspaceInfo.description}
            </p>
          </div>

          <button
            onClick={() => {
              onAskAiPrompt(`Fais une synthèse exhaustive de tous les documents de l'espace "${currentWorkspaceInfo.name}".`);
              onSelectTab('chat');
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            Synthèse IA de cet Espace
          </button>
        </div>

        {/* Documents in workspace */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Documents déposés ({workspaceDocs.length}) :
          </span>

          {workspaceDocs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Aucun document spécifique actuellement dans cet espace.
            </div>
          ) : (
            workspaceDocs.map(doc => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <h4 
                      onClick={() => onSelectDocument(doc)}
                      className="text-xs font-bold text-white hover:text-amber-300 cursor-pointer"
                    >
                      {doc.title}
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      {doc.category} • {(doc.fileSize / 1024 / 1024).toFixed(2)} Mo • {doc.pageCount} pages
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectDocument(doc)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/5 cursor-pointer"
                  >
                    Examiner
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
