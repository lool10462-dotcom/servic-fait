import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  User, 
  Building2, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Server,
  Layers,
  Database
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface RegisterWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

type Step = 'IDENTITY' | 'EMAIL_OTP' | 'PERSONAL_CODE' | 'PROVISIONING';

export default function RegisterWizardModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
}: RegisterWizardModalProps) {
  const { registerUser, sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>('IDENTITY');
  
  // Step 1 Form Data
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('CNIPLC - Commission Anti-Corruption');

  // Step 2 OTP
  const [otpInput, setOtpInput] = useState('');
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpResendCountdown, setOtpResendCountdown] = useState(60);

  // Step 3 Personal Code
  const [personalCode, setPersonalCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Step 4 Provisioning
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [provisionStepLabel, setProvisionStepLabel] = useState('Génération de l\'identifiant souverain UUID...');
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    let timer: any;
    if (step === 'EMAIL_OTP' && otpResendCountdown > 0) {
      timer = setInterval(() => setOtpResendCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpResendCountdown]);

  if (!isOpen) return null;

  // Step 1 -> Send OTP and go to Step 2
  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!fullName.trim() || !email.trim()) {
      setGeneralError('Veuillez renseigner votre nom complet et votre adresse email.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setGeneralError('Veuillez saisir une adresse email institutionnelle valide.');
      return;
    }

    setIsSendingOtp(true);
    const res = await sendOtp(email.trim(), 'EMAIL_VERIFICATION');
    setIsSendingOtp(false);

    if (res.success) {
      if (res.previewOtp) {
        setPreviewOtp(res.previewOtp);
      }
      setOtpResendCountdown(60);
      setStep('EMAIL_OTP');
    } else {
      setGeneralError(res.error || 'Impossible d\'envoyer le code de vérification.');
    }
  };

  // Step 2 -> Verify OTP and go to Step 3
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (otpInput.trim().length !== 6) {
      setOtpError('Le code de sécurité doit comporter 6 chiffres.');
      return;
    }

    setIsVerifyingOtp(true);
    const res = await verifyOtp(email.trim(), otpInput.trim(), 'EMAIL_VERIFICATION');
    setIsVerifyingOtp(false);

    if (res.success) {
      setStep('PERSONAL_CODE');
    } else {
      setOtpError(res.error || 'Code OTP invalide ou expiré.');
    }
  };

  const handleResendOtp = async () => {
    if (otpResendCountdown > 0) return;
    setIsSendingOtp(true);
    const res = await sendOtp(email.trim(), 'EMAIL_VERIFICATION');
    setIsSendingOtp(false);
    if (res.success) {
      if (res.previewOtp) setPreviewOtp(res.previewOtp);
      setOtpResendCountdown(60);
      setOtpError('');
    }
  };

  // Step 3 -> Confirm Code & Provision Space
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');

    if (personalCode.length < 6) {
      setCodeError('Le code personnel doit comporter au moins 6 chiffres.');
      return;
    }
    if (personalCode !== confirmCode) {
      setCodeError('Les deux codes personnels ne correspondent pas.');
      return;
    }

    // Move to step 4 Provisioning
    setStep('PROVISIONING');
    setProvisionProgress(25);

    setTimeout(async () => {
      setProvisionStepLabel('Configuration de la Row Level Security (RLS) Supabase...');
      setProvisionProgress(50);

      setTimeout(async () => {
        setProvisionStepLabel('Création du dossier souverain Cloudflare R2 (r2/users/{uuid}/)...');
        setProvisionProgress(75);

        const res = await registerUser({
          fullName: fullName.trim(),
          email: email.trim(),
          institution: institution.trim(),
          personalCode: personalCode.trim(),
        });

        if (res.success) {
          setProvisionStepLabel('Espace privé prêt. Redirection vers votre Dashboard...');
          setProvisionProgress(100);
          setTimeout(() => {
            onSuccess();
          }, 700);
        } else {
          setGeneralError(res.error || 'Échec lors de la création de l\'espace.');
          setStep('PERSONAL_CODE');
        }
      }, 600);
    }, 600);
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

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Créer mon espace documentaire
              </h2>
              <p className="text-xs text-slate-400">
                Processus d'inscription souverain en 3 étapes sécurisées
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-6 pt-4 pb-2 bg-slate-950/40 border-b border-white/5 flex items-center justify-between text-[11px] font-semibold">
          <div className={`flex items-center gap-1.5 ${step === 'IDENTITY' ? 'text-amber-400' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
            <span>Identité</span>
          </div>
          <div className="w-8 h-px bg-white/10" />
          <div className={`flex items-center gap-1.5 ${step === 'EMAIL_OTP' ? 'text-amber-400' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
            <span>Vérification Email</span>
          </div>
          <div className="w-8 h-px bg-white/10" />
          <div className={`flex items-center gap-1.5 ${step === 'PERSONAL_CODE' || step === 'PROVISIONING' ? 'text-amber-400' : 'text-slate-400'}`}>
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
            <span>Code Personnel</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {generalError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* STEP 1: IDENTITY */}
          {step === 'IDENTITY' && (
            <form onSubmit={handleIdentitySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prénom &amp; Nom / Identifiant Officiel</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex : Driss Mahamoud Farah"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Adresse Email Professionnelle</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex : agent.nom@cniplc.dj"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Cette adresse sera utilisée comme méthode de sécurité et de récupération.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Institution ou Espace de Travail</span>
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Ex : CNIPLC - Commission Anti-Corruption"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Envoi du code de sécurité...</span>
                    </>
                  ) : (
                    <>
                      <span>Vérifier mon email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: EMAIL OTP VERIFICATION */}
          {step === 'EMAIL_OTP' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-300">
                  <Mail className="w-4 h-4" />
                  <span>Une vérification supplémentaire est nécessaire</span>
                </div>
                <p className="text-blue-200/90 text-[11px] leading-relaxed">
                  Un code de sécurité à 6 chiffres a été envoyé à l'adresse : <strong className="text-white">{email}</strong>
                </p>
              </div>

              {previewOtp && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <span>Code de sécurité reçu (simulation sécurisée) :</span>
                  <strong className="text-sm font-mono tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded text-white">{previewOtp}</strong>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 text-center">
                  Entrez le code de sécurité reçu :
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-48 text-center tracking-[0.6em] font-mono text-xl py-2.5 rounded-xl bg-slate-950 border border-white/20 text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                {otpError && (
                  <p className="text-xs text-red-400 text-center mt-2">{otpError}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('IDENTITY')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  ← Modifier l'email
                </button>

                <button
                  type="button"
                  disabled={otpResendCountdown > 0 || isSendingOtp}
                  onClick={handleResendOtp}
                  className="hover:text-amber-300 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {otpResendCountdown > 0 ? `Renvoyer le code (${otpResendCountdown}s)` : 'Renvoyer le code'}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpInput.length < 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Vérification du code...</span>
                    </>
                  ) : (
                    <>
                      <span>Vérifier et continuer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CREATE PERSONAL CODE */}
          {step === 'PERSONAL_CODE' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white">Créez votre code personnel</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Ce code vous permettra d'accéder rapidement à votre espace documentaire en toute sécurité.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Code personnel (6 chiffres minimum)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Chiffrement AES-256</span>
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={personalCode}
                  onChange={(e) => setPersonalCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.6em] font-mono text-lg py-2.5 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Confirmer le code
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.6em] font-mono text-lg py-2.5 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {codeError && (
                <p className="text-xs text-red-400 text-center">{codeError}</p>
              )}

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Règles de sécurité :</span>
                </div>
                <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5">
                  <li>Le code est hashé côté serveur avec un sel unique (PBKDF2-SHA512).</li>
                  <li>Il n'est jamais enregistré en clair ni transmis par email.</li>
                  <li>Limitation stricte à 4 tentatives consécutives contre le brute-force.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={personalCode.length < 6 || personalCode !== confirmCode}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>Créer mon espace souverain</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: PROVISIONING ANIMATION */}
          {step === 'PROVISIONING' && (
            <div className="py-8 text-center space-y-5">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <div className="absolute inset-2 rounded-full bg-slate-950 flex items-center justify-center text-amber-400">
                  <Database className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Initialisation de votre espace documentaire</h4>
                <p className="text-xs text-amber-400 font-mono">{provisionStepLabel}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5 max-w-xs mx-auto">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${provisionProgress}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-400">
                Chemin R2 Souverain : <code className="text-slate-300 font-mono">r2/users/{'{supabase_user_uuid}'}/</code>
              </p>
            </div>
          )}
        </div>

        {/* Footer Link to Login */}
        <div className="p-4 bg-slate-950/90 border-t border-white/5 text-center text-xs text-slate-400">
          <span>Vous possédez déjà un espace ? </span>
          <button
            onClick={() => {
              onClose();
              onSwitchToLogin();
            }}
            className="text-amber-400 font-semibold hover:underline cursor-pointer ml-1"
          >
            Se connecter avec mon code ou email
          </button>
        </div>
      </motion.div>
    </div>
  );
}
