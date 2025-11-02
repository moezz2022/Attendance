// app/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Clock, 
  Bell, 
  Shield, 
  Building2,
  Users,
  Mail,
  Globe,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lock,
  Key,
  Database,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

interface SystemSettings {
  // إعدادات الوقت
  workStartTime: string;
  workEndTime: string;
  lateThreshold: number; // بالدقائق
  breakDuration: number; // بالدقائق
  workDaysPerWeek: number;
  
  // إعدادات الشركة
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyLogo: string;
  
  // إعدادات الإشعارات
  emailNotifications: boolean;
  smsNotifications: boolean;
  lateArrivalAlert: boolean;
  absentAlert: boolean;
  earlyDepartureAlert: boolean;
  
  // إعدادات الأمان
  sessionTimeout: number; // بالدقائق
  passwordMinLength: number;
  requireStrongPassword: boolean;
  twoFactorAuth: boolean;
  maxLoginAttempts: number;
  
  // إعدادات النظام
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  backupFrequency: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSettings>({
    // إعدادات الوقت
    workStartTime: '08:00',
    workEndTime: '17:00',
    lateThreshold: 15,
    breakDuration: 60,
    workDaysPerWeek: 5,
    
    // إعدادات الشركة
    companyName: 'شركة النجاح للتقنية',
    companyEmail: 'info@company.com',
    companyPhone: '0551234567',
    companyAddress: 'الرياض، المملكة العربية السعودية',
    companyLogo: '',
    
    // إعدادات الإشعارات
    emailNotifications: true,
    smsNotifications: false,
    lateArrivalAlert: true,
    absentAlert: true,
    earlyDepartureAlert: false,
    
    // إعدادات الأمان
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireStrongPassword: true,
    twoFactorAuth: false,
    maxLoginAttempts: 3,
    
    // إعدادات النظام
    language: 'ar',
    timezone: 'Asia/Riyadh',
    dateFormat: 'DD/MM/YYYY',
    currency: 'SAR',
    backupFrequency: 'daily'
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // تحميل الإعدادات من localStorage
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    const savedTime = localStorage.getItem('settingsLastSaved');
    if (savedTime) {
      setLastSaved(new Date(savedTime));
    }
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    const promise = new Promise<void>((resolve) => {
      setTimeout(() => {
        localStorage.setItem('systemSettings', JSON.stringify(settings));
        const now = new Date();
        localStorage.setItem('settingsLastSaved', now.toISOString());
        setLastSaved(now);
        resolve();
      }, 1000);
    });

    toast.promise(promise, {
      loading: 'جاري الحفظ...'
      , success: 'تم حفظ التغييرات بنجاح'
      , error: 'فشل حفظ التغييرات'
    });
    promise
      .then(() => {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 1000);
      })
      .catch(() => {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 1000);
      });
  };

  const handleReset = () => {
    const id = toast.custom((t) => (
      <div className="w-full max-w-sm rounded-lg bg-white shadow border border-gray-200 p-4 text-right">
        <div className="font-semibold text-gray-900 mb-1">تأكيد إعادة التعيين</div>
        <div className="text-sm text-gray-600 mb-3">هل تريد إعادة تعيين جميع الإعدادات؟</div>
        <div className="flex items-center gap-2 justify-start">
          <button
            onClick={() => {
              toast.dismiss(t);
              localStorage.removeItem('systemSettings');
              toast.success('تمت إعادة التعيين');
              window.location.reload();
            }}
            className="px-3 py-1.5 text-white bg-red-600 hover:bg-red-700 rounded-md text-sm"
          >
            تأكيد
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm"
          >
            إلغاء
          </button>
        </div>
      </div>
    ));
    return id;
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('تم تصدير الإعدادات');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSettings(imported);
          setSaveStatus('success');
          toast.success('تم استيراد الإعدادات');
          setTimeout(() => setSaveStatus('idle'), 1500);
        } catch (error) {
          setSaveStatus('error');
          toast.error('ملف غير صالح');
          setTimeout(() => setSaveStatus('idle'), 1500);
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'general', label: 'عام', icon: SettingsIcon },
    { id: 'time', label: 'الأوقات', icon: Clock },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'company', label: 'الشركة', icon: Building2 },
    { id: 'system', label: 'النظام', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors dir="rtl" />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
          <p className="text-gray-500 mt-1">إدارة إعدادات النظام والتفضيلات</p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <div className="text-sm text-gray-500">
              آخر حفظ: {lastSaved.toLocaleTimeString('ar-DZ')}
            </div>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            <span>إعادة تعيين</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle size={18} />
                <span>تم الحفظ</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>حفظ التغييرات</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">الإعدادات العامة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="inline ml-2" size={16} />
                      اللغة
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({...settings, language: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline ml-2" size={16} />
                      المنطقة الزمنية
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Asia/Riyadh">الجزائر (GMT+1)</option>
                      <option value="Asia/Dubai">دبي (GMT+4)</option>
                      <option value="Africa/Cairo">القاهرة (GMT+2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تنسيق التاريخ
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">إدارة البيانات</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Download size={18} />
                    <span>تصدير الإعدادات</span>
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer">
                    <Upload size={18} />
                    <span>استيراد الإعدادات</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>

                  <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                    <Trash2 size={18} />
                    <span>حذف جميع البيانات</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Time Settings */}
          {activeTab === 'time' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">إعدادات أوقات العمل</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline ml-2" size={16} />
                      وقت بداية العمل
                    </label>
                    <input
                      type="time"
                      value={settings.workStartTime}
                      onChange={(e) => setSettings({...settings, workStartTime: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline ml-2" size={16} />
                      وقت نهاية العمل
                    </label>
                    <input
                      type="time"
                      value={settings.workEndTime}
                      onChange={(e) => setSettings({...settings, workEndTime: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <AlertCircle className="inline ml-2" size={16} />
                      حد التأخير المسموح (دقيقة)
                    </label>
                    <input
                      type="number"
                      value={settings.lateThreshold}
                      onChange={(e) => setSettings({...settings, lateThreshold: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="60"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      سيتم تسجيل التأخير إذا تجاوز الموظف {settings.lateThreshold} دقيقة
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      مدة الاستراحة (دقيقة)
                    </label>
                    <input
                      type="number"
                      value={settings.breakDuration}
                      onChange={(e) => setSettings({...settings, breakDuration: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      أيام العمل في الأسبوع
                    </label>
                    <select
                      value={settings.workDaysPerWeek}
                      onChange={(e) => setSettings({...settings, workDaysPerWeek: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="5">5 أيام</option>
                      <option value="6">6 أيام</option>
                      <option value="7">7 أيام</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">ملخص أوقات العمل:</p>
                    <ul className="space-y-1">
                      <li>• ساعات العمل: من {settings.workStartTime} إلى {settings.workEndTime}</li>
                      <li>• مدة العمل اليومية: {
                        Math.abs(
                          new Date(`2000-01-01T${settings.workEndTime}`).getTime() - 
                          new Date(`2000-01-01T${settings.workStartTime}`).getTime()
                        ) / (1000 * 60 * 60)
                      } ساعة</li>
                      <li>• التأخير المسموح: {settings.lateThreshold} دقيقة</li>
                      <li>• مدة الاستراحة: {settings.breakDuration} دقيقة</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">إعدادات الإشعارات</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="text-blue-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">إشعارات البريد الإلكتروني</p>
                        <p className="text-sm text-gray-500">تلقي الإشعارات عبر البريد الإلكتروني</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="text-green-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">إشعارات SMS</p>
                        <p className="text-sm text-gray-500">تلقي الإشعارات عبر الرسائل النصية</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.smsNotifications}
                        onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">أنواع التنبيهات</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">تنبيه التأخير</p>
                      <p className="text-sm text-gray-500">إرسال تنبيه عند تأخر موظف</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.lateArrivalAlert}
                        onChange={(e) => setSettings({...settings, lateArrivalAlert: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">تنبيه الغياب</p>
                      <p className="text-sm text-gray-500">إرسال تنبيه عند غياب موظف</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.absentAlert}
                        onChange={(e) => setSettings({...settings, absentAlert: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">تنبيه الانصراف المبكر</p>
                      <p className="text-sm text-gray-500">إرسال تنبيه عند انصراف مبكر</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.earlyDepartureAlert}
                        onChange={(e) => setSettings({...settings, earlyDepartureAlert: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">إعدادات الأمان</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="inline ml-2" size={16} />
                      مدة انتهاء الجلسة (دقيقة)
                    </label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({...settings, sessionTimeout: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="5"
                      max="120"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      سيتم تسجيل الخروج تلقائياً بعد {settings.sessionTimeout} دقيقة من عدم النشاط
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Key className="inline ml-2" size={16} />
                      الحد الأدنى لطول كلمة المرور
                    </label>
                    <input
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => setSettings({...settings, passwordMinLength: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="6"
                      max="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الحد الأقصى لمحاولات تسجيل الدخول
                    </label>
                    <input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings({...settings, maxLoginAttempts: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="3"
                      max="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      سيتم حظر الحساب بعد {settings.maxLoginAttempts} محاولات فاشلة
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">خيارات الأمان المتقدمة</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="text-blue-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">كلمة مرور قوية</p>
                        <p className="text-sm text-gray-500">يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requireStrongPassword}
                        onChange={(e) => setSettings({...settings, requireStrongPassword: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="text-green-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-900">المصادقة الثنائية (2FA)</p>
                        <p className="text-sm text-gray-500">إضافة طبقة أمان إضافية لتسجيل الدخول</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.twoFactorAuth}
                        onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-yellow-900">
                    <p className="font-semibold mb-1">تنبيه أمان:</p>
                    <p>يُنصح بشدة بتفعيل المصادقة الثنائية وفرض كلمات مرور قوية لحماية حسابات المستخدمين.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company Settings */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات الشركة</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="inline ml-2" size={16} />
                      اسم الشركة
                    </label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="اسم الشركة"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="inline ml-2" size={16} />
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={settings.companyEmail}
                        onChange={(e) => setSettings({...settings, companyEmail: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="info@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Bell className="inline ml-2" size={16} />
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        value={settings.companyPhone}
                        onChange={(e) => setSettings({...settings, companyPhone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="05xxxxxxxx"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="inline ml-2" size={16} />
                      العنوان
                    </label>
                    <textarea
                      value={settings.companyAddress}
                      onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="العنوان الكامل للشركة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      شعار الشركة
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        {settings.companyLogo ? (
                          <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                        ) : (
                          <Building2 className="text-gray-400" size={32} />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer inline-flex">
                          <Upload size={18} />
                          <span>رفع شعار</span>
                          <input type="file" accept="image/*" className="hidden" />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG أو GIF (الحد الأقصى 2MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">معلومات الشركة:</p>
                    <ul className="space-y-1">
                      <li>• الاسم: {settings.companyName}</li>
                      <li>• البريد: {settings.companyEmail}</li>
                      <li>• الهاتف: {settings.companyPhone}</li>
                      <li>• العنوان: {settings.companyAddress}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">إعدادات النظام</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Database className="inline ml-2" size={16} />
                      تكرار النسخ الاحتياطي
                    </label>
                    <select
                      value={settings.backupFrequency}
                      onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">يومي</option>
                      <option value="weekly">أسبوعي</option>
                      <option value="monthly">شهري</option>
                      <option value="manual">يدوي فقط</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      حالة النظام
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="text-green-700 font-medium">النظام يعمل بشكل طبيعي</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات النظام</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">إصدار النظام</p>
                    <p className="text-lg font-semibold text-gray-900">v1.0.0</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">آخر تحديث</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date().toLocaleDateString('ar-SA')}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">إجمالي المستخدمين</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {JSON.parse(localStorage.getItem('employees') || '[]').length}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">إجمالي السجلات</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {JSON.parse(localStorage.getItem('attendance') || '[]').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">صيانة النظام</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Database className="text-blue-600" size={24} />
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">إنشاء نسخة احتياطية</p>
                        <p className="text-sm text-gray-600">حفظ نسخة من جميع البيانات</p>
                      </div>
                    </div>
                    <Download className="text-blue-600" size={20} />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Upload className="text-green-600" size={24} />
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">استعادة نسخة احتياطية</p>
                        <p className="text-sm text-gray-600">استعادة البيانات من نسخة سابقة</p>
                      </div>
                    </div>
                    <Upload className="text-green-600" size={20} />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="text-orange-600" size={24} />
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">تحديث النظام</p>
                        <p className="text-sm text-gray-600">التحقق من التحديثات المتاحة</p>
                      </div>
                    </div>
                    <RefreshCw className="text-orange-600" size={20} />
                  </button>

                  <button 
                    onClick={() => {
                      const id = toast.custom((t) => (
                        <div className="w-full max-w-sm rounded-lg bg-white shadow border border-gray-200 p-4 text-right">
                          <div className="font-semibold text-gray-900 mb-1">تأكيد الحذف</div>
                          <div className="text-sm text-gray-600 mb-3">هل تريد حذف جميع البيانات؟ لا يمكن التراجع.</div>
                          <div className="flex items-center gap-2 justify-start">
                            <button
                              onClick={() => {
                                toast.dismiss(t);
                                localStorage.clear();
                                toast.success('تم حذف جميع البيانات');
                                window.location.href = '/login';
                              }}
                              className="px-3 py-1.5 text-white bg-red-600 hover:bg-red-700 rounded-md text-sm"
                            >
                              تأكيد
                            </button>
                            <button
                              onClick={() => toast.dismiss(t)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ));
                      return id;
                    }}
                    className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="text-red-600" size={24} />
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">حذف جميع البيانات</p>
                        <p className="text-sm text-gray-600">مسح جميع بيانات النظام نهائياً</p>
                      </div>
                    </div>
                    <AlertCircle className="text-red-600" size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-red-900">
                    <p className="font-semibold mb-1">تحذير:</p>
                    <p>حذف البيانات أو استعادة نسخة احتياطية سيؤدي إلى فقدان جميع البيانات الحالية. تأكد من إنشاء نسخة احتياطية قبل أي إجراء.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toasts تغني عن تنبيهات الحالة السفلية */}
    </div>
  );
}