// app/attendance-report/page.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Calendar,
  Download,
  Printer,
  FileText,
  User,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_morning: string | null;
  check_out_morning: string | null;
  check_in_evening: string | null;
  check_out_evening: string | null;
  work_hours: number;
  status: "present" | "late" | "left_early" | "absent";
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  matri?: string;
  department?: string;
  position?: string;
}

export default function AttendanceReportPage() {
  const [matri, setMatri] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  // تحميل التوكن والموظفين عند البداية
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("authToken");
      setAuthToken(token);

      // تعيين التواريخ الافتراضية
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(lastDay.toISOString().split("T")[0]);
    }
  }, []);

  // تحميل الموظفين بعد الحصول على التوكن
  useEffect(() => {
    if (authToken) {
      loadEmployees();
    }
  }, [authToken]);

  const getAuthHeaders = useCallback(
    () => ({
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    }),
    [authToken]
  );

  const loadEmployees = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${apiBaseUrl}/employees`, {
        headers: headers,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success" && Array.isArray(data.employees)) {
        setEmployees(data.employees);
        localStorage.setItem("employees", JSON.stringify(data.employees));
      } else if (Array.isArray(data)) {
        // في حالة أن الـ API يرجع مصفوفة مباشرة
        setEmployees(data);
        localStorage.setItem("employees", JSON.stringify(data));
      } else {
        throw new Error("بيانات غير صحيحة من الخادم");
      }
    } catch (err) {
      console.warn("⚠️ فشل الاتصال بالخادم، استخدام النسخة المحلية");

      const saved = localStorage.getItem("employees");
      if (saved) {
        try {
          const parsedEmployees = JSON.parse(saved);
          setEmployees(parsedEmployees);
        } catch (parseErr) {
          console.error("❌ خطأ في قراءة البيانات المحلية:", parseErr);
        }
      } else {
        console.warn("⚠️ لا توجد بيانات محلية محفوظة");
      }
    }
  };

  const fetchReport = async () => {
    if (!matri || !startDate || !endDate) {
      setError("الرجاء إدخال رقم الموظف والفترة الزمنية");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `${apiBaseUrl}/attendance/report?matri=${matri}&from=${startDate}&to=${endDate}`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ خطأ من الخادم:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // التعامل مع تنسيقات مختلفة من الاستجابة
      if (data.status === "success" && data.employee && data.records) {
        setEmployee({
          id: data.employee.id || "",
          name: data.employee.name || data.employee.full_name || "موظف",
          matri: data.employee.matri || data.employee.registration_number || "",
          department:
            data.employee.department_name || data.employee.department || "قسم",
          position: data.employee.position || "",
        });
        setRecords(Array.isArray(data.records) ? data.records : []);
      } else {
        console.warn("⚠️ تنسيق غير متوقع:", data);
        setError(data.message || "تنسيق البيانات غير صحيح");
      }
    } catch (err: any) {
      console.error("❌ خطأ في API:", err);
      setError(`فشل الاتصال بالخادم: ${err.message}`);

      // عرض رسالة مفصلة للمطور
      console.error("📍 تحقق من:", [
        "1. Laravel backend يعمل على http://localhost:8000",
        "2. Route: GET /api/attendance/report موجود",
        "3. Method: getEmployeeAttendance موجود في AttendanceController",
        "4. التوكن صحيح وموجود",
        `5. رقم الموظف ${matri} موجود في قاعدة البيانات`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    const headers = [
      "التاريخ",
      "دخول صباحي",
      "خروج صباحي",
      "دخول مسائي",
      "خروج مسائي",
      "الساعات",
      "الحالة",
    ];
    const csvData = records.map((rec) => [
      rec.date,
      rec.check_in_morning || "-",
      rec.check_out_morning || "-",
      rec.check_in_evening || "-",
      rec.check_out_evening || "-",
      rec.work_hours,
      rec.status === "late"
        ? "متأخر"
        : rec.status === "left_early"
        ? "خرج مبكراً"
        : rec.status === "absent"
        ? "غائب"
        : "حاضر",
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-report-${matri}-${startDate}-to-${endDate}.csv`;
    link.click();
  };

  // 🔧 تحسين حساب الإحصائيات
  const stats = {
    totalDays: records.length,
    presentDays: records.filter((r) => r.status === "present").length,
    lateDays: records.filter((r) => r.status === "late").length,
    absentDays: records.filter((r) => r.status === "absent").length,
    totalHours: records.reduce((sum, r) => sum + (r.work_hours || 0), 0),
    avgHours:
      records.length > 0
        ? (
            records.reduce((sum, r) => sum + (r.work_hours || 0), 0) /
            records.length
          ).toFixed(1)
        : "0",
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <CheckCircle size={14} />
            حاضر
          </span>
        );
      case "late":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            <AlertCircle size={14} />
            متأخر
          </span>
        );
      case "left_early":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
            <AlertCircle size={14} />
            خرج مبكراً
          </span>
        );
      case "absent":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            <XCircle size={14} />
            غائب
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            تقرير الحضور التفصيلي
          </h1>
          <p className="text-gray-500 mt-1">عرض وتحليل سجلات حضور الموظفين</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline ml-2" size={16} />
              اختر موظف من القائمة
            </label>
            <select
              value={matri}
              onChange={(e) => setMatri(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- اختر موظف --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.matri || emp.id}>
                  {emp.name} ({emp.matri}){" "}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {employees.length === 0
                ? "⚠️ لا توجد بيانات موظفين"
                : `✓ ${employees.length} موظف متاح`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline ml-2" size={16} />
              أو أدخل رقم الموظف يدوياً
            </label>
            <input
              type="text"
              value={matri}
              onChange={(e) => setMatri(e.target.value)}
              placeholder="مثال: EMP001 أو رقم التسجيل"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              يمكنك إدخال رقم التسجيل أو معرف الموظف
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline ml-2" size={16} />
              من تاريخ
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline ml-2" size={16} />
              إلى تاريخ
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>جاري التحميل...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>عرض التقرير</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <p className="text-yellow-900 font-semibold">تنبيه</p>
              <p className="text-yellow-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* 🖨️ منطقة الطباعة */}
      <div ref={printRef}>
        {/* Employee Info */}
        {employee && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white print:bg-white print:text-black print:border print:border-gray-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center  text-purple-600 text-2xl font-bold print:bg-gray-200 print:text-gray-800">
                  {employee.name ? employee.name.charAt(0).toUpperCase() : "M"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {employee.name || "موظف"}
                  </h2>
                  <p className="text-blue-100 print:text-gray-600">
                    رقم الموظف: {employee.matri || employee.id || "غير محدد"}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="font-semibold text-center">
                  {employee.position || "موظف"}
                </p>
                <p className="font-semibold">{employee.department || "قسم"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {records.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-blue-600" size={20} />
                <p className="text-xs text-gray-600">إجمالي الأيام</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalDays}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-600" size={20} />
                <p className="text-xs text-gray-600">أيام الحضور</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.presentDays}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-yellow-600" size={20} />
                <p className="text-xs text-gray-600">أيام التأخير</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.lateDays}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="text-red-600" size={20} />
                <p className="text-xs text-gray-600">أيام الغياب</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {stats.absentDays}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-purple-600" size={20} />
                <p className="text-xs text-gray-600">إجمالي الساعات</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalHours.toFixed(1)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-orange-600" size={20} />
                <p className="text-xs text-gray-600">متوسط الساعات</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {stats.avgHours}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {records.length > 0 && (
          <div className="flex gap-3 mt-6 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer size={18} />
              <span>طباعة</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              <span>تصدير CSV</span>
            </button>
          </div>
        )}

        {/* Report Table */}
        {records.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      دخول صباحي
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      خروج صباحي
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      دخول مسائي
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      خروج مسائي
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      الساعات
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                      الحالة
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {records.map((record, index) => (
                    <tr
                      key={record.id || `${record.date}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString("ar-DZ", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {record.check_in_morning
                          ? new Date(
                              record.check_in_morning
                            ).toLocaleTimeString("ar-DZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {record.check_out_morning
                          ? new Date(
                              record.check_out_morning
                            ).toLocaleTimeString("ar-DZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {record.check_in_evening
                          ? new Date(
                              record.check_in_evening
                            ).toLocaleTimeString("ar-DZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {record.check_out_evening
                          ? new Date(
                              record.check_out_evening
                            ).toLocaleTimeString("ar-DZ", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {record.work_hours.toFixed(1)} ساعة
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(record.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* صف الإجمالي */}
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-right font-semibold text-gray-800"
                    >
                      الإجمالي
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {stats.totalHours.toFixed(2)} ساعة
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {records.length} يوم
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* No Data */}
      {records.length === 0 && !loading && employee && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <FileText className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            لا توجد سجلات
          </h3>
          <p className="text-gray-500">
            لا توجد سجلات حضور في هذه الفترة الزمنية
          </p>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print\:bg-white {
            background-color: white !important;
          }
          .print\:text-black {
            color: black !important;
          }
          .print\:text-gray-600 {
            color: #4b5563 !important;
          }
          .print\:text-gray-800 {
            color: #1f2937 !important;
          }
          .print\:border {
            border: 1px solid #d1d5db !important;
          }
          .print\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\:bg-gray-200 {
            background-color: #e5e7eb !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
