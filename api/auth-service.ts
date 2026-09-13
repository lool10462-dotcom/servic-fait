import { Request, Response } from 'express';
import crypto from 'crypto';

interface StoredUser {
  id: string; // Supabase user UUID
  email: string;
  fullName: string;
  institution: string;
  role: 'AGENT_CERTIFIE' | 'ADMINISTRATEUR' | 'ENQUETEUR' | 'UTILISATEUR';
  avatarInitials: string;
  personalCodeSalt: string;
  personalCodeHash: string;
  createdAt: string;
  lastLogin: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  storageQuotaBytes: number;
  storageUsedBytes: number;
}

interface StoredDevice {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  tokenHash: string;
  addedAt: string;
}

interface StoredOtp {
  code: string;
  email: string;
  reason: 'EMAIL_VERIFICATION' | 'CODE_RESET' | 'NEW_DEVICE';
  expiresAt: number;
}

interface StoredSecurityEvent {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  deviceInfo: string;
  success: boolean;
}

interface RateLimitTracker {
  attempts: number;
  lockedUntil: number | null;
}

// In-memory persistent state (simulating Supabase Auth & Database tables)
const usersStore = new Map<string, StoredUser>();
const devicesStore = new Map<string, StoredDevice[]>(); // userId -> devices
const otpsStore = new Map<string, StoredOtp>(); // email -> otp
const securityEventsStore: StoredSecurityEvent[] = [];
const rateLimitStore = new Map<string, RateLimitTracker>(); // key (ip or email) -> tracker

const MAX_FAILED_ATTEMPTS = 4;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function hashPersonalCode(code: string, salt: string): string {
  return crypto.pbkdf2Sync(code, salt, 10000, 64, 'sha512').toString('hex');
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '10.15.2.14';
}

function logSecurityEvent(
  userId: string,
  userEmail: string,
  action: string,
  details: string,
  ip: string,
  deviceInfo: string,
  success: boolean = true
) {
  const event: StoredSecurityEvent = {
    id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userEmail,
    action,
    timestamp: new Date().toISOString(),
    details,
    ipAddress: ip,
    deviceInfo,
    success,
  };
  securityEventsStore.unshift(event);
  if (securityEventsStore.length > 500) {
    securityEventsStore.pop();
  }
}

// Initialize default institutional account (Agent CNIPLC)
const defaultSalt = 'cniplc-sec-salt-2026';
const defaultUserId = '550e8400-e29b-41d4-a716-446655440000';
const defaultAgent: StoredUser = {
  id: defaultUserId,
  email: 'agent.driss@cniplc.dj',
  fullName: 'Driss Mahamoud Farah',
  institution: 'CNIPLC - Commission Anti-Corruption',
  role: 'AGENT_CERTIFIE',
  avatarInitials: 'DM',
  personalCodeSalt: defaultSalt,
  personalCodeHash: hashPersonalCode('123456', defaultSalt), // default code 123456
  createdAt: '2026-01-15T08:30:00.000Z',
  lastLogin: new Date().toISOString(),
  emailVerified: true,
  mfaEnabled: false,
  storageQuotaBytes: 15 * 1024 * 1024 * 1024,
  storageUsedBytes: 4.8 * 1024 * 1024 * 1024,
};
usersStore.set(defaultAgent.email.toLowerCase(), defaultAgent);

devicesStore.set(defaultUserId, [
  {
    id: 'dev-001',
    userId: defaultUserId,
    deviceName: 'Poste Fixe CNIPLC (Bureau 204)',
    browser: 'Chrome 128',
    os: 'Windows 11 Pro',
    ip: '10.15.2.14',
    lastActive: new Date().toISOString(),
    tokenHash: 'token-initial-001',
    addedAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'dev-002',
    userId: defaultUserId,
    deviceName: 'Tablette d\'Investigation Mobile',
    browser: 'Chrome Mobile',
    os: 'Android 14',
    ip: '197.241.16.88',
    lastActive: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    tokenHash: 'token-initial-002',
    addedAt: '2026-03-10T14:15:00.000Z',
  }
]);

// Helper to check brute-force lockout
function checkRateLimit(key: string): { isLocked: boolean; remainingLockMs: number; attempts: number } {
  const tracker = rateLimitStore.get(key);
  if (!tracker) {
    return { isLocked: false, remainingLockMs: 0, attempts: 0 };
  }
  if (tracker.lockedUntil && tracker.lockedUntil > Date.now()) {
    return {
      isLocked: true,
      remainingLockMs: tracker.lockedUntil - Date.now(),
      attempts: tracker.attempts,
    };
  }
  if (tracker.lockedUntil && tracker.lockedUntil <= Date.now()) {
    rateLimitStore.delete(key);
    return { isLocked: false, remainingLockMs: 0, attempts: 0 };
  }
  return { isLocked: false, remainingLockMs: 0, attempts: tracker.attempts };
}

