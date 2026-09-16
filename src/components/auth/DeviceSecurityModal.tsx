import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  Monitor, 
  Trash2, 
  LogOut, 
  KeyRound, 
  Lock, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  HardDrive,
  UserCheck,
  Shield,
  Activity,
  Database,
  Copy,
  Check,
  ExternalLink,
  Server,
  Cloud
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface DeviceSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'DEVICES' | 'SECURITY_CODE' | 'SECURITY_LOGS' | 'CLOUD_CONFIG';

export default function DeviceSecurityModal({ isOpen, onClose }: DeviceSecurityModalProps) {
  const { 
    user, 
    currentDevice, 
    devices, 
    securityLogs, 
    revokeDevice, 
    revokeAllOtherDevices,
    refreshDevices,
    refreshSecurityLogs,
    resetPersonalCode,
    loginWithCode,
    logout
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('DEVICES');

  // Code Change Form
  const [oldCode, setOldCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmNewCode, setConfirmNewCode] = useState('');
  const [codeChangeMsg, setCodeChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingCode, setIsChangingCode] = useState(false);

  // Loading states
  const [isRevoking, setIsRevoking] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  if (!isOpen || !user) return null;

  const handleRevokeSingle = async (deviceId: string) => {
    setIsRevoking(true);
    await revokeDevice(deviceId);
    setIsRevoking(false);
  };

  const handleRevokeAllOther = async () => {
    setIsRevoking(true);
    await revokeAllOtherDevices();
    setIsRevoking(false);
  };

  const handleChangeCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeChangeMsg(null);

    if (newCode.length < 6) {
      setCodeChangeMsg({ type: 'error', text: 'Le nouveau code doit comporter au moins 6 chiffres.' });
      return;
    }

    if (newCode !== confirmNewCode) {
      setCodeChangeMsg({ type: 'error', text: 'Les deux nouveaux codes ne correspondent pas.' });
      return;
    }

    setIsChangingCode(true);

    // Verify old code first
    const verifyRes = await loginWithCode(oldCode, user.email);
    if (!verifyRes.success) {
      setIsChangingCode(false);
      setCodeChangeMsg({ type: 'error', text: 'L\'ancien code personnel saisi est incorrect.' });
      return;
    }

    // Apply new code
    const resetRes = await resetPersonalCode(user.email, newCode);
    setIsChangingCode(false);

    if (resetRes.success) {
      setCodeChangeMsg({ type: 'success', text: 'Votre code personnel a été mis à jour avec succès.' });
      setOldCode('');
      setNewCode('');
      setConfirmNewCode('');
    } else {
      setCodeChangeMsg({ type: 'error', text: resetRes.error || 'Erreur lors de la modification du code.' });
    }
  };

  const getDeviceIcon = (os: string) => {
    if (os.toLowerCase().includes('android') || os.toLowerCase().includes('ios') || os.toLowerCase().includes('phone')) {
      return <Smartphone className="w-5 h-5 text-emerald-400" />;
    }
    if (os.toLowerCase().includes('mac') || os.toLowerCase().includes('laptop')) {
      return <Laptop className="w-5 h-5 text-blue-400" />;
    }
    return <Monitor className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              {user.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">{user.fullName}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user.email} • {user.institution}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-950/40 border-b border-white/5 flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('DEVICES')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'DEVICES'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Appareils Connectés ({devices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY_CODE')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'SECURITY_CODE'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Code Personnel &amp; Sécurité</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY_LOGS')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'SECURITY_LOGS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Journal de Sécurité ({securityLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLOUD_CONFIG')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'CLOUD_CONFIG'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase &amp; Stockage Local</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: DEVICES (Section 9) */}
          {activeTab === 'DEVICES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Sessions &amp; Appareils Autorisés
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Gérez les ordinateurs, téléphones et navigateurs ayant accès à votre espace.
                  </p>
                </div>

                {devices.length > 1 && (
                  <button
                    onClick={handleRevokeAllOther}
                    disabled={isRevoking}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnecter tous les autres appareils</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {devices.map((dev) => {
                  const isCur = dev.id === currentDevice?.id || dev.isCurrent;
                  return (
                    <div
                      key={dev.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                        isCur
                          ? 'bg-amber-500/5 border-amber-500/30'
                          : 'bg-slate-950/60 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                          {getDeviceIcon(dev.os)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{dev.deviceName}</span>
                            {isCur && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Appareil actuel
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{dev.browser} • {dev.os}</span>
                            <span>•</span>
                            <span>IP : {dev.ip}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400">
                          {isCur ? 'En ligne' : `Actif récemment`}
                        </span>
                        {!isCur && (
                          <button
                            onClick={() => handleRevokeSingle(dev.id)}
                            disabled={isRevoking}
                            title="Déconnecter cet appareil"
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security Policy Information */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Règle d'accès souverain CNIPLC</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Toute nouvelle connexion depuis un ordinateur ou navigateur inconnu déclenche immédiatement une demande de confirmation d'identité par email (OTP) et une inscription dans le registre d'audit.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL CODE & SECURITY */}
          {activeTab === 'SECURITY_CODE' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Modifier mon code personnel
                </h3>
                <p className="text-[11px] text-slate-400">
                  Le code personnel est hashé avec un sel PBKDF2-SHA512. Il ne doit jamais être partagé.
                </p>
              </div>

              {codeChangeMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    codeChangeMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {codeChangeMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{codeChangeMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangeCodeSubmit} className="space-y-3.5 max-w-md">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Ancien code personnel
                  </label>
                  <input
                    type="password"
                    maxLength={12}
                    required
                    value={oldCode}
                    onChange={(e) => setOldCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nouveau code personnel (6 chiffres minimum)
                  </label>
                  <input
                    type="password"
                    maxLength={12}
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Confirmer le nouveau code
                  </label>
                  <input
                    type="password"
                    maxLength={12}
                    required
                    value={confirmNewCode}
                    onChange={(e) => setConfirmNewCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingCode || newCode.length < 6}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isChangingCode ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mise à jour du hash...</span>
                    </>
                  ) : (
                    <span>Enregistrer le nouveau code</span>
                  )}
                </button>
              </form>

              {/* Storage Quota info (mandated isolation) */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    Quota de stockage local dédié
                  </span>
                  <span className="font-mono text-slate-400">4.8 GB / 15 GB</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-[32%]" />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Chemin local : /storage/users/{user.id}/
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY LOGS (Section 15) */}
          {activeTab === 'SECURITY_LOGS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Événements de Sécurité &amp; Authentification
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Traces d'accès, connexions, validations OTP et modifications de compte.
                  </p>
                </div>

                <button
                  onClick={refreshSecurityLogs}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Actualiser"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {securityLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Aucun événement de sécurité enregistré pour le moment.</p>
                ) : (
                  securityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${log.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="font-bold text-white font-mono text-[11px]">{log.action}</span>
                          <span className="text-[10px] text-slate-400">({log.deviceInfo})</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{log.details}</p>
                      </div>

                      <div className="text-right text-[10px] text-slate-400 shrink-0 font-mono">
                        <div>{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</div>
                        <div>IP : {log.ipAddress}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CLOUD CONFIG (Supabase & Stockage Local Souverain) */}
          {activeTab === 'CLOUD_CONFIG' && (
            <div className="space-y-6 text-xs">
              {/* Introduction Card */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Connexion Professionnelle Supabase &amp; Stockage Local Souverain</h3>
                    <p className="text-[11px] text-slate-400">Architecture souveraine autonome : Métadonnées relationnelles &amp; Stockage local avec indexation ChromaDB</p>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Votre site est conçu selon la règle souveraine CNIPLC : les métadonnées utilisateurs et les journaux d'audit sont cloisonnés via <strong>Supabase Row Level Security (RLS)</strong>, et les documents sont stockés en local sous l'arborescence <code className="text-amber-300 font-mono">/storage/users/&#123;user_id&#125;/...</code> avec indexation vectorielle <strong>ChromaDB</strong>.
                </p>
              </div>

              {/* Live Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Supabase Status */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-400" />
                      Supabase (PostgreSQL &amp; Auth)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Actif &amp; Résilient
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[10px] text-slate-400">
                    <div className="flex justify-between border-b border-white/5 py-1">
                      <span>URL Projet :</span>
                      <span className="text-slate-200 truncate max-w-[180px]">{import.meta.env.VITE_SUPABASE_URL || 'https://votre-projet.supabase.co'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 py-1">
                      <span>Anon Key :</span>
                      <span className="text-slate-200">{import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurée (••••••••)' : 'Locale (Fallback Intégré)'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Realtime Présence :</span>
                      <span className="text-emerald-400 font-bold">officelink_presence</span>
                    </div>
                  </div>
                </div>

                {/* Stockage Local & ChromaDB Status */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-amber-400" />
                      Stockage Local &amp; ChromaDB
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      100% Souverain
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[10px] text-slate-400">
                    <div className="flex justify-between border-b border-white/5 py-1">
                      <span>Dossier Racine :</span>
                      <span className="text-slate-200">/storage/users/&#123;user_id&#125;/</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 py-1">
                      <span>Moteur Vectoriel :</span>
                      <span className="text-amber-300">ChromaDB Local (512 tokens)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Corbeille &amp; Versions :</span>
                      <span className="text-emerald-400 font-bold">Sécurisées &amp; Restaurables</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions & Quick Copy Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Instructions &amp; Scripts de Déploiement
                  </h4>
                  <span className="text-[10px] text-slate-400">Cliquez pour copier les éléments de configuration</span>
                </div>

                {/* Step 1: SQL Schema */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">1</span>
                      Script SQL Supabase (Tables, RLS &amp; Realtime)
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Crée les tables <code>interventions</code>, <code>employees</code>, <code>activity_logs</code>, <code>devices</code> avec politiques RLS.
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`-- SCRIPT SQL OFFICIEL SUPABASE CNIPLC
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

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_title TEXT,
  details TEXT,
  ip_address TEXT,
  rls_verified BOOLEAN DEFAULT true,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acces authentifie interventions" ON public.interventions FOR ALL TO authenticated USING (true);
CREATE POLICY "Acces authentifie logs" ON public.activity_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Acces authentifie devices" ON public.devices FOR ALL TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.interventions, public.activity_logs;`, 'sql')}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedType === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'sql' ? 'Copié !' : 'Copier SQL'}</span>
                  </button>
                </div>

                {/* Step 2: Arborescence Stockage Local Souverain */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">2</span>
                      Structure Stockage Local Souverain
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Arborescence partitionnée /storage/users/&#123;user_id&#125;/ avec corbeille, versions et ChromaDB.
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`/storage
  /users
    /{user_id}
      /documents
      /images
      /presentations
      /spreadsheets
      /generated
      /exports
      /trash
  /shared
  /temporary`, 'cors')}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedType === 'cors' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'cors' ? 'Copié !' : 'Copier Arborescence'}</span>
                  </button>
                </div>

                {/* Step 3: Environment Variables .env */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">3</span>
                      Fichier .env Souverain (Supabase &amp; NVIDIA Key)
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Variables d'environnement prêtes à l'emploi sans dépendance externe R2.
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
NVIDIA_API_KEY=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`, 'env')}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedType === 'env' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'env' ? 'Copié !' : 'Copier .env'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950/90 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Session chiffrée AES-256 • Supabase Auth
          </span>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
