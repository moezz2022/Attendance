'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  Bell, 
  LogOut,
  Menu,
  X,
  Clock,
  FileText,
  MapPin,
  Building2,
  UserCircle,
  ChevronDown,
  BarChart3
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
const router = useRouter();
const pathname = usePathname();
const [loading, setLoading] = useState(true);
const [sidebarOpen, setSidebarOpen] = useState(false);
const [leavesMenuOpen, setLeavesMenuOpen] = useState(false);

useEffect(() => {
  // التحقق من المصادقة
  const token = localStorage.getItem('token');

  if (!token) {
    router.push('/login');
    return;
  }
  setLoading(false);
}, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const menuItems = [
    { 
      icon: Home, 
      label: 'الصفحة الرئيسية', 
      href: '/dashboard',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      icon: Clock, 
      label: 'الحضور والانصراف', 
      href: '/attendance',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      icon: Calendar, 
      label: 'الإجازات', 
      href: '/leaves',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    { 
      icon: Bell, 
      label: 'الإشعارات', 
      href: '/notifications',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      icon: Users, 
      label: 'الموظفون', 
      href: '/employees',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    { 
      icon: Building2, 
      label: 'الأقسام', 
      href: '/departments',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
    },
    { 
      icon: MapPin, 
      label: 'المواقع', 
      href: '/locations',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    { 
      icon: FileText, 
      label: 'سجلات الحضور', 
      href: '/attendance-records',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    { 
      icon: BarChart3, 
      label: 'التقارير', 
      href: '/reports',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    { 
      icon: Settings, 
      label: 'الإعدادات', 
      href: '/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50 transition-colors"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 z-40 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">نظام الحضور</h1>
              <p className="text-xs text-gray-500">إدارة الوقت والموارد</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all mb-2 group ${
                    isActive
                      ? `${item.bgColor} ${item.color} font-semibold shadow-sm`
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (item.hasSubmenu) {
                      setLeavesMenuOpen(!leavesMenuOpen);
                    } else {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isActive ? '' : 'text-gray-400 group-hover:text-gray-600'} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.hasSubmenu && (
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform ${leavesMenuOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </Link>

                {/* Submenu */}
                {item.hasSubmenu && leavesMenuOpen && (
                  <div className="mr-8 mb-2 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                          pathname === subItem.href
                            ? 'bg-purple-50 text-purple-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-semibold hover:shadow-md"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:mr-72 min-h-screen">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu size={24} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {menuItems.find(item => item.href === pathname)?.label || 'لوحة التحكم'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <UserCircle size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}