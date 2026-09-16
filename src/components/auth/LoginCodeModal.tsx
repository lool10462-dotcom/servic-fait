import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  KeyRound, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone, 
  Laptop,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

interface LoginCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

type LoginMode = 'CODE' | 'EMAIL' | 'FORGOT_CODE_EMAIL' | 'FORGOT_CODE_OTP' | 'FORGOT_CODE_NEW' | 'NEW_DEVICE_OTP';

export default function LoginCodeModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToRegister,
}: LoginCodeModalProps) {
  const { 
    loginWithCode, 
    loginWithEmail, 
    sendOtp, 
    verifyOtp, 
    resetPersonalCode, 
    lastUsedEmail,
    isLocked, 
    lockoutRemainingSeconds,
    failedAttempts 
  } = useAuth();

  const [mode, setMode] = useState<LoginMode>('CODE');
  
  // Code Login State
  const [personalCode, setPersonalCode] = useState('');
  const [userEmail, setUserEmail] = useState(lastUsedEmail || 'agent.driss@cniplc.dj');
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email Login State
  const [emailInput, setEmailInput] = useState(lastUsedEmail || '');
  const [emailCodeInput, setEmailCodeInput] = useState('');

  // Forgot Code Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState(lastUsedEmail || '');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [newPersonalCode, setNewPersonalCode] = useState('');
  const [confirmNewCode, setConfirmNewCode] = useState('');
  const [previewRecoveryOtp, setPreviewRecoveryOtp] = useState<string | null>(null);

  // New Device Verification State
  const [newDeviceOtp, setNewDeviceOtp] = useState('');
  const [previewNewDeviceOtp, setPreviewNewDeviceOtp] = useState<string | null>(null);
  const [deviceConfirmed, setDeviceConfirmed] = useState(false);

  if (!isOpen) return null;

  // 1. Submit Personal Code (Section 5)
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (personalCode.length < 6) {
      setErrorMsg('Veuillez saisir votre code personnel complet (6 chiffres).');
      return;
    }

    setIsLoading(true);
    const res = await loginWithCode(personalCode, userEmail);
    setIsLoading(false);

    if (res.success) {
      if (res.isNewDevice) {
        // Section 8: Nouvel Appareil Détecté
        setMode('NEW_DEVICE_OTP');
        const otpRes = await sendOtp(userEmail, 'NEW_DEVICE');
        if (otpRes.previewOtp) setPreviewNewDeviceOtp(otpRes.previewOtp);
      } else {
        sessionStorage.setItem('cniplc_code_login_success', 'true');
        onSuccess();
      }
    } else {
      setErrorMsg(res.error || 'Code personnel incorrect.');
      if (typeof res.attemptsLeft === 'number') {
        setAttemptsLeft(res.attemptsLeft);
      }
    }
  };

  // 2. Submit Email Login (Section 6)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailInput.trim() || !emailCodeInput.trim()) {
      setErrorMsg('Veuillez renseigner votre email et votre mot de passe ou code.');
      return;
    }

    setIsLoading(true);
    const res = await loginWithEmail(emailInput.trim(), emailCodeInput.trim());
    setIsLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Identifiants incorrects.');
    }
  };

  // 3. Recovery: Send OTP
  const handleRecoveryEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recoveryEmail.trim()) {
      setErrorMsg('Veuillez renseigner votre adresse email.');
      return;
    }

    setIsLoading(true);
    const res = await sendOtp(recoveryEmail.trim(), 'CODE_RESET');
    setIsLoading(false);

    if (res.success) {
      if (res.previewOtp) setPreviewRecoveryOtp(res.previewOtp);
      setMode('FORGOT_CODE_OTP');
    } else {
      setErrorMsg(res.error || 'Impossible d\'envoyer le code de réinitialisation.');
    }
  };

  // 4. Recovery: Verify OTP
  const handleRecoveryOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (recoveryOtp.trim().length !== 6) {
      setErrorMsg('Le code de sécurité doit comporter 6 chiffres.');
      return;
    }

    setIsLoading(true);
    const res = await verifyOtp(recoveryEmail.trim(), recoveryOtp.trim(), 'CODE_RESET');
    setIsLoading(false);

    if (res.success) {
      setMode('FORGOT_CODE_NEW');
    } else {
      setErrorMsg(res.error || 'Code de sécurité incorrect ou expiré.');
    }
  };

  // 5. Recovery: Set New Code
  const handleSetNewCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPersonalCode.length < 6) {
      setErrorMsg('Le nouveau code doit comporter au moins 6 chiffres.');
      return;
    }
    if (newPersonalCode !== confirmNewCode) {
      setErrorMsg('Les deux codes ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    const res = await resetPersonalCode(recoveryEmail.trim(), newPersonalCode.trim());
    setIsLoading(false);

    if (res.success) {
      // Automatically log in with new code
      const logRes = await loginWithCode(newPersonalCode.trim(), recoveryEmail.trim());
      if (logRes.success) {
        onSuccess();
      } else {
        setMode('CODE');
        setPersonalCode('');
        setErrorMsg('Code réinitialisé ! Veuillez vous connecter.');
      }
    } else {
      setErrorMsg(res.error || 'Échec lors de la réinitialisation.');
    }
  };

  // 6. New Device: Verify OTP
  const handleNewDeviceVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newDeviceOtp.trim().length !== 6) {
      setErrorMsg('Le code de confirmation doit comporter 6 chiffres.');
      return;
    }

    setIsLoading(true);
    const res = await verifyOtp(userEmail, newDeviceOtp.trim(), 'NEW_DEVICE');
    setIsLoading(false);

    if (res.success) {
      setDeviceConfirmed(true);
    } else {
      setErrorMsg(res.error || 'Code de confirmation incorrect.');
    }
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
        className="relative w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Espace Documentaire CNIPLC</h2>
              <p className="text-[11px] text-slate-400">Authentification &amp; Accès Rapide</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Lockout Warning if blocked */}
          {isLocked && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2 text-red-300">
                <ShieldAlert className="w-4 h-4" />
                <span>Accès temporairement bloqué</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Plusieurs tentatives incorrectes consécutives ont été détectées. Pour protéger vos documents, l'accès est suspendu pendant encore <strong>{lockoutRemainingSeconds}s</strong>.
              </p>
              <button
                type="button"
                onClick={() => setMode('FORGOT_CODE_EMAIL')}
                className="text-[11px] text-amber-300 underline font-semibold hover:text-amber-200 cursor-pointer block"
              >
                Utilisez votre email pour vérifier votre identité →
              </button>
            </div>
          )}

          {errorMsg && !isLocked && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ──────────────── MODE: CODE PERSONNEL (Section 5) ──────────────── */}
          {mode === 'CODE' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
                  <span>Bon retour</span>
                  <span className="text-xl">👋</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Entrez votre code personnel pour accéder à votre espace.
                </p>
              </div>

              {/* Email hint */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                <span className="truncate max-w-[200px]">Compte : <strong className="text-white font-mono">{userEmail}</strong></span>
                <button
                  type="button"
                  onClick={() => setMode('EMAIL')}
                  className="text-amber-400 hover:underline cursor-pointer text-[10px]"
                >
                  Changer
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 text-center">
                  Votre code personnel :
                </label>
                <div className="flex justify-center">
                  <input
                    type="password"
                    maxLength={12}
                    autoFocus
                    disabled={isLocked}
                    value={personalCode}
                    onChange={(e) => setPersonalCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-48 text-center tracking-[0.6em] font-mono text-2xl py-2.5 rounded-2xl bg-slate-950 border border-white/20 text-amber-400 focus:outline-none focus:border-amber-500 disabled:opacity-40"
                  />
                </div>
                {attemptsLeft !== null && attemptsLeft > 0 && attemptsLeft < 4 && (
                  <p className="text-[11px] text-amber-400 text-center mt-1.5">
                    Code incorrect. Il vous reste {attemptsLeft} tentative(s).
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('FORGOT_CODE_EMAIL')}
                  className="hover:text-amber-300 transition-colors cursor-pointer text-[11px]"
                >
                  Code oublié ?
                </button>

                <button
                  type="button"
                  onClick={() => setMode('EMAIL')}
                  className="hover:text-white transition-colors cursor-pointer text-[11px]"
                >
                  Se connecter par email
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || isLocked || personalCode.length < 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Vérification sécurisée...</span>
                  </>
                ) : (
                  <>
                    <span>Accéder à mon espace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase tracking-wider">ou</span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              <button
                type="button"
                onClick={() => setMode('EMAIL')}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Continuer avec mon email</span>
              </button>
            </form>
          )}

          {/* ──────────────── MODE: EMAIL LOGIN (Section 6) ──────────────── */}
          {mode === 'EMAIL' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white">Connexion avec mon email</h3>
                <p className="text-xs text-slate-400">
                  Accédez à votre compte via vos identifiants ou votre code personnel.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="agent.nom@cniplc.dj"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Code personnel ou mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(emailInput);
                      setMode('FORGOT_CODE_EMAIL');
                    }}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Mot de passe / Code oublié ?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={emailCodeInput}
                  onChange={(e) => setEmailCodeInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('CODE')}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors cursor-pointer pt-1"
              >
                ← Revenir au code personnel rapide
              </button>
            </form>
          )}

          {/* ──────────────── MODE: FORGOT CODE (Section 10) ──────────────── */}
          {mode === 'FORGOT_CODE_EMAIL' && (
            <form onSubmit={handleRecoveryEmailSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white">Réinitialiser mon code avec mon email</h3>
                <p className="text-xs text-slate-400">
                  Un code de sécurité à usage unique sera envoyé à votre adresse pour vérifier votre identité.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Votre adresse email enregistrée
                </label>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="agent.nom@cniplc.dj"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Envoyer le code OTP de récupération</span>}
              </button>

              <button
                type="button"
                onClick={() => setMode('CODE')}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Annuler et revenir
              </button>
            </form>
          )}

          {mode === 'FORGOT_CODE_OTP' && (
            <form onSubmit={handleRecoveryOtpSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white">Vérification de sécurité</h3>
                <p className="text-xs text-slate-400">
                  Entrez le code OTP envoyé à <strong className="text-white">{recoveryEmail}</strong>
                </p>
              </div>

              {previewRecoveryOtp && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <span>Code de récupération :</span>
                  <strong className="font-mono text-sm tracking-widest text-white">{previewRecoveryOtp}</strong>
                </div>
              )}

              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={recoveryOtp}
                  onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-48 text-center tracking-[0.6em] font-mono text-xl py-2 rounded-xl bg-slate-950 border border-white/20 text-amber-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || recoveryOtp.length < 6}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Valider l\'identité'}
              </button>
            </form>
          )}

          {mode === 'FORGOT_CODE_NEW' && (
            <form onSubmit={handleSetNewCodeSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white">Nouveau code personnel</h3>
                <p className="text-xs text-slate-400">
                  Définissez un nouveau code personnel à 6 chiffres pour votre accès rapide.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nouveau code (6 chiffres)
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={newPersonalCode}
                  onChange={(e) => setNewPersonalCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.6em] font-mono text-lg py-2 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Confirmer le nouveau code
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={confirmNewCode}
                  onChange={(e) => setConfirmNewCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.6em] font-mono text-lg py-2 rounded-xl bg-slate-950 border border-white/20 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || newPersonalCode.length < 6 || newPersonalCode !== confirmNewCode}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Enregistrer le nouveau code et accéder'}
              </button>
            </form>
          )}

          {/* ──────────────── MODE: NEW DEVICE DETECTION (Section 8) ──────────────── */}
          {mode === 'NEW_DEVICE_OTP' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Laptop className="w-4 h-4" />
                  <span>Nouvel appareil détecté</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Pour protéger vos documents, confirmez votre identité en saisissant le code envoyé à votre adresse email.
                </p>
              </div>

              {previewNewDeviceOtp && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <span>Code de sécurité nouvel appareil :</span>
                  <strong className="font-mono text-sm tracking-widest text-white">{previewNewDeviceOtp}</strong>
                </div>
              )}

              {!deviceConfirmed ? (
                <form onSubmit={handleNewDeviceVerify} className="space-y-4">
                  <div className="flex justify-center">
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      value={newDeviceOtp}
                      onChange={(e) => setNewDeviceOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-48 text-center tracking-[0.6em] font-mono text-xl py-2 rounded-xl bg-slate-950 border border-white/20 text-amber-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || newDeviceOtp.length < 6}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Autoriser cet appareil'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Appareil reconnu</h4>
                  <p className="text-xs text-slate-400">Cet appareil a été enregistré dans votre liste d'appareils autorisés.</p>
                  <button
                    onClick={onSuccess}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
                  >
                    Continuer vers mon espace →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Link to Register */}
        <div className="p-4 bg-slate-950/90 border-t border-white/5 text-center text-xs text-slate-400">
          <span>Première visite ? </span>
          <button
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="text-amber-400 font-semibold hover:underline cursor-pointer ml-1"
          >
            Créer mon espace documentaire
          </button>
        </div>
      </motion.div>
    </div>
  );
}
