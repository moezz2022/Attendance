// app/notifications/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  FileText,
  AlertCircle,
  Info,
  Settings,
  Eye,
  X,
  User,
  Briefcase
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'attendance' | 'leave' | 'system' | 'employee' | 'alert';
  title: string;
  message: string;
  date: string;
  time: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  relatedId?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [searchQuery, filterType, filterRead, notifications]);

  const loadNotifications = () => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      setFilteredNotifications(parsed);
    } else {
      // بيانات تجريبية
      const demoNotifications: Notification[] = [
        {
          id: 'NOT001',
          type: 'attendance',
          title: 'تأخر موظف',
          message: 'تأخر الموظف أحمد محمد عن موعد الحضور بـ 30 دقيقة',
          date: '2025-10-25',
          time: '08:30',
          read: false,
          priority: 'high',
          relatedId: 'EMP001'
        },
        {
          id: 'NOT002',
          type: 'leave',
          title: 'طلب إجازة جديد',
          message: 'قدمت فاطمة علي طلب إجازة مرضية لمدة يومين',
          date: '2025-10-25',
          time: '09:15',
          read: false,
          priority: 'medium',
          relatedId: 'LR002'
        },
        {
          id: 'NOT003',
          type: 'system',
          title: 'تحديث النظام',
          message: 'تم تحديث النظام إلى الإصدار 1.2.0 بنجاح',
          date: '2025-10-24',
          time: '14:00',
          read: true,
          priority: 'low'
        },
        {
          id: 'NOT004',
          type: 'employee',
          title: 'موظف جديد',
          message: 'تم إضافة موظف جديد: عمر يوسف - قسم المبيعات',
          date: '2025-10-24',
          time: '11:30',
          read: true,
          priority: 'medium',
          relatedId: 'EMP005'
        },
        {
          id: 'NOT005',
          type: 'attendance',
          title: 'غياب موظف',
          message: 'غياب الموظف مريم حسن عن العمل اليوم',
          date: '2025-10-25',
          time: '10:00',
          read: false,
          priority: 'high',
          relatedId: 'EMP004'
        },
        {
          id: 'NOT006',
          type: 'alert',
          title: 'تنبيه: انخفاض نسبة الحضور',
          message: 'نسبة الحضور هذا الأسبوع أقل من 85%',
          date: '2025-10-24',
          time: '16:00',
          read: true,
          priority: 'high'
        },
        {
          id: 'NOT007',
          type: 'leave',
          title: 'تمت الموافقة على إجازة',
          message: 'تمت الموافقة على طلب إجازة خالد سعيد',
          date: '2025-10-23',
          time: '13:45',
          read: true,
          priority: 'low',
          relatedId: 'LR003'
        },
        {
          id: 'NOT008',
          type: 'system',
          title: 'نسخة احتياطية',
          message: 'تم إنشاء نسخة احتياطية من البيانات بنجاح',
          date: '2025-10-23',
          time: '02:00',
          read: true,
          priority: 'low'
        }
      ];
      setNotifications(demoNotifications);
      setFilteredNotifications(demoNotifications);
      localStorage.setItem('notifications', JSON.stringify(demoNotifications));
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    if (searchQuery) {
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(notif => notif.type === filterType);
    }

    if (filterRead === 'read') {
      filtered = filtered.filter(notif => notif.read);
    } else if (filterRead === 'unread') {
      filtered = filtered.filter(notif => !notif.read);
    }

    // ترتيب حسب التاريخ والوقت (الأحدث أولاً)
    filtered.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
      return dateTimeB - dateTimeA;
    });

    setFilteredNotifications(filtered);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(notif => ({ ...notif, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(notif => notif.id !== id);
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const deleteAllRead = () => {
    if (confirm('هل أنت متأكد من حذف جميع الإشعارات المقروءة؟')) {
      const updated = notifications.filter(notif => !notif.read);
      setNotifications(updated);
      localStorage.setItem('notifications', JSON.stringify(updated));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <Clock className="text-blue-600" size={24} />;
      case 'leave':
        return <Calendar className="text-green-600" size={24} />;
      case 'system':
        return <Settings className="text-purple-600" size={24} />;
      case 'employee':
        return <User className="text-orange-600" size={24} />;
      case 'alert':
        return <AlertCircle className="text-red-600" size={24} />;
      default:
        return <Bell className="text-gray-600" size={24} />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50 border-gray-200';
    
    switch (type) {
      case 'attendance':
        return 'bg-blue-50 border-blue-200';
      case 'leave':
        return 'bg-green-50 border-green-200';
      case 'system':
        return 'bg-purple-50 border-purple-200';
      case 'employee':
        return 'bg-orange-50 border-orange-200';
      case 'alert':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">عاجل</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">متوسط</span>;
      case 'low':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">عادي</span>;
      default:
        return null;
    }
  };

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      attendance: 'الحضور',
      leave: 'الإجازات',
      system: 'النظام',
      employee: 'الموظفين',
      alert: 'تنبيه'
    };
    return types[type] || type;
  };

  // الإحصائيات
  const unreadCount = notifications.filter(n => !n.read).length;
  const todayCount = notifications.filter(n => n.date === new Date().toISOString().split('T')[0]).length;
  const highPriorityCount = notifications.filter(n => !n.read && n.priority === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مركز الإشعارات</h1>
          <p className="text-gray-500 mt-1">متابعة جميع إشعارات النظام</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <CheckCheck size={18} />
            <span>تحديد الكل كمقروء</span>
          </button>
          <button 
            onClick={deleteAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 size={18} />
            <span>حذف المقروءة</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي الإشعارات</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{notifications.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">غير مقروءة</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{unreadCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Eye className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">اليوم</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{todayCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">عاجلة</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{highPriorityCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="البحث في الإشعارات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الأنواع</option>
            <option value="attendance">الحضور</option>
            <option value="leave">الإجازات</option>
            <option value="system">النظام</option>
            <option value="employee">الموظفين</option>
            <option value="alert">التنبيهات</option>
          </select>

          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">الكل</option>
            <option value="unread">غير مقروءة</option>
            <option value="read">مقروءة</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Bell className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد إشعارات</h3>
            <p className="text-gray-500">لم يتم العثور على أي إشعارات تطابق معايير البحث</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm p-5 border transition-all cursor-pointer hover:shadow-md ${
                getNotificationColor(notification.type, notification.read)
              } ${!notification.read ? 'border-l-4' : ''}`}
              onClick={() => {
                setSelectedNotification(notification);
                setShowDetailModal(true);
                if (!notification.read) markAsRead(notification.id);
              }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${notification.read ? 'bg-gray-100' : 'bg-white'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                      {getPriorityBadge(notification.priority)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="تحديد كمقروء"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className={`text-sm mb-3 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(notification.date).toLocaleDateString('ar-SA')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {notification.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Filter size={14} />
                      {getTypeName(notification.type)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className={`px-6 py-4 border-b ${
              selectedNotification.type === 'attendance' ? 'bg-blue-50 border-blue-200' :
              selectedNotification.type === 'leave' ? 'bg-green-50 border-green-200' :
              selectedNotification.type === 'system' ? 'bg-purple-50 border-purple-200' :
              selectedNotification.type === 'employee' ? 'bg-orange-50 border-orange-200' :
              selectedNotification.type === 'alert' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            } rounded-t-xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">{getTypeName(selectedNotification.type)}</span>
                      {getPriorityBadge(selectedNotification.priority)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 leading-relaxed">{selectedNotification.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-blue-600" size={20} />
                    <p className="text-sm font-medium text-blue-900">التاريخ</p>
                  </div>
                  <p className="text-lg font-semibold text-blue-700">
                    {new Date(selectedNotification.date).toLocaleDateString('ar-SA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-purple-600" size={20} />
                    <p className="text-sm font-medium text-purple-900">الوقت</p>
                  </div>
                  <p className="text-lg font-semibold text-purple-700">{selectedNotification.time}</p>
                </div>
              </div>

              {selectedNotification.relatedId && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info className="text-yellow-600" size={20} />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">معرّف مرتبط</p>
                      <p className="text-sm text-yellow-700 font-mono">{selectedNotification.relatedId}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 rounded-b-xl">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
              >
                إغلاق
              </button>
              {!selectedNotification.read && (
                <button
                  onClick={() => {
                    markAsRead(selectedNotification.id);
                    setShowDetailModal(false);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Check size={18} />
                  <span>تحديد كمقروء</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}