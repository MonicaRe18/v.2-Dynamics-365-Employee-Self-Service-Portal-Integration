import React, { useState } from 'react';
import {
  Grid,
  Search,
  Bell,
  Settings,
  HelpCircle,
  User,
  Building2,
  ChevronDown,
  Check,
  ExternalLink,
  Code2,
  LogOut
} from 'lucide-react';
import { Employee, D365Notification } from '../../types/d365.types';
import { authService } from '../../services/authService';

interface D365HeaderProps {
  employee: Employee;
  notifications: D365Notification[];
  onOpenODataInspector: () => void;
  onSearchChange?: (query: string) => void;
  activeModuleTitle: string;
  onLogout?: () => void;
}

export const D365Header: React.FC<D365HeaderProps> = ({
  employee,
  notifications,
  onOpenODataInspector,
  onSearchChange,
  activeModuleTitle,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('USMF');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowChangePassword(false);
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('تأكيد كلمة المرور الجديدة غير مطابق.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('اختر كلمة مرور جديدة مختلفة عن الحالية.');
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    const result = await authService.changePasswordAsync(currentPassword, newPassword, confirmPassword);
    setPasswordSaving(false);
    if (!result.success) {
      setPasswordError(result.errorMessage || 'تعذر تغيير كلمة المرور.');
      return;
    }
    resetPasswordForm();
    sessionStorage.setItem('d365_password_changed', '1');
    setShowUserMenu(false);
    onLogout?.();
  };

  const legalEntities = [
    { code: 'USMF', name: 'الشركة العامة للحلول التقنية والخدمات الرقمية', country: 'المملكة العربية السعودية' },
    { code: 'PROD', name: 'بيئة الإنتاج الموحدة للخدمات المؤسسية', country: 'المركز الرئيسي' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#002050] text-white border-b border-[#001433] shadow-xs">
      <div className="flex items-center justify-between px-3 h-12">
        {/* Right Section in RTL: Waffle + App Name + Legal Entity */}
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* App Launcher / Waffle */}
          <button
            title="مشغل التطبيقات"
            aria-label="مشغل التطبيقات"
            className="p-1.5 hover:bg-[#003366] transition-colors rounded-none flex items-center justify-center text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Grid className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* D365 Brand Title */}
          <div className="flex items-center gap-2 pr-1 border-r border-[#1a3a6b]">
            <span className="font-semibold text-sm tracking-wide text-white">Dynamics 365</span>
            <span className="text-xs text-[#C8C6C4] hidden sm:inline">|</span>
            <span className="text-xs font-normal text-[#C8C6C4] hidden sm:inline">
              Finance & Operations - الموارد البشرية والخدمة الذاتية
            </span>
          </div>

          {/* Legal Entity Switcher (DataAreaId in D365) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              className="flex items-center gap-2 px-2.5 py-1 text-xs bg-[#00173a] hover:bg-[#003366] border border-[#1a3a6b] text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              title="تغيير الكيان القانوني (DataAreaId)"
              aria-label="تغيير الكيان القانوني"
              aria-expanded={showCompanyMenu}
              aria-haspopup="true"
            >
              <Building2 className="w-3.5 h-3.5 text-[#0078D4]" aria-hidden="true" />
              <span className="font-mono font-bold text-[#69AFE5]">{selectedEntity}</span>
              <span className="text-[11px] text-[#EDEBE9] max-w-[170px] truncate">
                {legalEntities.find((e) => e.code === selectedEntity)?.name}
              </span>
              <ChevronDown className="w-3 h-3 text-[#C8C6C4]" aria-hidden="true" />
            </button>

            {showCompanyMenu && (
              <div className="absolute right-0 mt-1 w-72 bg-white text-[#323130] border border-[#D1D1D1] shadow-lg py-1 z-50 text-right">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-[#605E5C] border-b border-[#EDEBE9] bg-[#F5F5F5]">
                  اختر الكيان القانوني (Company / Legal Entity):
                </div>
                {legalEntities.map((entity) => (
                  <button
                    key={entity.code}
                    onClick={() => {
                      setSelectedEntity(entity.code);
                      setShowCompanyMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F3F2F1] transition-colors text-right ${
                      selectedEntity === entity.code ? 'bg-[#EDEBE9] font-semibold text-[#0078D4]' : ''
                    }`}
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-[#0078D4]">{entity.code}</div>
                      <div className="text-[11px] text-[#323130]">{entity.name}</div>
                      <div className="text-[10px] text-[#605E5C]">{entity.country}</div>
                    </div>
                    {selectedEntity === entity.code && <Check className="w-4 h-4 text-[#0078D4]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Current Page Context */}
        <div className="flex-1 max-w-md mx-4 hidden lg:block"></div>

        {/* Left Section in RTL: Quick Utilities & Employee Avatar */}
        <div className="flex items-center space-x-2 space-x-reverse">
          {/* Notifications Flyout Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-[#003366] text-white relative transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              title="مركز الإشعارات والتنبيهات"
              aria-label={`مركز الإشعارات والتنبيهات${unreadCount > 0 ? `، ${unreadCount} غير مقروء` : ''}`}
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#D13438] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 bg-white text-[#323130] border border-[#D1D1D1] shadow-xl z-50 text-right">
                <div className="px-3 py-2 bg-[#F3F2F1] border-b border-[#D1D1D1] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#323130]">إشعارات سير العمل (Workflow)</span>
                  <span className="text-[10px] text-[#0078D4] bg-[#EDEBE9] px-1.5 py-0.5 font-medium">
                    {unreadCount} غير مقروء
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#EDEBE9]">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 text-xs hover:bg-[#F3F2F1] transition-colors cursor-pointer ${
                        !notif.isRead ? 'bg-[#EFF6FC]' : ''
                      }`}
                    >
                      <div className="font-semibold text-[#0078D4] mb-0.5">{notif.title}</div>
                      <div className="text-[#605E5C] text-[11px] leading-relaxed mb-1">{notif.message}</div>
                      <div className="text-[10px] text-[#605E5C]">{notif.timestamp}</div>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-[#F5F5F5] border-t border-[#D1D1D1] text-center">
                  <span className="text-[11px] text-[#0078D4] hover:underline cursor-pointer">
                    عرض جميع مهام سير العمل في مركز الإجراءات
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Help & Settings */}
          <button
            className="p-2 hover:bg-[#003366] text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            title="إعدادات النظام"
            aria-label="إعدادات النظام"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            className="p-2 hover:bg-[#003366] text-white transition-colors hidden sm:block focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            title="المساعدة ودعم Dynamics 365"
            aria-label="المساعدة ودعم Dynamics 365"
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Employee Profile Chip */}
          <div className="relative pr-1 border-r border-[#1a3a6b]">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 hover:bg-[#003366] transition-colors text-right focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              title="الملف الشخصي للموظف"
              aria-label="الملف الشخصي للموظف"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-none border border-[#0078D4] bg-[#00173a] flex items-center justify-center text-xs font-bold text-[#69AFE5] overflow-hidden shrink-0">
                {employee.avatarUrl ? (
                  <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
                ) : (
                  employee.name.slice(0, 1)
                )}
              </div>
              <div className="hidden md:block text-right">
                <div className="text-xs font-medium text-white truncate max-w-[130px]">{employee.name}</div>
                <div className="text-[10px] text-[#C8C6C4]">{employee.id}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-[#C8C6C4]" aria-hidden="true" />
            </button>

            {showUserMenu && (
              <div className="absolute left-0 mt-2 w-72 bg-white text-[#323130] border border-[#D1D1D1] shadow-xl p-3 z-50 text-right">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#EDEBE9]">
                  <div className="w-10 h-10 bg-[#0078D4] text-white font-bold text-base flex items-center justify-center overflow-hidden shrink-0">
                    {employee.avatarUrl ? (
                      <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
                    ) : (
                      employee.name.slice(0, 1)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#323130]">{employee.name}</div>
                    <div className="text-[11px] text-[#605E5C]">{employee.jobTitle}</div>
                    <div className="text-[10px] text-[#0078D4] font-mono">{employee.id}</div>
                  </div>
                </div>
                <div className="py-2 text-[11px] space-y-1 text-[#605E5C]">
                  <div><strong className="text-[#323130]">رقم البطاقة:</strong> <span className="font-mono text-[#0078D4]">{employee.civilId || '—'}</span></div>
                  <div><strong className="text-[#323130]">الإدارة:</strong> {employee.department}</div>
                  <div><strong className="text-[#323130]">البريد:</strong> {employee.email}</div>
                  <div><strong className="text-[#323130]">الحالة:</strong> <span className="text-[#107C41] font-semibold">{employee.employmentStatusAr}</span></div>
                </div>
                <div className="border-t border-[#EDEBE9] py-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (showChangePassword) resetPasswordForm();
                      else setShowChangePassword(true);
                    }}
                    className="text-xs text-[#0078D4] font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-[#0078D4]"
                  >
                    {showChangePassword ? 'إلغاء تغيير كلمة المرور' : 'تغيير كلمة المرور'}
                  </button>
                  {showChangePassword && (
                    <form onSubmit={handleChangePassword} className="mt-2 space-y-2">
                      <label className="block text-xs">
                        كلمة المرور الحالية
                        <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)}
                          autoComplete="current-password" required maxLength={50}
                          className="mt-1 w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none" />
                      </label>
                      <label className="block text-xs">
                        كلمة المرور الجديدة
                        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)}
                          autoComplete="new-password" required minLength={8} maxLength={50}
                          className="mt-1 w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none" />
                      </label>
                      <label className="block text-xs">
                        تأكيد كلمة المرور الجديدة
                        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}
                          autoComplete="new-password" required minLength={8} maxLength={50}
                          className="mt-1 w-full h-8 px-2 border border-[#8A8886] focus:border-[#0078D4] outline-none" />
                      </label>
                      {passwordError && <p role="alert" className="text-xs text-[#A80000]">{passwordError}</p>}
                      <button type="submit" disabled={passwordSaving}
                        className="px-3 py-1.5 bg-[#0078D4] text-white text-xs font-semibold disabled:opacity-50">
                        {passwordSaving ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
                      </button>
                    </form>
                  )}
                </div>
                <div className="pt-2 border-t border-[#EDEBE9] flex items-center justify-between">
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="text-xs text-[#A80000] hover:text-[#D13438] hover:bg-[#FDE7E9] px-2 py-1 font-semibold flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-[#A80000] focus-visible:outline-none"
                      title="تسجيل الخروج من البوابة"
                      aria-label="تسجيل الخروج"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>تسجيل الخروج</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="text-xs text-[#0078D4] hover:underline p-1 focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:outline-none"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Header Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="تسجيل الخروج من النظام"
              aria-label="تسجيل الخروج من النظام"
              className="p-1.5 hover:bg-[#A80000]/70 text-[#FFA39E] hover:text-white transition-colors flex items-center gap-1 text-xs focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="hidden xl:inline text-[11px]">خروج</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar / Breadcrumb Bar */}
      <div className="h-8 bg-[#F3F2F1] text-[#323130] px-4 flex items-center justify-between border-t border-[#D1D1D1] text-xs">
        <div className="flex items-center gap-2 text-[#605E5C]">
          <span className="hover:text-[#0078D4] cursor-pointer">الرئيسية</span>
          <span>/</span>
          <span className="hover:text-[#0078D4] cursor-pointer">الموارد البشرية</span>
          <span>/</span>
          <span className="font-semibold text-[#0078D4]">{activeModuleTitle}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#605E5C]">
          <span>تاريخ النظام: <strong className="font-mono text-[#323130]">2026-09-21</strong></span>
        </div>
      </div>
    </header>
  );
};
