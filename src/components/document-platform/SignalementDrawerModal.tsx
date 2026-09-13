import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  User, 
  Mail, 
  AlertOctagon, 
  HelpCircle, 
  Zap, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  X,
  Clock,
  Radio
} from 'lucide-react';

interface SignalementDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignalementDrawerModal({ isOpen, onClose }: SignalementDrawerModalProps) {
  const [form, setForm] = useState({
    agentName: "",
    type: "bug",
    priority: "moyenne",
    description: "",
    contact: ""
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/notify-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          timestamp: new Date().toLocaleString("fr-FR")
        })
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        alert("Erreur: " + (data.error || "Impossible d'envoyer le signalement sur Telegram. Vérifiez la configuration."));
      }
    } catch {
      alert("Erreur de connexion. Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
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
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden z-10 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-amber-500/15 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-inner">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Registre de Signalement IT
                    </h2>
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wide">
                      <Radio className="w-2.5 h-2.5 animate-pulse text-amber-400" />
                      Canal Direct
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Assistance &amp; Support technique informatique immédiat — CNIPLC
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

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 text-emerald-400 mb-6 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2 font-serif">
                    Signalement transmis avec succès !
                  </h3>
                  
                  <p className="text-slate-350 text-sm mb-6 leading-relaxed max-w-md mx-auto">
                    Votre demande d'assistance technique a été notifiée instantanément à l'équipe informatique via le canal d'urgence. Un technicien prendra en charge l'intervention.
                  </p>
                  
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={() => { setSent(false); setForm({ ...form, description: "" }); }}
                      className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all border border-white/10 cursor-pointer text-xs"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Nouveau signalement
                    </button>
                    <button 
                      onClick={onClose}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer text-xs"
                    >
                      Fermer la fenêtre
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Remplissez ce formulaire pour les pannes réseau, dysfonctionnements logiciels, matériels ou accès. Une alerte est transmise directement au service technique.
                    </span>
                  </div>

                  {/* Agent Name */}
                  <div>
                    <label className="block text-slate-300 text-xs mb-1.5 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      Nom complet de l'agent demandeur *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.agentName}
                      onChange={e => setForm({...form, agentName: e.target.value})}
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                      placeholder="Ex: M. Mohamed Abdillahi (Direction Juridique)"
                    />
                  </div>

                  {/* Grid: Type and Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-xs mb-1.5 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Type d'incident *
                      </label>
                      <select
                        value={form.type}
                        onChange={e => setForm({...form, type: e.target.value})}
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm cursor-pointer"
                      >
                        <option value="bug">🐛 Panne matérielle / Bug</option>
                        <option value="acces">🔐 Demande d'accès / Mot de passe</option>
                        <option value="fonctionnalite">✨ Logiciel / Configuration</option>
                        <option value="incident">⚠️ Incident réseau ou sécurité</option>
                        <option value="autre">📌 Autre besoin technique</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-xs mb-1.5 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
                        Degré d'urgence *
                      </label>
                      <select
                        value={form.priority}
                        onChange={e => setForm({...form, priority: e.target.value})}
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm cursor-pointer"
                      >
                        <option value="basse">🟢 Basse (Sous 48h)</option>
                        <option value="moyenne">🟡 Moyenne (Dans la journée)</option>
                        <option value="haute">🟠 Haute (Prioritaire)</option>
                        <option value="urgente">🔴 Urgente (Bloquant immédiat)</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="block text-slate-300 text-xs mb-1.5 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                      Contact direct (Email ou poste téléphonique) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.contact}
                      onChange={e => setForm({...form, contact: e.target.value})}
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                      placeholder="Ex: poste 214 ou agent@cniplc.dj"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-slate-300 text-xs mb-1.5 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      Description précise du problème *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none text-sm"
                      placeholder="Précisez la salle, l'équipement concerné et le comportement constaté..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-xs cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Transmettre le Signalement
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
