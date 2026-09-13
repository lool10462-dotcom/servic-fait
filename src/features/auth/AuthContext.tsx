import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserAccount, 
  UserDevice, 
  AuthSecurityEvent, 
  AuthSession 
} from '../../types/auth';

interface AuthContextType {
  user: UserAccount | null;
  currentDevice: UserDevice | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  devices: UserDevice[];
  securityLogs: AuthSecurityEvent[];
  failedAttempts: number;
  isLocked: boolean;
  lockoutRemainingSeconds: number;
  lastUsedEmail: string;
  loginWithCode: (code: string, email?: string) => Promise<{ success: boolean; error?: string; attemptsLeft?: number; isLocked?: boolean; isNewDevice?: boolean }>;
  loginWithEmail: (email: string, codeOrOtp: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: { fullName: string; email: string; institution: string; personalCode: string }) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (email: string, reason?: string) => Promise<{ success: boolean; previewOtp?: string; error?: string }>;
  verifyOtp: (email: string, otp: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  resetPersonalCode: (email: string, newCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  revokeDevice: (deviceId: string) => Promise<boolean>;
  revokeAllOtherDevices: () => Promise<boolean>;
  refreshDevices: () => Promise<void>;
  refreshSecurityLogs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'cniplc_doc_auth_session';
const LAST_EMAIL_KEY = 'cniplc_doc_last_email';
const DEVICE_TOKEN_KEY = 'cniplc_doc_device_token';

function getClientDeviceInfo(): { name: string; browser: string; os: string } {
  if (typeof window === 'undefined') {
    return { name: 'Poste Web', browser: 'Chrome', os: 'Windows' };
  }
  const ua = navigator.userAgent;
  let browser = 'Navigateur Web';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Google Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';

  let os = 'Poste Fixe';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 11 / 10';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return {
    name: `${os} — ${browser}`,
    browser,
    os,
  };
}

function getOrGenerateDeviceToken(): string {
  if (typeof window === 'undefined') return 'token-server';
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = `tok-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [currentDevice, setCurrentDevice] = useState<UserDevice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [securityLogs, setSecurityLogs] = useState<AuthSecurityEvent[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);
  const [lastUsedEmail, setLastUsedEmail] = useState<string>('');

  // Lockout countdown timer
  useEffect(() => {
    let interval: any;
    if (lockoutRemainingSeconds > 0) {
      interval = setInterval(() => {
        setLockoutRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutRemainingSeconds]);

  // Load stored session on startup
  useEffect(() => {
    try {
      const storedEmail = localStorage.getItem(LAST_EMAIL_KEY) || 'agent.driss@cniplc.dj';
      setLastUsedEmail(storedEmail);

      const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedSession) {
        const parsed: AuthSession = JSON.parse(savedSession);
        setUser(parsed.user);
        setCurrentDevice(parsed.currentDevice);
      }
    } catch (e) {
      console.warn('Could not restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch devices when user changes
  useEffect(() => {
    if (user?.id) {
      refreshDevices();
      refreshSecurityLogs();
    }
  }, [user?.id]);

  const refreshDevices = async () => {
    if (!user?.id) return;
    try {
      const resp = await fetch(`/api/auth/devices?userId=${encodeURIComponent(user.id)}`);
      if (resp.ok) {
        const data = await resp.json();
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  };

  const refreshSecurityLogs = async () => {
    if (!user?.id) return;
    try {
      const resp = await fetch(`/api/auth/security-logs?userId=${encodeURIComponent(user.id)}`);
      if (resp.ok) {
        const data = await resp.json();
        setSecurityLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching security logs:', err);
    }
  };

  const loginWithCode = async (code: string, email?: string) => {
    if (isLocked) {
      return { 
        success: false, 
        error: `Accès temporairement verrouillé. Veuillez attendre ${lockoutRemainingSeconds} seconde(s) ou utiliser votre email.`,
        isLocked: true 
      };
    }

    try {
      const targetEmail = email || lastUsedEmail || 'agent.driss@cniplc.dj';
      const deviceToken = getOrGenerateDeviceToken();
      const deviceInfo = getClientDeviceInfo();

      const resp = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalCode: code,
          email: targetEmail,
          deviceToken,
          deviceInfo,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (resp.status === 429 || data.isLocked) {
          setIsLocked(true);
          const secs = (data.minutesLeft ? data.minutesLeft * 60 : 300);
          setLockoutRemainingSeconds(secs);
          return { success: false, error: data.error, isLocked: true, attemptsLeft: 0 };
        }
        setFailedAttempts((prev) => prev + 1);
        return { 
          success: false, 
          error: data.error || 'Code personnel incorrect.', 
          attemptsLeft: data.attemptsLeft 
        };
      }

      // Success
      setFailedAttempts(0);
      setIsLocked(false);
      setUser(data.user);
      setCurrentDevice(data.currentDevice);
      setLastUsedEmail(data.user.email);
      localStorage.setItem(LAST_EMAIL_KEY, data.user.email);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        token: data.token,
        user: data.user,
        currentDevice: data.currentDevice,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      }));

      await refreshDevices();
      await refreshSecurityLogs();

      return { success: true, isNewDevice: data.isNewDevice };
    } catch (err: any) {
      return { success: false, error: 'Erreur réseau lors de la vérification du code.' };
    }
  };

  const loginWithEmail = async (email: string, codeOrOtp: string) => {
    return loginWithCode(codeOrOtp, email);
  };

  const registerUser = async (formData: { fullName: string; email: string; institution: string; personalCode: string }) => {
    try {
      const deviceInfo = getClientDeviceInfo();
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deviceInfo,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        return { success: false, error: data.error || 'Erreur lors de la création du compte.' };
      }

      setUser(data.user);
      setCurrentDevice(data.currentDevice);
      setLastUsedEmail(data.user.email);
      localStorage.setItem(LAST_EMAIL_KEY, data.user.email);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        token: data.token,
        user: data.user,
        currentDevice: data.currentDevice,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      }));

      await refreshDevices();
      await refreshSecurityLogs();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Erreur réseau lors de l\'enregistrement.' };
    }
  };

  const sendOtp = async (email: string, reason: string = 'EMAIL_VERIFICATION') => {
    try {
      const resp = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Erreur lors de l\'envoi de l\'OTP.' };
      }
      return { success: true, previewOtp: data.previewOtp };
    } catch (err: any) {
      return { success: false, error: 'Erreur réseau lors de l\'envoi de l\'OTP.' };
    }
  };

  const verifyOtp = async (email: string, otp: string, reason: string = 'VERIFICATION') => {
    try {
      const resp = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, reason }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Code OTP invalide.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Erreur réseau lors de la validation OTP.' };
    }
  };

  const resetPersonalCode = async (email: string, newCode: string) => {
    try {
      const resp = await fetch('/api/auth/reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newCode }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Erreur lors de la réinitialisation du code.' };
      }
      // Clear lockout
      setIsLocked(false);
      setLockoutRemainingSeconds(0);
      setFailedAttempts(0);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Erreur réseau lors de la réinitialisation du code.' };
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentDevice(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const revokeDevice = async (deviceId: string): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const resp = await fetch('/api/auth/revoke-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, deviceId }),
      });
      if (resp.ok) {
        await refreshDevices();
        return true;
      }
    } catch (err) {
      console.error('Error revoking device:', err);
    }
    return false;
  };

  const revokeAllOtherDevices = async (): Promise<boolean> => {
    if (!user?.id || !currentDevice?.id) return false;
    try {
      const resp = await fetch('/api/auth/revoke-all-other-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentDeviceId: currentDevice.id }),
      });
      if (resp.ok) {
        await refreshDevices();
        return true;
      }
    } catch (err) {
      console.error('Error revoking other devices:', err);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentDevice,
        isAuthenticated: !!user,
        isLoading,
        devices,
        securityLogs,
        failedAttempts,
        isLocked,
        lockoutRemainingSeconds,
        lastUsedEmail,
        loginWithCode,
        loginWithEmail,
        registerUser,
        sendOtp,
        verifyOtp,
        resetPersonalCode,
        logout,
        revokeDevice,
        revokeAllOtherDevices,
        refreshDevices,
        refreshSecurityLogs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
