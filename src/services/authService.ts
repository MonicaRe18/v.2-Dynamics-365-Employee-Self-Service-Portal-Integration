/**
 * Microsoft Dynamics 365 Human Resources & Self-Service Portal
 * Enterprise Authentication Service (authService)
 *
 * Architecture:
 * - 100% Server-Authoritative: Authentication & RBAC roles come strictly from ASP.NET Core backend (/api/auth)
 * - Real JWT tokens issued and signed by ASP.NET Core (no synthetic/frontend-generated tokens)
 * - Zero hardcoded demo users or default identities
 * - Dynamic role authorization based on backend-issued claims
 */

export type D365SecurityRole =
  | 'ESS_USER'       // Employee Self-Service User (الموظف)
  | 'MSS_MGR'        // Manager Self-Service Manager (المدير المباشر)
  | 'HR_ADMIN'       // HR Administrator
  | 'SYSTEM_ADMIN'   // System Administrator
  | 'Employee'       // Legacy alias for ESS_USER
  | 'Manager'        // Legacy alias for MSS_MGR
  | 'Admin';         // Legacy alias for SYSTEM_ADMIN

export interface RegisteredUser {
  id: string; // WorkerPersonnelNumber
  civilId: string; // National ID
  name: string;
  jobTitle: string;
  department: string;
  division?: string;
  email: string;
  phone?: string;
  legalEntity?: string;
  role: D365SecurityRole;
  roles: D365SecurityRole[]; // RBAC Multi-Role support (from ASP.NET Core)
  avatarUrl?: string;
  isActive: boolean;
}

export interface AuthSession {
  token: string;
  civilId: string;
  userId: string;
  userName: string;
  role: D365SecurityRole;
  roles: D365SecurityRole[];
  issuedAt: number;
  expiresAt: number;
}

export interface AuthResponse {
  success: boolean;
  errorMessage?: string;
  user?: RegisteredUser;
  session?: AuthSession;
}

export type AuthEventReason = 'LOGIN' | 'LOGOUT' | 'EXPIRED' | 'SESSION_INVALID' | 'TAMPER_DETECTED';

const SECURE_TOKEN_STORAGE_KEY = 'd365_auth_token';
const SECURE_USER_STORAGE_KEY = 'd365_auth_user';
const REMEMBERED_CARD_KEY = 'd365_remembered_card';

function parseJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const jsonStr = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export class AuthenticationService {
  private currentUser: RegisteredUser | null = null;
  private currentSession: AuthSession | null = null;
  private listeners: Set<(user: RegisteredUser | null, reason?: AuthEventReason) => void> = new Set();
  private expirationTimer: number | null = null;

  constructor() {
    this.cleanLegacyFlags();
    this.restoreSessionFromStorage();
    this.startExpirationMonitor();
  }

  private cleanLegacyFlags(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('d365_is_authenticated');
      }
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('d365_is_authenticated');
        sessionStorage.removeItem('__d365_sec_rk__');
      }
    } catch {
      // Ignore storage errors
    }
  }

  private startExpirationMonitor(): void {
    if (typeof window === 'undefined') return;
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }
    this.expirationTimer = window.setInterval(() => {
      this.checkSessionExpiration();
    }, 15000);
  }

  public checkSessionExpiration(): boolean {
    if (!this.currentSession) return false;

    const now = Date.now();
    if (now >= this.currentSession.expiresAt) {
      this.logout('EXPIRED');
      return true;
    }
    return false;
  }

  private restoreSessionFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const token =
        sessionStorage.getItem(SECURE_TOKEN_STORAGE_KEY) ||
        localStorage.getItem(SECURE_TOKEN_STORAGE_KEY);
      const userJson =
        sessionStorage.getItem(SECURE_USER_STORAGE_KEY) ||
        localStorage.getItem(SECURE_USER_STORAGE_KEY);

      if (!token || !userJson) {
        this.clearSessionData();
        return;
      }

      const claims = parseJwtClaims(token);
      if (!claims) {
        this.clearSessionData();
        return;
      }

      // Check JWT exp (seconds)
      const expMs = typeof claims.exp === 'number' ? claims.exp * 1000 : 0;
      if (expMs && Date.now() >= expMs) {
        this.clearSessionData();
        return;
      }

      const user: RegisteredUser = JSON.parse(userJson);
      const session: AuthSession = {
        token,
        civilId: user.civilId,
        userId: user.id,
        userName: user.name,
        role: user.role,
        roles: user.roles,
        issuedAt: typeof claims.iat === 'number' ? claims.iat * 1000 : Date.now(),
        expiresAt: expMs || Date.now() + 2 * 60 * 60 * 1000,
      };

      this.currentUser = user;
      this.currentSession = session;
    } catch {
      this.clearSessionData();
    }
  }

  public async loginAsync(
    username: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<AuthResponse> {
    this.cleanLegacyFlags();

    const cleanUsername = (username || '').trim().replace(/\s/g, '');
    if (!cleanUsername || !password) {
      return { success: false, errorMessage: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.token || !data.user) {
        return {
          success: false,
          errorMessage: data.errorMessage || 'الرقم القومي أو اسم المستخدم أو كلمة المرور غير صحيحة.',
        };
      }

      const backendUser = data.user;
      const userRoles = Array.isArray(backendUser.roles) && backendUser.roles.length > 0
        ? backendUser.roles
        : [backendUser.role || 'ESS_USER'];

      const user: RegisteredUser = {
        id: backendUser.id,
        civilId: backendUser.civilId,
        name: backendUser.name,
        jobTitle: backendUser.jobTitle,
        department: backendUser.department,
        division: backendUser.division,
        email: backendUser.email,
        phone: backendUser.phone,
        legalEntity: backendUser.legalEntity,
        role: backendUser.role as D365SecurityRole,
        roles: userRoles as D365SecurityRole[],
        avatarUrl: backendUser.avatarUrl,
        isActive: backendUser.isActive ?? true,
      };

      const claims = parseJwtClaims(data.token);
      const expMs = data.expiresAt || (claims && typeof claims.exp === 'number' ? claims.exp * 1000 : Date.now() + 2 * 60 * 60 * 1000);

      const session: AuthSession = {
        token: data.token,
        civilId: user.civilId,
        userId: user.id,
        userName: user.name,
        role: user.role,
        roles: user.roles,
        issuedAt: Date.now(),
        expiresAt: expMs,
      };

      this.currentUser = user;
      this.currentSession = session;

      try {
        sessionStorage.setItem(SECURE_TOKEN_STORAGE_KEY, data.token);
        sessionStorage.setItem(SECURE_USER_STORAGE_KEY, JSON.stringify(user));

        if (rememberMe) {
          localStorage.setItem(SECURE_TOKEN_STORAGE_KEY, data.token);
          localStorage.setItem(SECURE_USER_STORAGE_KEY, JSON.stringify(user));
          localStorage.setItem(REMEMBERED_CARD_KEY, user.civilId);
        } else {
          localStorage.removeItem(SECURE_TOKEN_STORAGE_KEY);
          localStorage.removeItem(SECURE_USER_STORAGE_KEY);
          localStorage.removeItem(REMEMBERED_CARD_KEY);
        }
      } catch {
        // Storage access error fallback
      }

      this.notify('LOGIN');
      return { success: true, user, session };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر الاتصال بخادم تسجيل الدخول';
      return { success: false, errorMessage: msg };
    }
  }

  public login(
    username: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<AuthResponse> {
    return this.loginAsync(username, password, rememberMe);
  }

  public async changePasswordAsync(currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; errorMessage?: string }> {
    if (!this.currentSession?.token) return { success: false, errorMessage: 'يرجى تسجيل الدخول مجدداً.' };
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.currentSession.token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (response.status === 401) {
        this.invalidateSession();
        return { success: false, errorMessage: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً.' };
      }
      const result = await response.json();
      return response.ok && result.success
        ? { success: true }
        : { success: false, errorMessage: result.error?.message || 'تعذر تغيير كلمة المرور.' };
    } catch {
      return { success: false, errorMessage: 'تعذر الاتصال بالخادم. حاول مجدداً.' };
    }
  }

  public logout(reason: AuthEventReason = 'LOGOUT'): void {
    if (this.currentSession?.token) {
      try {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.currentSession.token}`,
          },
        }).catch(() => {});
      } catch {
        // Ignore network failure during logout
      }
    }

    this.clearSessionData();
    this.notify(reason);
  }

  public invalidateSession(): void {
    this.clearSessionData();
    this.notify('SESSION_INVALID');
  }

  private clearSessionData(): void {
    this.currentUser = null;
    this.currentSession = null;
    this.cleanLegacyFlags();

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SECURE_TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(SECURE_USER_STORAGE_KEY);
        localStorage.removeItem(SECURE_TOKEN_STORAGE_KEY);
        localStorage.removeItem(SECURE_USER_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }

  public isAuthenticated(): boolean {
    if (!this.currentUser || !this.currentSession) {
      return false;
    }

    if (Date.now() >= this.currentSession.expiresAt) {
      this.logout('EXPIRED');
      return false;
    }

    return true;
  }

  public verifyCurrentToken(): {
    isValid: boolean;
    isExpired: boolean;
    user: RegisteredUser | null;
    session: AuthSession | null;
    timeRemainingSeconds: number;
  } {
    const isAuth = this.isAuthenticated();
    const timeRemainingSeconds = this.currentSession
      ? Math.max(0, Math.floor((this.currentSession.expiresAt - Date.now()) / 1000))
      : 0;

    return {
      isValid: isAuth,
      isExpired: this.currentSession ? Date.now() >= this.currentSession.expiresAt : false,
      user: isAuth ? this.getCurrentUser() : null,
      session: isAuth ? this.currentSession : null,
      timeRemainingSeconds,
    };
  }

  public getCurrentUser(): RegisteredUser | null {
    return this.isAuthenticated() && this.currentUser ? { ...this.currentUser } : null;
  }

  public getCurrentSession(): AuthSession | null {
    return this.isAuthenticated() && this.currentSession ? { ...this.currentSession } : null;
  }

  public getRememberedCardId(): string | null {
    try {
      return localStorage.getItem(REMEMBERED_CARD_KEY);
    } catch {
      return null;
    }
  }

  public hasRole(targetRole: D365SecurityRole, user?: RegisteredUser | null): boolean {
    const targetUser = user || this.currentUser;
    if (!targetUser) return false;

    const userRoles = targetUser.roles && targetUser.roles.length > 0 ? targetUser.roles : [targetUser.role];

    if (userRoles.includes(targetRole) || targetUser.role === targetRole) {
      return true;
    }

    if (targetRole === 'MSS_MGR') {
      return (
        userRoles.includes('MSS_MGR') ||
        userRoles.includes('Manager') ||
        userRoles.includes('SYSTEM_ADMIN') ||
        userRoles.includes('Admin') ||
        targetUser.role === 'MSS_MGR' ||
        targetUser.role === 'Manager' ||
        targetUser.role === 'SYSTEM_ADMIN' ||
        targetUser.role === 'Admin'
      );
    }

    if (targetRole === 'Manager') {
      return this.hasRole('MSS_MGR', targetUser);
    }

    if (targetRole === 'ESS_USER') {
      return (
        userRoles.includes('ESS_USER') ||
        userRoles.includes('Employee') ||
        targetUser.role === 'ESS_USER' ||
        targetUser.role === 'Employee'
      );
    }

    if (targetRole === 'Employee') {
      return this.hasRole('ESS_USER', targetUser);
    }

    if (targetRole === 'SYSTEM_ADMIN' || targetRole === 'Admin' || targetRole === 'HR_ADMIN') {
      return (
        userRoles.includes('SYSTEM_ADMIN') ||
        userRoles.includes('Admin') ||
        userRoles.includes('HR_ADMIN') ||
        targetUser.role === 'SYSTEM_ADMIN' ||
        targetUser.role === 'Admin' ||
        targetUser.role === 'HR_ADMIN'
      );
    }

    return false;
  }

  public canAccessRoute(routeModule: string): { allowed: boolean; reason?: string } {
    if (!this.isAuthenticated()) {
      return { allowed: false, reason: 'NOT_AUTHENTICATED' };
    }

    const user = this.currentUser;
    if (!user) {
      return { allowed: false, reason: 'USER_NOT_FOUND' };
    }

    if (routeModule === 'team') {
      const allowsTeam = this.hasRole('MSS_MGR', user);
      if (!allowsTeam) {
        return {
          allowed: false,
          reason: 'صلاحيات غير كافية: تتطلب هذه الشاشة دور إدارة الفريق (Manager Self-Service - MSS_MGR).',
        };
      }
    }

    return { allowed: true };
  }

  public subscribe(
    listener: (user: RegisteredUser | null, reason?: AuthEventReason) => void
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(reason: AuthEventReason = 'LOGIN'): void {
    const userToEmit = this.isAuthenticated() ? (this.currentUser ? { ...this.currentUser } : null) : null;
    this.listeners.forEach((listener) => {
      try {
        listener(userToEmit, reason);
      } catch (err) {
        console.error('Error in auth listener:', err);
      }
    });
  }
}

export const authService = new AuthenticationService();