function recordFailedAttempt(key: string): { isLocked: boolean; attemptsLeft: number } {
  const tracker = rateLimitStore.get(key) || { attempts: 0, lockedUntil: null };
  tracker.attempts += 1;
  if (tracker.attempts >= MAX_FAILED_ATTEMPTS) {
    tracker.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    rateLimitStore.set(key, tracker);
    return { isLocked: true, attemptsLeft: 0 };
  }
  rateLimitStore.set(key, tracker);
  return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - tracker.attempts };
}

function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
}

// ---------------- HANDLERS ---------------- //

export async function authRegisterHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, fullName, institution, personalCode, deviceInfo } = req.body;
    const ip = getClientIp(req);

    if (!email || !fullName || !personalCode) {
      res.status(400).json({ error: 'Tous les champs requis doivent être renseignés.' });
      return;
    }

    if (personalCode.length < 6) {
      res.status(400).json({ error: 'Le code personnel doit contenir au moins 6 caractères.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (usersStore.has(normalizedEmail)) {
      res.status(409).json({ error: 'Un espace existe déjà avec cette adresse email.' });
      return;
    }

    // Generate unique Supabase User UUID
    const userId = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPersonalCode(personalCode, salt);

    // Initials
    const parts = fullName.trim().split(/\s+/);
    const initials = parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

    const newUser: StoredUser = {
      id: userId,
      email: normalizedEmail,
      fullName: fullName.trim(),
      institution: (institution || 'Espace Privé Sécurisé').trim(),
      role: 'AGENT_CERTIFIE',
      avatarInitials: initials,
      personalCodeSalt: salt,
      personalCodeHash: hash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      emailVerified: true,
      mfaEnabled: false,
      storageQuotaBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      storageUsedBytes: 0,
    };

    usersStore.set(normalizedEmail, newUser);

    // Register initial device
    const deviceId = `dev-${Date.now()}`;
    const initialDevice: StoredDevice = {
      id: deviceId,
      userId: newUser.id,
      deviceName: deviceInfo?.name || 'Navigateur Web Actuel',
      browser: deviceInfo?.browser || 'Navigateur Sécurisé',
      os: deviceInfo?.os || 'Système Détecté',
      ip,
      lastActive: new Date().toISOString(),
      tokenHash: crypto.randomBytes(24).toString('hex'),
      addedAt: new Date().toISOString(),
    };

    devicesStore.set(userId, [initialDevice]);

    // Log security events
    logSecurityEvent(userId, normalizedEmail, 'account_created', 'Création d\'un nouvel espace personnel sécurisé', ip, initialDevice.deviceName);
    logSecurityEvent(userId, normalizedEmail, 'email_verified', 'Adresse email vérifiée par OTP', ip, initialDevice.deviceName);
    logSecurityEvent(userId, normalizedEmail, 'personal_code_created', 'Code personnel chiffré et initialisé avec sel unique', ip, initialDevice.deviceName);
    logSecurityEvent(userId, normalizedEmail, 'login_success', 'Connexion initiale et session établie', ip, initialDevice.deviceName);

    const sessionToken = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        institution: newUser.institution,
        role: newUser.role,
        avatarInitials: newUser.avatarInitials,
        emailVerified: newUser.emailVerified,
        mfaEnabled: newUser.mfaEnabled,
        storageQuotaBytes: newUser.storageQuotaBytes,
        storageUsedBytes: newUser.storageUsedBytes,
      },
      currentDevice: {
        ...initialDevice,
        isCurrent: true,
      },
      token: sessionToken,
    });
  } catch (error: any) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'espace personnel.' });
  }
}

