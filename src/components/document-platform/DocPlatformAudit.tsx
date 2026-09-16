import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Filter, 
  User, 
  FileText, 
  Key,
  CheckCircle2
} from 'lucide-react';
import { AuditLogEntry } from '../../types/documentPlatform';

interface DocPlatformAuditProps {
  logs: AuditLogEntry[];
}

export default function DocPlatformAudit({ logs }: DocPlatformAuditProps) {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
          Journal d'Audit &amp; Traçabilité RLS
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Enregistrement immuable de chaque accès, requête IA, export et modification documentaire
        </p>
      </div>

      {/* Security Status Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Row Level Security (RLS)</div>
            <div className="text-[11px] text-emerald-400">100% des requêtes vérifiées</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Stockage Souverain</div>
            <div className="text-[11px] text-slate-400">Local &amp; ChromaDB</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Horodatage Certifié</div>
            <div className="text-[11px] text-slate-400">UTC+3 (Heure de Djibouti)</div>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-950/80 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-white">Événements Récents ({logs.length})</span>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Audit Actif
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-white/5 transition-colors space-y-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    log.action === 'RAG_QUERY' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                    log.action === 'GENERATE_DOCX' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
                    log.action === 'GENERATE_PDF' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                    log.action === 'UPLOAD' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {log.action}
                  </span>
                  <span className="font-bold text-white">{log.userName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({log.userRole})</span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 text-[11px] font-mono">
                  <span>IP : {log.ipAddress}</span>
                  <span>{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                </div>
              </div>

              <div className="text-slate-300">
                {log.details}
              </div>

              {log.resourceTitle && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300/90 font-medium">{log.resourceTitle}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
