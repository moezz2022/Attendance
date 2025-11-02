// app/reports/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart3,
  Filter,
  Printer
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface ReportData {
  employees: any[];
  attendance: any[];
  period: {
    start: string;
    end: string;
  };
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    loadReportData();
  }, [startDate, endDate, selectedDepartment]);

  const loadReportData = () => {
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');

    // تصفية حسب القسم
    let filteredEmployees = employees;
    if (selectedDepartment !== 'all') {
      filteredEmployees = employees.filter((emp: any) => emp.department === selectedDepartment);
    }

    // تصفية الحضور حسب الفترة
    const filteredAttendance = attendance.filter((record: any) => {
      const recordDate = new Date(record.date);
      return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
    });

    setReportData({
      employees: filteredEmployees,
      attendance: filteredAttendance,
      period: { start: startDate, end: endDate }
    });
  };

  // حساب الإحصائيات
  const calculateStats = () => {
    if (!reportData) return null;

    const totalDays = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const totalEmployees = reportData.employees.length;
    const totalRecords = reportData.attendance.length;
    const presentRecords = reportData.attendance.filter((r: any) => 
      r.status === 'present' || r.status === 'late'
    ).length;
    const absentRecords = reportData.attendance.filter((r: any) => r.status === 'absent').length;
    const lateRecords = reportData.attendance.filter((r: any) => r.status === 'late').length;
    const leaveRecords = reportData.attendance.filter((r: any) => r.status === 'leave').length;

    const attendanceRate = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : 0;
    const absentRate = totalRecords > 0 ? ((absentRecords / totalRecords) * 100).toFixed(1) : 0;
    const lateRate = totalRecords > 0 ? ((lateRecords / presentRecords) * 100).toFixed(1) : 0;

    const totalWorkHours = reportData.attendance.reduce((sum: number, r: any) => sum + (r.workHours || 0), 0);
    const avgWorkHours = presentRecords > 0 ? (totalWorkHours / presentRecords).toFixed(1) : 0;

    return {
      totalDays,
      totalEmployees,
      totalRecords,
      presentRecords,
      absentRecords,
      lateRecords,
      leaveRecords,
      attendanceRate,
      absentRate,
      lateRate,
      totalWorkHours: totalWorkHours.toFixed(1),
      avgWorkHours
    };
  };

  const stats = calculateStats();

  // بيانات الرسم البياني - الحضور اليومي
  const getDailyAttendanceData = () => {
    if (!reportData) return [];

    const dateMap = new Map();
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: new Date(dateStr).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
        present: 0,
        absent: 0,
        late: 0,
        leave: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    reportData.attendance.forEach((record: any) => {
      const data = dateMap.get(record.date);
      if (data) {
        if (record.status === 'present') data.present++;
        else if (record.status === 'absent') data.absent++;
        else if (record.status === 'late') data.late++;
        else if (record.status === 'leave') data.leave++;
      }
    });

    return Array.from(dateMap.values());
  };

  // بيانات توزيع الحالات
  const getStatusDistribution = () => {
    if (!stats) return [];

    return [
      { name: 'حاضر', value: stats.presentRecords - stats.lateRecords, color: '#10b981' },
      { name: 'متأخر', value: stats.lateRecords, color: '#f59e0b' },
      { name: 'غائب', value: stats.absentRecords, color: '#ef4444' },
      { name: 'إجازة', value: stats.leaveRecords, color: '#3b82f6' },
    ].filter(item => item.value > 0);
  };

  // بيانات الحضور حسب القسم
  const getDepartmentData = () => {
    if (!reportData) return [];

    const deptMap = new Map();
    
    reportData.employees.forEach((emp: any) => {
      if (!deptMap.has(emp.department)) {
        deptMap.set(emp.department, {
          department: emp.department,
          present: 0,
          absent: 0,
          total: 0
        });
      }
    });

    reportData.attendance.forEach((record: any) => {
      const employee = reportData.employees.find((e: any) => e.id === record.employeeId);
      if (employee) {
        const data = deptMap.get(employee.department);
        if (data) {
          data.total++;
          if (record.status === 'present' || record.status === 'late') {
            data.present++;
          } else if (record.status === 'absent') {
            data.absent++;
          }
        }
      }
    });

    return Array.from(deptMap.values());
  };

  // بيانات الموظفين الأكثر التزاماً
  const getTopEmployees = () => {
    if (!reportData) return [];

    const empMap = new Map();

    reportData.attendance.forEach((record: any) => {
      if (!empMap.has(record.employeeId)) {
        empMap.set(record.employeeId, {
          id: record.employeeId,
          name: record.employeeName,
          present: 0,
          late: 0,
          absent: 0,
          total: 0,
          workHours: 0
        });
      }
      const data = empMap.get(record.employeeId);
      data.total++;
      if (record.status === 'present') data.present++;
      else if (record.status === 'late') { data.present++; data.late++; }
      else if (record.status === 'absent') data.absent++;
      data.workHours += record.workHours || 0;
    });

    return Array.from(empMap.values())
      .map((emp: any) => ({
        ...emp,
        rate: emp.total > 0 ? ((emp.present / emp.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))
      .slice(0, 5);
  };

  const departments = ['التقنية', 'المالية', 'التسويق', 'المبيعات', 'الموارد البشرية', 'الإدارة'];

  const handleExportPDF = () => {
    alert('سيتم تصدير التقرير إلى PDF');
  };

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير والإحصائيات</h1>
          <p className="text-gray-500 mt-1">تقارير شاملة عن الحضور والأداء</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Printer size={18} />
            <span>طباعة</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            <span>تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
              <option value="custom">مخصص</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الأقسام</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm">إجمالي الموظفين</p>
                  <p className="text-4xl font-bold mt-1">{stats.totalEmployees}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white border-opacity-20">
                <p className="text-sm text-blue-100">خلال {stats.totalDays} يوم</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm">نسبة الحضور</p>
                  <p className="text-4xl font-bold mt-1">{stats.attendanceRate}%</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white border-opacity-20">
                <p className="text-sm text-green-100">{stats.presentRecords} من {stats.totalRecords} سجل</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm">نسبة التأخير</p>
                  <p className="text-4xl font-bold mt-1">{stats.lateRate}%</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white border-opacity-20">
                <p className="text-sm text-orange-100">{stats.lateRecords} حالة تأخير</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <TrendingDown size={24} />
                </div>
                <div className="text-right">
                  <p className="text-red-100 text-sm">نسبة الغياب</p>
                  <p className="text-4xl font-bold mt-1">{stats.absentRate}%</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white border-opacity-20">
                <p className="text-sm text-red-100">{stats.absentRecords} حالة غياب</p>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">إجمالي ساعات العمل</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalWorkHours}</p>
                  <p className="text-sm text-gray-500 mt-1">ساعة عمل</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">متوسط ساعات العمل</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgWorkHours}</p>
                  <p className="text-sm text-gray-500 mt-1">ساعة / يوم</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">حالات الإجازة</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.leaveRecords}</p>
                  <p className="text-sm text-gray-500 mt-1">إجازة مسجلة</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Attendance Trend */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">اتجاه الحضور اليومي</h2>
                <BarChart3 className="text-gray-400" size={20} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getDailyAttendanceData()}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="present" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorPresent)"
                    name="حاضر"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="absent" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorAbsent)"
                    name="غائب"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">توزيع حالات الحضور</h2>
                <PieChartIcon className="text-gray-400" size={20} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getStatusDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getStatusDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Department Performance */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">أداء الأقسام</h2>
                <BarChart3 className="text-gray-400" size={20} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getDepartmentData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="present" fill="#10b981" name="حاضر" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" name="غائب" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Employees */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">الموظفون الأكثر التزاماً</h2>
                <TrendingUp className="text-gray-400" size={20} />
              </div>
              <div className="space-y-4">
                {getTopEmployees().map((emp: any, index) => (
                  <div key={emp.id} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-sm text-gray-500">{emp.present} يوم حضور</p>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-green-600">{emp.rate}%</p>
                      <p className="text-xs text-gray-500">نسبة الحضور</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">ملخص التقرير</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p className="mb-1">• الفترة: من {new Date(startDate).toLocaleDateString('ar-SA')} إلى {new Date(endDate).toLocaleDateString('ar-SA')}</p>
                    <p className="mb-1">• عدد الأيام: {stats.totalDays} يوم</p>
                    <p className="mb-1">• إجمالي الموظفين: {stats.totalEmployees} موظف</p>
                    <p className="mb-1">• إجمالي السجلات: {stats.totalRecords} سجل</p>
                  </div>
                  <div>
                    <p className="mb-1">• معدل الحضور: {stats.attendanceRate}% ({stats.presentRecords} سجل)</p>
                    <p className="mb-1">• معدل الغياب: {stats.absentRate}% ({stats.absentRecords} سجل)</p>
                    <p className="mb-1">• معدل التأخير: {stats.lateRate}% ({stats.lateRecords} حالة)</p>
                    <p className="mb-1">• متوسط ساعات العمل: {stats.avgWorkHours} ساعة/يوم</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}