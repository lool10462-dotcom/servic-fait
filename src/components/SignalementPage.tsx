import React, { useState } from "react";

export default function SignalementPage() {
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
        alert("Erreur serveur lors de l'envoi.");
      }
    } catch (err) {
      alert("Erreur de connexion. Impossible d'envoyer le signalement.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center border border-white/10 shadow-2xl">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-white mb-3">Signalement envoyé !</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">Votre demande a été transmise avec succès à l'équipe technique.</p>
          <button 
            onClick={() => { setSent(false); setForm({ ...form, description: "" }); }}
            className="text-emerald-400 hover:text-emerald-300 underline font-semibold"
          >
            Nouveau signalement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="pt-12 pb-6 text-center px-4">
        <div className="flex justify-center mb-6">
          <img src="/logo.jpeg" alt="CNIPLC Logo" className="w-24 h-24 object-contain rounded-2xl shadow-xl border border-white/10 bg-white anim-logo" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 anim-title">CNIPLC</h1>
        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed anim-subtitle">
          Commission Nationale Indépendante pour la Prévention et la Lutte contre la Corruption
        </p>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-16 space-y-8">
        {/* Intro text */}
        <div className="text-center anim-hero">
          <p className="text-slate-300 text-[15px] leading-relaxed border-l-2 border-amber-500 pl-4 text-left italic bg-slate-900/40 p-4 rounded-r-xl shadow-sm">
            "Bienvenue sur le portail officiel d'assistance informatique. Notre équipe technique est à votre disposition pour assurer la continuité et la sécurité de vos outils de travail. Signalez toute anomalie avec précision pour une intervention rapide."
          </p>
        </div>

        {/* Carte Signal */}
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl anim-card">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400 text-2xl border border-red-500/20 shadow-inner anim-float">
              📋
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Registre de Signalement</h2>
              <p className="text-slate-400 text-sm mt-1">Assistance & Support technique IT</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm mb-1.5 font-medium">Nom de l'agent *</label>
              <input
                type="text"
                required
                value={form.agentName}
                onChange={e => setForm({...form, agentName: e.target.value})}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                placeholder="Ex: Jean Dupont"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-300 text-sm mb-1.5 font-medium">Type de demande *</label>
                <select
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                >
                  <option value="bug">🐛 Bug technique</option>
                  <option value="acces">🔐 Demande d'accès</option>
                  <option value="fonctionnalite">✨ Nouvelle fonctionnalité</option>
                  <option value="incident">⚠️ Incident de sécurité</option>
                  <option value="autre">📌 Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1.5 font-medium">Priorité *</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({...form, priority: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                >
                  <option value="basse">🟢 Basse</option>
                  <option value="moyenne">🟡 Moyenne</option>
                  <option value="haute">🟠 Haute</option>
                  <option value="urgente">🔴 Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1.5 font-medium">Contact (email/téléphone) *</label>
              <input
                type="text"
                required
                value={form.contact}
                onChange={e => setForm({...form, contact: e.target.value})}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                placeholder="email@cniplc.gov ou +253..."
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-1.5 font-medium">Description détaillée *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                placeholder="Décrivez votre problème ou besoin en détail..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25 text-lg"
            >
              {loading ? "⏳ Envoi en cours..." : "📤 Envoyer le signalement"}
            </button>
          </form>
        </div>

        {/* Zone intelligente - Redirection Service Fait */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/30 backdrop-blur-lg rounded-3xl p-8 border border-emerald-500/30 shadow-xl group hover:border-emerald-500/50 transition-all anim-cta">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-inner border border-emerald-500/30 group-hover:scale-110 transition-transform">
              💡
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-emerald-300 mb-2">
                Espace Technicien IT
              </h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Si vous êtes membre de l'équipe informatique et que vous souhaitez accéder à l'application 
                <span className="text-white font-semibold"> Service Fait (Registre Pro)</span> pour gérer les interventions, 
                cliquez ci-dessous.
              </p>
              <a
                href="/service-fait"
                className="inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:translate-x-2 shadow-lg shadow-emerald-600/30"
              >
                Accéder à Service Fait
                <span className="text-xl">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-500 text-xs font-medium opacity-60 anim-footer">
          © 2026 CNIPLC — Plateforme de Signalement Sécurisée
        </footer>
      </main>
    </div>
  );
}
