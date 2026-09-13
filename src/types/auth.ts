export interface UserAccount {
  id: string; // Supabase user UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)
  email: string;
  fullName: string;
  institution: string;
  role: 'AGENT_CERTIFIE' | 'ADMINISTRATEUR' | 'ENQUETEUR' | 'UTILISATEUR';
  avatarInitials: string;
  personalCodeSalt?: string;
  personalCodeHash?: string;
  createdAt: string;
  lastLogin: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  storageQuotaBytes: number;
  storageUsedBytes: number;
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  location?: string;
  lastActive: string;
  isCurrent: boolean;
  tokenHash?: string;
  addedAt: string;
}

export type AuthSecurityAction =
  | 'account_created'
  | 'email_verified'
  | 'login_success'
  | 'login_failed'
  | 'personal_code_created'
  | 'personal_code_changed'
  | 'personal_code_reset'
  | 'new_device'
  | 'device_removed'
  | 'logout'
  | 'logout_all'
  | 'password_reset'
  | 'mfa_enabled'
  | 'mfa_disabled';

export interface AuthSecurityEvent {
  id: string;
  userId: string;
  userEmail: string;
  action: AuthSecurityAction;
  timestamp: string;
  details: string;
  ipAddress: string;
  deviceInfo: string;
  success: boolean;
}

export interface AuthSession {
  token: string;
  user: UserAccount;
  currentDevice: UserDevice;
  expiresAt: string;
}

export interface LoginAttemptState {
  failedAttempts: number;
  lockedUntil: number | null; // timestamp in ms
  lastAttemptTime: number;
}