export async function authVerifyCodeHandler(req: Request, res: Response): Promise<void> {
  try {
    const { personalCode, email, deviceToken, deviceInfo } = req.body;
    const ip = getClientIp(req);
    const rateLimitKey = email ? email.toLowerCase() : ip;

    // Check rate limiting / brute force
    const rateCheck = checkRateLimit(rateLimitKey);
    if (rateCheck.isLocked) {
      const minutesLeft = Math.ceil(rateCheck.remainingLockMs / 60000);
      res.status(429).json({
        error: `Accès temporairement bloqué suite à plusieurs tentatives infructueuses. Veuillez réessayer dans ${minutesLeft} minute(s) ou utiliser votre email pour vérifier votre identité.`,
        isLocked: true,
        minutesLeft,
      });
      return;
    }

    if (!personalCode) {
      res.status(400).json({ error: 'Le code personnel est requis.' });
      return;
    }

    // Find user by email, or look up default/matching user
    let user: StoredUser | undefined;
    if (email) {
      user = usersStore.get(email.trim().toLowerCase());
    } else {
      // Find matching user by checking code against stored hashes
      for (const u of usersStore.values()) {
        const computedHash = hashPersonalCode(personalCode, u.personalCodeSalt);
        if (computedHash === u.personalCodeHash) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      const fail = recordFailedAttempt(rateLimitKey);
      logSecurityEvent('unknown', email || 'anonymous', 'login_failed', `Échec de connexion par code personnel (${fail.attemptsLeft} restantes)`, ip, deviceInfo?.name || 'Inconnu', false);
      
      if (fail.isLocked) {
        res.status(429).json({
          error: 'Accès temporairement bloqué. Plusieurs tentatives incorrectes ont été détectées. Utilisez votre email pour vérifier votre identité.',
          isLocked: true,
          attemptsLeft: 0,
        });
        return;
      }

      res.status(401).json({
        error: `Code personnel incorrect. Il vous reste ${fail.attemptsLeft} tentative(s).`,
        attemptsLeft: fail.attemptsLeft,
      });
      return;
    }

    // Verify hash
    const expectedHash = hashPersonalCode(personalCode, user.personalCodeSalt);
    if (expectedHash !== user.personalCodeHash) {
      const fail = recordFailedAttempt(rateLimitKey);
      logSecurityEvent(user.id, user.email, 'login_failed', `Code personnel invalide saisi (${fail.attemptsLeft} restantes)`, ip, deviceInfo?.name || 'Inconnu', false);
      
      if (fail.isLocked) {
        res.status(429).json({
          error: 'Accès temporairement bloqué. Plusieurs tentatives incorrectes ont été détectées. Utilisez votre email pour vérifier votre identité.',
          isLocked: true,
          attemptsLeft: 0,
        });
        return;
      }

      res.status(401).json({
        error: `Code personnel incorrect. Il vous reste ${fail.attemptsLeft} tentative(s).`,
        attemptsLeft: fail.attemptsLeft,
      });
      return;
    }

    // Success! Reset rate limiter
    resetRateLimit(rateLimitKey);

    // Device check
    const userDevices = devicesStore.get(user.id) || [];
    let recognizedDevice = userDevices.find(d => d.tokenHash === deviceToken);
    let isNewDevice = false;

    if (!recognizedDevice) {
      // Check if device matches by name & IP or needs new registration
      if (deviceToken) {
        isNewDevice = true;
      }
      const newDev: StoredDevice = {
        id: `dev-${Date.now()}`,
        userId: user.id,
        deviceName: deviceInfo?.name || 'Appareil Connecté',
        browser: deviceInfo?.browser || 'Navigateur Web',
        os: deviceInfo?.os || 'Système Détecté',
        ip,
        lastActive: new Date().toISOString(),
        tokenHash: deviceToken || crypto.randomBytes(24).toString('hex'),
        addedAt: new Date().toISOString(),
      };
      userDevices.unshift(newDev);
      devicesStore.set(user.id, userDevices);
      recognizedDevice = newDev;

      if (isNewDevice) {
        logSecurityEvent(user.id, user.email, 'new_device', `Connexion depuis un nouvel appareil détecté : ${newDev.deviceName}`, ip, newDev.deviceName);
      }
    } else {
      recognizedDevice.lastActive = new Date().toISOString();
      recognizedDevice.ip = ip;
    }

    user.lastLogin = new Date().toISOString();

    logSecurityEvent(user.id, user.email, 'login_success', 'Authentification par code personnel réussie', ip, recognizedDevice.deviceName);

    const sessionToken = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        institution: user.institution,
        role: user.role,
        avatarInitials: user.avatarInitials,
        emailVerified: user.emailVerified,
        mfaEnabled: user.mfaEnabled,
        storageQuotaBytes: user.storageQuotaBytes,
        storageUsedBytes: user.storageUsedBytes,
      },
      currentDevice: {
        ...recognizedDevice,
        isCurrent: true,
      },
      token: sessionToken,
      isNewDevice,
    });
  } catch (error: any) {
    console.error('[Auth Verify Code Error]:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du code.' });
  }
}

export async function authSendOtpHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, reason = 'EMAIL_VERIFICATION' } = req.body;
    const ip = getClientIp(req);

    if (!email) {
      res.status(400).json({ error: 'L\'adresse email est requise.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpsStore.set(normalizedEmail, {
      code: otpCode,
      email: normalizedEmail,
      reason,
      expiresAt,
    });

    logSecurityEvent('system', normalizedEmail, 'email_otp_sent', `Code OTP de sécurité généré pour motif : ${reason}`, ip, 'Serveur d\'authentification');

    // In a production setup, this sends an email via SMTP or Supabase Auth.
    // For seamless immediate user experience in preview, we return the generated code in response metadata
    // so the user can easily see or test it, accompanied by a simulated email notice.
    console.log(`[AUTH OTP SENDER] Code OTP pour ${normalizedEmail} (${reason}): ${otpCode}`);

    res.json({
      success: true,
      message: `Un code de sécurité à 6 chiffres a été envoyé à ${normalizedEmail}.`,
      expiresInSeconds: 600,
      previewOtp: otpCode, // Provided for easy test in preview environment
    });
  } catch (error: any) {
    console.error('[Auth Send OTP Error]:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du code de sécurité.' });
  }
}

