import React, { useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { 
  ShieldAlert, 
  User, 
  Mail, 
  AlertOctagon, 
  HelpCircle, 
  Zap, 
  Wrench, 
  FileText, 
  ArrowRight,
  Send,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

// Reusable 3D Tilt Card Component for high-end parallax effect
function Card3D({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [0, 1], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-15, 15]), springConfig);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };
  
  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };
  
  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`perspective-1000 transition-all duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}

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
        const data = await res.json().catch(() => ({}));
        alert("Erreur: " + (data.error || "Impossible d'envoyer le signalement sur Telegram. Vérifiez le token ou le Chat ID."));
      }
    } catch (err) {
      alert("Erreur de connexion. Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // 3D Entrance variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, rotateX: -10 },
    show: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 } 
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="glow-orb absolute top-10 left-10 w-96 h-96 bg-emerald-500 rounded-full" />
        <div className="glow-orb absolute bottom-10 right-10 w-96 h-96 bg-teal-500 rounded-full" />
        
        {/* 3D background grids */}
        <div className="bg-grid-3d" />
        <div className="bg-grid-3d-ceiling" />

        <Card3D className="max-w-md w-full z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="glass-panel-3d rounded-3xl p-8 text-center border border-white/10 shadow-2xl relative"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div 
              className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 text-emerald-400 text-4xl mb-6 shadow-lg shadow-emerald-500/10"
              style={{ transform: "translateZ(50px)" }}
            >
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <h2 
              className="text-3xl font-extrabold text-white mb-3 tracking-tight font-serif"
              style={{ transform: "translateZ(40px)" }}
            >
              Signalement envoyé !
            </h2>
            
            <p 
              className="text-slate-350 text-sm mb-8 leading-relaxed font-sans"
              style={{ transform: "translateZ(30px)" }}
            >
              Votre demande de support technique a été consignée et transmise avec succès à l'équipe informatique. Une intervention sera planifiée rapidement.
            </p>
            
            <button 
              onClick={() => { setSent(false); setForm({ ...form, description: "" }); }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 cursor-pointer text-sm"
              style={{ transform: "translateZ(40px)" }}
            >
              <RefreshCw className="w-4 h-4" />
              Nouveau signalement
            </button>
          </motion.div>
        </Card3D>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden pb-16">
      {/* Moving background glow orbs */}
      <div className="glow-orb absolute top-20 left-10 w-96 h-96 bg-amber-500/10 rounded-full pointer-events-none" />
      <div className="glow-orb absolute bottom-20 right-10 w-[450px] h-[450px] bg-teal-500/10 rounded-full pointer-events-none" />
      <div className="glow-orb absolute top-1/2 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full pointer-events-none" />

      {/* 3D Perspective Floor and Ceiling Grids */}
      <div className="bg-grid-3d" />
      <div className="bg-grid-3d-ceiling" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        
        {/* Animated Header */}
        <motion.header 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="pt-16 pb-10 text-center px-4"
        >
          <div className="flex justify-center mb-6 relative">
            {/* Double glow ring behind logo */}
            <div className="absolute w-24 h-24 rounded-2xl bg-amber-500/20 blur-xl animate-pulse" />
            <motion.img 
              whileHover={{ rotateY: 180, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              src="/logo.jpeg" 
              alt="CNIPLC Logo" 
              className="w-24 h-24 object-contain rounded-2xl shadow-2xl border border-white/10 bg-white cursor-pointer relative z-10 shadow-amber-500/10" 
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-amber-400">
            CNIPLC
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed font-sans uppercase tracking-widest font-semibold text-[11px]">
            Commission Nationale Indépendante pour la Prévention et la Lutte contre la Corruption
          </p>
        </motion.header>

        <motion.main 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-2xl mx-auto space-y-10"
        >
          {/* Welcome Quote panel */}
          <motion.div variants={itemVariants} className="perspective-1000">
            <div className="glass-panel-3d p-5 rounded-2xl border-l-4 border-amber-500/80 shadow-md">
              <p className="text-slate-350 text-[14.5px] leading-relaxed italic text-left relative pl-1">
                "Bienvenue sur le portail officiel d'assistance informatique du CNIPLC. Notre équipe technique est à votre disposition pour assurer la continuité et la sécurité de vos outils de travail. Signalez toute anomalie avec précision pour une intervention rapide."
              </p>
            </div>
          </motion.div>

          {/* Core Interactive 3D Form Card */}
          <motion.div variants={itemVariants}>
            <Card3D>
              <div 
                className="glass-panel-3d rounded-3xl p-8 border border-white/10 shadow-2xl relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Float elements */}
                <div 
                  className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6"
                  style={{ transform: "translateZ(30px)" }}
                >
                  <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 text-2xl border border-amber-500/20 shadow-inner">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Registre de Signalement</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Assistance &amp; Support technique IT</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" style={{ transform: "translateZ(20px)" }}>
                  
                  {/* Name field */}
                  <div>
                    <label className="block text-slate-300 text-xs mb-2 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      Nom de l'agent *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.agentName}
                      onChange={e => setForm({...form, agentName: e.target.value})}
                      className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-550 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-sans text-sm"
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>

                  {/* Grid for request type and priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-slate-300 text-xs mb-2 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Type de demande *
                      </label>
                      <select
                        value={form.type}
                        onChange={e => setForm({...form, type: e.target.value})}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-sans text-sm cursor-pointer"
                      >
                        <option value="bug">🐛 Bug technique</option>
                        <option value="acces">🔐 Demande d'accès</option>
                        <option value="fonctionnalite">✨ Nouvelle fonctionnalité</option>
                        <option value="incident">⚠️ Incident de sécurité</option>
                        <option value="autre">📌 Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-xs mb-2 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
                        Priorité *
                      </label>
                      <select
                        value={form.priority}
                        onChange={e => setForm({...form, priority: e.target.value})}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-sans text-sm cursor-pointer"
                      >
                        <option value="basse">🟢 Basse</option>
                        <option value="moyenne">🟡 Moyenne</option>
                        <option value="haute">🟠 Haute</option>
                        <option value="urgente">🔴 Urgente</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact field */}
                  <div>
                    <label className="block text-slate-300 text-xs mb-2 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                      Contact (email/téléphone) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.contact}
                      onChange={e => setForm({...form, contact: e.target.value})}
                      className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-550 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-sans text-sm"
                      placeholder="email@cniplc.gov ou +253..."
                    />
                  </div>

                  {/* Description field */}
                  <div>
                    <label className="block text-slate-300 text-xs mb-2 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      Description détaillée *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white placeholder-slate-550 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none font-sans text-sm"
                      placeholder="Décrivez votre problème ou besoin en détail..."
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/10 text-base cursor-pointer flex items-center justify-center gap-2 border border-amber-500/20"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <Send className="w-4 h-4" />
                    {loading ? "Envoi en cours..." : "Envoyer le signalement"}
                  </motion.button>
                </form>
              </div>
            </Card3D>
          </motion.div>

          {/* Staggered 3D Portal access cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: OfficeLink */}
            <motion.div variants={itemVariants} className="h-full">
              <Card3D className="h-full">
                <div 
                  className="bg-gradient-to-br from-blue-950/40 to-indigo-950/20 backdrop-blur-lg rounded-3xl p-6 border border-blue-500/15 shadow-xl hover:border-blue-500/30 transition-all flex flex-col justify-between h-full group"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div>
                    <div 
                      className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 mb-4"
                      style={{ transform: "translateZ(25px)" }}
                    >
                      <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 
                      className="text-lg font-bold text-blue-300 mb-2 font-sans"
                      style={{ transform: "translateZ(30px)" }}
                    >
                      Portail OfficeLink
                    </h3>
                    <p 
                      className="text-slate-350 text-xs leading-relaxed mb-6 font-sans"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      Accédez à la plateforme Intranet locale pour communiquer avec vos collègues et échanger des fichiers en temps réel sur le réseau local (LAN).
                    </p>
                  </div>
                  <a
                    href="/officelink"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl transition-all hover:translate-x-1 shadow-lg shadow-blue-600/10 text-xs w-full mt-auto"
                    style={{ transform: "translateZ(25px)" }}
                  >
                    Accéder à l'Intranet
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card3D>
            </motion.div>

            {/* Card 2: Espace Technicien IT */}
            <motion.div variants={itemVariants} className="h-full">
              <Card3D className="h-full">
                <div 
                  className="bg-gradient-to-br from-emerald-950/40 to-teal-950/20 backdrop-blur-lg rounded-3xl p-6 border border-emerald-500/15 shadow-xl hover:border-emerald-500/30 transition-all flex flex-col justify-between h-full group"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div>
                    <div 
                      className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-4"
                      style={{ transform: "translateZ(25px)" }}
                    >
                      <Wrench className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 
                      className="text-lg font-bold text-emerald-300 mb-2 font-sans"
                      style={{ transform: "translateZ(30px)" }}
                    >
                      Espace Technicien IT
                    </h3>
                    <p 
                      className="text-slate-350 text-xs leading-relaxed mb-6 font-sans"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      Consignez les interventions techniques de maintenance, éditez les rapports d'activités en format PDF et suivez les statistiques.
                    </p>
                  </div>
                  <a
                    href="/officelink/registre-it"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl transition-all hover:translate-x-1 shadow-lg shadow-emerald-600/10 text-xs w-full mt-auto"
                    style={{ transform: "translateZ(25px)" }}
                  >
                    Gérer les Interventions
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card3D>
            </motion.div>

            {/* Card 3: PDF Studio */}
            <motion.div variants={itemVariants} className="h-full">
              <Card3D className="h-full">
                <div 
                  className="bg-gradient-to-br from-purple-950/40 to-violet-950/20 backdrop-blur-lg rounded-3xl p-6 border border-purple-500/15 shadow-xl hover:border-purple-500/30 transition-all flex flex-col justify-between h-full group"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div>
                    <div 
                      className="w-12 h-12 bg-purple-500/15 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/20 mb-4"
                      style={{ transform: "translateZ(25px)" }}
                    >
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 
                      className="text-lg font-bold text-purple-300 mb-2 font-sans"
                      style={{ transform: "translateZ(30px)" }}
                    >
                      PDF Studio
                    </h3>
                    <p 
                      className="text-slate-355 text-xs leading-relaxed mb-6 font-sans"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      Fusionnez, divisez, compressez, convertissez et signez vos fichiers PDF localement dans votre navigateur en toute sécurité.
                    </p>
                  </div>
                  <a
                    href="/pdf-studio"
                    className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-3 rounded-xl transition-all hover:translate-x-1 shadow-lg shadow-purple-600/10 text-xs w-full mt-auto"
                    style={{ transform: "translateZ(25px)" }}
                  >
                    Ouvrir PDF Studio
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card3D>
            </motion.div>

          </div>

          {/* Footer */}
          <motion.footer 
            variants={itemVariants}
            className="text-center text-slate-500 text-xs font-medium opacity-60 pt-4"
          >
            © 2026 CNIPLC — Plateforme de Signalement Sécurisée
          </motion.footer>

        </motion.main>
      </div>
    </div>
  );
}
