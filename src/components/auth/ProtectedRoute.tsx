import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, Lock } from 'lucide-react';
import { authService, RegisteredUser, D365SecurityRole } from '../../services/authService';

interface ProtectedRouteProps {
  module: string;
  title: string;
  requiredRole?: D365SecurityRole | string;
  children: React.ReactNode;
  onNavigateHome?: () => void;
  currentUser: RegisteredUser | null;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  module,
  title,
  requiredRole,
  children,
  onNavigateHome,
  currentUser,
}) => {
  // 1. Verify token cryptographic validity and session state
  const tokenState = authService.verifyCurrentToken();
  const currentSession = authService.getCurrentSession() || tokenState.session;
  const activeUser = authService.getCurrentUser() || currentUser || tokenState.user;

  React.useEffect(() => {
    if (!tokenState.isValid || !authService.isAuthenticated()) {
      authService.logout(tokenState.isExpired ? 'EXPIRED' : 'LOGOUT');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [tokenState.isValid]);

  if (!tokenState.isValid || (!tokenState.user && !activeUser) || !authService.isAuthenticated()) {
    return null;
  }

  // 2. Check role and permission for the specific module using roles array
  let roles: string[] = [];

  if (Array.isArray(activeUser?.roles) && activeUser.roles.length > 0) {
    roles = [...activeUser.roles];
  } else if (Array.isArray(currentSession?.roles) && currentSession.roles.length > 0) {
    roles = [...currentSession.roles];
  } else if (Array.isArray(currentUser?.roles) && currentUser.roles.length > 0) {
    roles = [...currentUser.roles];
  } else if (Array.isArray(tokenState.user?.roles) && tokenState.user.roles.length > 0) {
    roles = [...tokenState.user.roles];
  } else if (activeUser?.role) {
    roles = [activeUser.role];
  } else if (currentSession?.role) {
    roles = [currentSession.role];
  } else if (currentUser?.role) {
    roles = [currentUser.role];
  }

  // 3. RBAC validation using roles array
  let isAllowed = false;
  let denialReason: string | undefined = undefined;

  if (module === 'team') {
    // My Team must allow access when: roles.includes("MSS_MGR")
    if (
      roles.includes('MSS_MGR') ||
      roles.includes('Manager') ||
      roles.includes('SYSTEM_ADMIN') ||
      roles.includes('Admin')
    ) {
      isAllowed = true;
    } else {
      isAllowed = false;
      denialReason = 'صلاحيات غير كافية: تتطلب هذه الشاشة دور إدارة الفريق (Manager Self-Service - MSS_MGR).';
    }
  } else if (requiredRole) {
    const roleEquivalents: Record<string, string[]> = {
      MSS_MGR: ['MSS_MGR', 'Manager', 'SYSTEM_ADMIN', 'Admin'],
      Manager: ['MSS_MGR', 'Manager', 'SYSTEM_ADMIN', 'Admin'],
      ESS_USER: ['ESS_USER', 'Employee', 'MSS_MGR', 'Manager', 'SYSTEM_ADMIN', 'Admin'],
      Employee: ['ESS_USER', 'Employee', 'MSS_MGR', 'Manager', 'SYSTEM_ADMIN', 'Admin'],
      SYSTEM_ADMIN: ['SYSTEM_ADMIN', 'Admin'],
      Admin: ['SYSTEM_ADMIN', 'Admin'],
    };

    const acceptableRoles = roleEquivalents[requiredRole] || [requiredRole, 'SYSTEM_ADMIN', 'Admin'];
    isAllowed = acceptableRoles.some((r) => roles.includes(r));
    if (!isAllowed) {
      denialReason = `عذراً، يتطلب الوصول إلى شاشة (${title}) دور وظيفي أعلى (${requiredRole}). أدوار حسابك الحالية [${roles.join(', ')}] غير مصرح لها بتنفيذ هذه العملية.`;
    }
  } else {
    isAllowed = roles.length > 0;
  }

  if (!isAllowed) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-amber-200 rounded-xl shadow-lg p-8 text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="inline-block px-3 py-1 bg-amber-100/80 text-amber-800 text-[11px] font-bold rounded-full mb-3">
            رمز الخطأ: 403 Forbidden (RBAC Guard)
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">صلاحيات غير كافية للوصول</h2>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            {denialReason ||
              `عذراً، يتطلب الوصول إلى شاشة (${title}) دور وظيفي أعلى (${requiredRole || 'Manager'}). حسابك الحالي (${activeUser?.jobTitle || currentUser?.jobTitle}) غير مصرح له بتنفيذ هذه العملية.`}
          </p>
          <div className="flex items-center justify-center gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="inline-flex items-center gap-2 py-2 px-4 bg-[#0078D4] hover:bg-[#106EBE] text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
              >
                <span>العودة إلى لوحة معلومات الموظف</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized & Valid Token
  return <>{children}</>;
};