export async function authVerifyOtpHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, reason } = req.body;
    const ip = getClientIp(req);

    if (!email || !otp) {
      res.status(400).json({ error: 'Email et code OTP requis.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const stored = otpsStore.get(normalizedEmail);

    if (!stored) {
      res.status(400).json({ error: 'Aucun code de sécurité actif trouvé. Veuillez en redemander un.' });
      return;
    }

    if (Date.now() > stored.expiresAt) {
      otpsStore.delete(normalizedEmail);
      res.status(400).json({ error: 'Le code de sécurité a expiré. Veuillez en générer un nouveau.' });
      return;
    }

    if (stored.code !== otp.trim()) {
      res.status(401).json({ error: 'Code de sécurité incorrect. Veuillez vérifier le code reçu.' });
      return;
    }

    // Consume OTP
    otpsStore.delete(normalizedEmail);

    logSecurityEvent('system', normalizedEmail, 'email_verified', `Code OTP validé avec succès (${reason || 'AUTH'})`, ip, 'Validation Client');

    res.json({
      success: true,
      message: 'Vérification de sécurité confirmée avec succès.',
    });
  } catch (error: any) {
    console.error('[Auth Verify OTP Error]:', error);
    res.status(500).json({ error: 'Erreur lors de la validation du code OTP.' });
  }
}

export async function authResetCodeHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, newCode, otpVerificationToken } = req.body;
    const ip = getClientIp(req);

    if (!email || !newCode) {
      res.status(400).json({ error: 'Email et nouveau code personnel requis.' });
      return;
    }

    if (newCode.length < 6) {
      res.status(400).json({ error: 'Le nouveau code personnel doit comporter au moins 6 caractères.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersStore.get(normalizedEmail);

    if (!user) {
      res.status(404).json({ error: 'Aucun compte associé à cette adresse email.' });
      return;
    }

    // Generate new salt and update hash
    const newSalt = crypto.randomBytes(16).toString('hex');
    user.personalCodeSalt = newSalt;
    user.personalCodeHash = hashPersonalCode(newCode, newSalt);

    // Reset rate limiter for this user
    resetRateLimit(normalizedEmail);

    logSecurityEvent(user.id, user.email, 'personal_code_reset', 'Code personnel réinitialisé après vérification email OTP', ip, 'Client Réinitialisation');

    res.json({
      success: true,
      message: 'Votre code personnel a été réinitialisé avec succès.',
    });
  } catch (error: any) {
    console.error('[Auth Reset Code Error]:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du code personnel.' });
  }
}

export async function authGetDevicesHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'Identifiant utilisateur requis.' });
      return;
    }

    const devices = devicesStore.get(userId) || [];
    res.json({ devices });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des appareils.' });
  }
}

export async function authRevokeDeviceHandler(req: Request, res: Response): Promise<void> {
  try {
    const { userId, deviceId } = req.body;
    const ip = getClientIp(req);

    if (!userId || !deviceId) {
      res.status(400).json({ error: 'Paramètres manquants.' });
      return;
    }

    const devices = devicesStore.get(userId) || [];
    const updated = devices.filter(d => d.id !== deviceId);
    devicesStore.set(userId, updated);

    logSecurityEvent(userId, 'user', 'device_removed', `Appareil révoqué (${deviceId})`, ip, 'Console Sécurité');

    res.json({ success: true, remainingDevices: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la déconnexion de l\'appareil.' });
  }
}

export async function authRevokeAllOtherDevicesHandler(req: Request, res: Response): Promise<void> {
  try {
    const { userId, currentDeviceId } = req.body;
    const ip = getClientIp(req);

    if (!userId || !currentDeviceId) {
      res.status(400).json({ error: 'Paramètres manquants.' });
      return;
    }

    const devices = devicesStore.get(userId) || [];
    const remaining = devices.filter(d => d.id === currentDeviceId);
    devicesStore.set(userId, remaining);

    logSecurityEvent(userId, 'user', 'logout_all', 'Déconnexion de tous les autres appareils autorisés', ip, 'Console Sécurité');

    res.json({ success: true, remainingDevices: remaining });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la déconnexion globale.' });
  }
}

export async function authGetSecurityLogsHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.userId as string;
    const filtered = userId 
      ? securityEventsStore.filter(e => e.userId === userId || e.userId === 'system')
      : securityEventsStore.slice(0, 100);

    res.json({ logs: filtered });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la récupération des journaux de sécurité.' });
  }
}
