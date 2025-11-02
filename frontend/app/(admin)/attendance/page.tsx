"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  Calendar,
  Search,
  Download,
  UserCheck,
  UserX,
  Timer,
  CheckCircle,
  XCircle,
  AlertCircle,
  Fingerprint,
  LogIn,
  LogOut,
  Users,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  RefreshCw,
  FileDown,
  Wifi,
  WifiOff,
} from "lucide-react";

interface Employee {
  id: string;
  matri: string;
  name: string;
  position?: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employeeName: string;
  employeeMatri: string;
  date: string;
  check_in_morning?: string;
  check_out_morning?: string;
  check_in_evening?: string;
  check_out_evening?: string;
  status: "present" | "absent" | "late" | "leave" | "left_early";
  status_morning?: string;
  status_evening?: string;
  workHours?: number;
  notes?: string;
}

interface Toast {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
  description?: string;
}

interface LoadingStates {
  employees: boolean;
  attendance: boolean;
  stats: boolean;
  checkIn: boolean;
  checkOut: boolean;
  export: boolean;
}

interface CacheData<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 2 * 60 * 1000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

function calculateWorkHours(record: any): number {
  const calculatePeriod = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    const [inH, inM] = checkIn.split(":").map(Number);
    const [outH, outM] = checkOut.split(":").map(Number);
    if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;
    return outH * 60 + outM - (inH * 60 + inM);
  };

  let totalMinutes = 0;

  if (record.check_in_morning && record.check_out_morning) {
    totalMinutes += calculatePeriod(
      record.check_in_morning,
      record.check_out_morning
    );
  }

  if (record.check_in_evening && record.check_out_evening) {
    totalMinutes += calculatePeriod(
      record.check_in_evening,
      record.check_out_evening
    );
  }

  return totalMinutes > 0 ? Math.round((totalMinutes / 60) * 10) / 10 : 0;
}

function determineCheckOutType(
  record: AttendanceRecord
): "morning" | "evening" {
  if (record.check_in_evening && !record.check_out_evening) {
    return "evening";
  }

  if (record.check_in_morning && !record.check_out_morning) {
    return "morning";
  }

  const currentHour = new Date().getHours();
  return currentHour >= 13 ? "evening" : "morning";
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const [selectedDate, setSelectedDate] = useState(localDate);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiBaseUrl] = useState("http://localhost:8000/api");
  const [checkType, setCheckType] = useState<"morning" | "evening">("morning");
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    employees: false,
    attendance: false,
    stats: false,
    checkIn: false,
    checkOut: false,
    export: false,
  });

  const [cache, setCache] = useState<{
    employees: CacheData<Employee[]>;
    attendance: CacheData<AttendanceRecord[]>;
  }>({
    employees: { data: [], timestamp: 0 },
    attendance: { data: [], timestamp: 0 },
  });

  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    lateCount: 0,
    leaveCount: 0,
    absentCount: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token =
        window.localStorage.getItem("authToken") ||
        window.localStorage.getItem("token");

      if (token && !window.localStorage.getItem("authToken")) {
        window.localStorage.setItem("authToken", token);
      }

      setAuthToken(token);
      setIsAuthReady(true);

      if (!token) {
        setApiError("⚠️ لم يتم العثور على رمز المصادقة");
      }
    }
  }, []);

  const showToast = useCallback(
    (type: Toast["type"], message: string, description?: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message, description }]);
      
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5000);
      
      return () => clearTimeout(timer);
    },
    []
  );

  const getAuthHeaders = useCallback(
    () => ({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken || ""}`,
    }),
    [authToken]
  );

  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  const fetchWithRetry = useCallback(async (
    url: string,
    options: any,
    retries = RETRY_ATTEMPTS
  ): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication error: ${response.status}`);
        }
        
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        if (i === retries - 1) {
          throw lastError;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (i === retries - 1) {
          throw lastError;
        }
        
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * (i + 1))
        );
      }
    }
    
    throw lastError || new Error(`Failed after ${retries} attempts`);
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    if (!authToken) return;

    setLoadingStates((prev) => ({ ...prev, stats: true }));

    try {
      const url = `${apiBaseUrl}/dashboard/stats`;
      const res = await fetchWithRetry(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();

      setDashboardStats({
        totalEmployees: data.total_employees || 0,
        presentCount: data.present_today || 0,
        lateCount: data.late_today || 0,
        leaveCount: data.leave_today || 0,
        absentCount: data.absent_today || 0,
      });
    } catch (error) {
      console.error("خطأ في جلب الإحصائيات:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, stats: false }));
    }
  }, [apiBaseUrl, authToken, fetchWithRetry]);

  const fetchEmployees = useCallback(async () => {
    if (!authToken) throw new Error("رمز المصادقة غير موجود");

    if (isCacheValid(cache.employees.timestamp)) {
      setEmployees(cache.employees.data);
      return true;
    }

    setLoadingStates((prev) => ({ ...prev, employees: true }));

    try {
      const empRes = await fetchWithRetry(`${apiBaseUrl}/employees`, {
        headers: getAuthHeaders(),
      });

      const empData = await empRes.json();
      const employeesData = Array.isArray(empData) ? empData : [];

      setEmployees(employeesData);
      setCache((prev) => ({
        ...prev,
        employees: { data: employeesData, timestamp: Date.now() },
      }));
      setIsConnected(true);
      return true;
    } catch (err) {
      console.error("خطأ في جلب الموظفين:", err);
      throw err;
    } finally {
      setLoadingStates((prev) => ({ ...prev, employees: false }));
    }
  }, [apiBaseUrl, getAuthHeaders, authToken, cache.employees.timestamp, isCacheValid, fetchWithRetry]);

  const fetchAttendance = useCallback(async () => {
    if (!authToken) throw new Error("رمز المصادقة غير موجود");

    if (isCacheValid(cache.attendance.timestamp)) {
      setAttendanceRecords(cache.attendance.data);
      return true;
    }

    setLoadingStates((prev) => ({ ...prev, attendance: true }));

    try {
      const attRes = await fetchWithRetry(`${apiBaseUrl}/attendance/all`, {
        headers: getAuthHeaders(),
      });

      const attData = await attRes.json();
      const records = Array.isArray(attData)
        ? attData
        : attData.data || attData.records || [];

      const formatted = records.map((rec: any) => {
        const empName = rec.employee?.name || "غير معروف";
        const empMatri = rec.employee?.matri || "";

        return {
          id: rec.id || `temp_${Date.now()}_${Math.random()}`,
          employee_id: rec.employee_id || empMatri,
          employeeName: empName,
          employeeMatri: empMatri,
          date: rec.date,
          check_in_morning: rec.check_in_morning,
          check_out_morning: rec.check_out_morning,
          check_in_evening: rec.check_in_evening,
          check_out_evening: rec.check_out_evening,
          status_morning: rec.status_morning,
          status_evening: rec.status_evening,
          status: rec.status || "present",
          workHours: calculateWorkHours(rec),
          notes: rec.notes || rec.note || "",
        };
      });

      setAttendanceRecords(formatted);
      setCache((prev) => ({
        ...prev,
        attendance: { data: formatted, timestamp: Date.now() },
      }));
      setIsConnected(true);
      return true;
    } catch (err) {
      throw err;
    } finally {
      setLoadingStates((prev) => ({ ...prev, attendance: false }));
    }
  }, [apiBaseUrl, getAuthHeaders, authToken, cache.attendance.timestamp, isCacheValid, fetchWithRetry]);

  const fetchData = useCallback(async (showSuccessToast = false) => {
    if (!authToken) {
      setApiError("رمز المصادقة غير موجود - يرجى تسجيل الدخول");
      setIsConnected(false);
      return;
    }

    setApiError(null);

    try {
      await Promise.all([
        fetchEmployees(),
        fetchAttendance(),
        fetchDashboardStats(),
      ]);

      // فقط إذا كان showSuccessToast = true وهذا هو التحميل الأول
      if (showSuccessToast && !hasInitialLoad) {
        showToast("success", "تم تحميل البيانات بنجاح");
        setHasInitialLoad(true);
      } else if (showSuccessToast && hasInitialLoad) {
        // إذا كان تحديث يدوي من الزر
        showToast("success", "تم تحديث البيانات بنجاح");
      }
    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
      const errorMessage =
        err instanceof Error ? err.message : "فشل الاتصال بالخادم";

      if (
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("Unauthenticated") ||
        errorMessage.includes("Authentication error")
      ) {
        setApiError("🔒 خطأ في المصادقة - رمز المصادقة غير صحيح");
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        setApiError("🌐 فشل الاتصال بالخادم - تأكد من تشغيل الخادم");
      } else {
        setApiError(errorMessage);
      }
      setIsConnected(false);
    }
  }, [authToken, showToast, fetchEmployees, fetchAttendance, fetchDashboardStats, hasInitialLoad]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast(
        "success",
        "تم استعادة الاتصال بالإنترنت",
        "جاري تحديث البيانات..."
      );
      if (authToken && isAuthReady) {
        fetchData(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        "warning",
        "تم فقدان الاتصال بالإنترنت",
        "العمل في وضع عدم الاتصال"
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [authToken, isAuthReady, showToast, fetchData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthReady && authToken && !hasInitialLoad) {
      // التحميل الأول فقط
      fetchData(true);

      const interval = setInterval(() => {
        // التحديثات الدورية بدون toast
        fetchData(false);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    } else if (isAuthReady && authToken && hasInitialLoad) {
      // إذا كان التحميل الأول قد تم، فقط نشغل التحديثات الدورية
      const interval = setInterval(() => {
        fetchData(false);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthReady, authToken, hasInitialLoad, fetchData]);

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 5, 0);

    const timeout = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      const localToday = new Date(
        Date.now() - new Date().getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0];

      setSelectedDate(localToday);

      if (authToken && isAuthReady) {
        fetchData(false);
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [authToken, isAuthReady, fetchData]);

  const debouncedSearchQuery = useMemo(() => searchQuery, [searchQuery]);

  const filteredRecords = useMemo(() => {
    let filtered = [...attendanceRecords];

    if (selectedDate) {
      filtered = filtered.filter((r) => {
        const recordDate = r.date?.split("T")[0] || r.date;
        return recordDate === selectedDate;
      });
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(query) ||
          r.employee_id?.toLowerCase().includes(query) ||
          r.employeeMatri?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    return filtered;
  }, [attendanceRecords, selectedDate, debouncedSearchQuery, filterStatus]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("ar-DZ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  const canPerformAction = useCallback((action: string): boolean => {
    if (!authToken) {
      showToast("error", "خطأ", "يرجى تسجيل الدخول أولاً");
      return false;
    }

    if (!isConnected) {
      showToast("error", "خطأ", "غير متصل بالخادم");
      return false;
    }

    if (!isOnline) {
      showToast("warning", "تحذير", "لا يوجد اتصال بالإنترنت");
      return false;
    }

    return true;
  }, [authToken, isConnected, isOnline, showToast]);

  const handleCheckIn = async () => {
    if (!canPerformAction("checkIn")) return;

    if (!selectedEmployee) {
      showToast("error", "خطأ", "الرجاء اختيار موظف");
      return;
    }

    if (!navigator.geolocation) {
      showToast("error", "خطأ", "المتصفح لا يدعم تحديد الموقع");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, checkIn: true }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('انتهت مهلة الحصول على الموقع. جرب مرة أخرى أو تأكد من تفعيل خدمات الموقع.'));
        }, 15000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          }, 
          (error) => {
            clearTimeout(timeoutId);
            
            let errorMessage = 'فشل الحصول على الموقع الجغرافي';
            switch (error.code) {
              case 1:
                errorMessage = 'تم رفض إذن الموقع. يرجى السماح بالوصول إلى الموقع من إعدادات المتصفح.';
                break;
              case 2:
                errorMessage = 'الموقع غير متوفر. تأكد من تفعيل خدمات الموقع على جهازك.';
                break;
              case 3:
                errorMessage = 'انتهت مهلة الحصول على الموقع. جرب مرة أخرى.';
                break;
            }
            
            reject(new Error(errorMessage));
          }, 
          {
            timeout: 15000,
            enableHighAccuracy: false,
            maximumAge: 30000
          }
        );
      });

      const { latitude, longitude } = position.coords;

      const res = await fetch(`${apiBaseUrl}/attendance/record`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          matri: selectedEmployee,
          type: checkType,
          action: "check_in",
          latitude,
          longitude,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ 
          message: `خطأ في الاتصال بالخادم (${res.status})` 
        }));
        throw new Error(data.message || `HTTP Error: ${res.status}`);
      }

      const data = await res.json();

      setShowCheckInModal(false);
      setSelectedEmployee("");
      showToast("success", "تم بنجاح", translateMessage(data.message || "تم تسجيل الحضور بنجاح"));

      setCache((prev) => ({
        ...prev,
        attendance: { data: [], timestamp: 0 },
      }));
      await fetchAttendance();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير معروف';
      showToast("error", "فشل التسجيل", errorMessage);
    } finally {
      setLoadingStates((prev) => ({ ...prev, checkIn: false }));
    }
  };

  function canCheckOut(record: AttendanceRecord): boolean {
    const canCheckOutMorning =
      record.check_in_morning && !record.check_out_morning;
    const canCheckOutEvening =
      record.check_in_evening && !record.check_out_evening;

    return !!(canCheckOutMorning || canCheckOutEvening);
  }

  const handleCheckOut = async (record: AttendanceRecord) => {
    if (!canPerformAction("checkOut")) return;

    if (!canCheckOut(record)) {
      showToast("error", "خطأ", "لا يمكن تسجيل الانصراف - لا يوجد دخول نشط");
      return;
    }

    if (!navigator.geolocation) {
      showToast("error", "خطأ", "المتصفح لا يدعم تحديد الموقع");
      return;
    }

    const type = determineCheckOutType(record);
    const typeLabel = type === "morning" ? "الصباحي" : "المسائي";

    if (
      !window.confirm(
        `هل تريد تسجيل الانصراف ${typeLabel} للموظف ${record.employeeName}؟`
      )
    ) {
      return;
    }

    setLoadingStates((prev) => ({ ...prev, checkOut: true }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('انتهت مهلة الحصول على الموقع. جرب مرة أخرى أو تأكد من تفعيل خدمات الموقع.'));
        }, 15000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (error) => {
            clearTimeout(timeoutId);
            
            let errorMessage = 'فشل الحصول على الموقع الجغرافي';
            switch (error.code) {
              case 1:
                errorMessage = 'تم رفض إذن الموقع. يرجى السماح بالوصول إلى الموقع من إعدادات المتصفح.';
                break;
              case 2:
                errorMessage = 'الموقع غير متوفر. تأكد من تفعيل خدمات الموقع على جهازك.';
                break;
              case 3:
                errorMessage = 'انتهت مهلة الحصول على الموقع. جرب مرة أخرى.';
                break;
            }
            
            reject(new Error(errorMessage));
          },
          {
            timeout: 15000,
            enableHighAccuracy: false,
            maximumAge: 30000
          }
        );
      });

      const { latitude, longitude } = position.coords;

      const res = await fetch(`${apiBaseUrl}/attendance/record`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          matri: record.employeeMatri,
          type,
          action: "check_out",
          latitude,
          longitude,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ 
          message: `خطأ في الاتصال بالخادم (${res.status})` 
        }));
        throw new Error(data.message || `HTTP Error: ${res.status}`);
      }

      const data = await res.json();

      showToast(
        "success",
        `✅ تم تسجيل الانصراف ${typeLabel} بنجاح`,
        translateMessage(data.message || "تم التسجيل بنجاح")
      );

      setCache((prev) => ({
        ...prev,
        attendance: { data: [], timestamp: 0 },
      }));
      await fetchAttendance();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير معروف';
      showToast("error", "فشل التسجيل", errorMessage);
    } finally {
      setLoadingStates((prev) => ({ ...prev, checkOut: false }));
    }
  };

  const exportToCSV = () => {
    setLoadingStates((prev) => ({ ...prev, export: true }));

    try {
      const headers = [
        "رقم الموظف",
        "الاسم",
        "التاريخ",
        "حضور صباحي",
        "انصراف صباحي",
        "حضور مسائي",
        "انصراف مسائي",
        "ساعات العمل",
        "الحالة",
        "ملاحظات",
      ];

      const csvContent = [
        headers.join(","),
        ...filteredRecords.map((record) =>
          [
            record.employeeMatri,
            record.employeeName,
            record.date,
            record.check_in_morning || "-",
            record.check_out_morning || "-",
            record.check_in_evening || "-",
            record.check_out_evening || "-",
            record.workHours || 0,
            record.status,
            record.notes || "-",
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `attendance-${selectedDate || "all"}.csv`;
      link.click();

      showToast(
        "success",
        "تم التصدير بنجاح",
        `تم تصدير ${filteredRecords.length} سجل`
      );
    } catch (error) {
      showToast("error", "فشل التصدير", "حدث خطأ أثناء تصدير البيانات");
    } finally {
      setLoadingStates((prev) => ({ ...prev, export: false }));
    }
  };

  function getStatusBadge(status: string | undefined | null) {
    if (!status) return <span className="text-gray-400">—</span>;
    
    const clean = String(status).replace(/_(morning|evening)$/i, "").toLowerCase();

    const statusMap: Record<string, { label: string; class: string }> = {
      present: { label: "حاضر", class: "bg-green-100 text-green-700" },
      late: { label: "متأخر", class: "bg-orange-100 text-orange-700" },
      left_early: { label: "خرج مبكرًا", class: "bg-yellow-100 text-yellow-700" },
      absent: { label: "غائب", class: "bg-red-100 text-red-700" },
      leave: { label: "إجازة", class: "bg-blue-100 text-blue-700" },
    };

    const statusInfo = statusMap[clean] || { 
      label: clean, 
      class: "bg-gray-100 text-gray-600" 
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.class}`}
      >
        {statusInfo.label}
      </span>
    );
  }

  function translateMessage(text: string): string {
    if (!text) return "";
    return text
      .replace(/\bmorning\b/gi, "الصباحي")
      .replace(/\bevening\b/gi, "المسائي")
      .replace(/\bcheck_in\b/gi, "الدخول")
      .replace(/\bcheck_out\b/gi, "الانصراف")
      .replace(/\blate\b/gi, "متأخر")
      .replace(/\bpresent\b/gi, "حاضر")
      .replace(/\bleave\b/gi, "إجازة")
      .replace(/\babsent\b/gi, "غائب")
      .replace(/\bleft_early\b/gi, "خرج مبكر")
      .replace(/already checked in/gi, "تم تسجيل الدخول مسبقًا")
      .replace(/already checked out/gi, "تم تسجيل الانصراف مسبقًا")
      .replace(/no active session/gi, "لا توجد جلسة نشطة")
      .trim();
  }

  const isLoading =
    loadingStates.employees ||
    loadingStates.attendance ||
    loadingStates.stats ||
    loadingStates.checkIn ||
    loadingStates.checkOut;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الحضور</h1>
          <p className="text-gray-500 mt-1">تسجيل ومتابعة حضور الموظفين</p>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg">
              <WifiOff size={18} />
              <span className="text-sm font-medium">غير متصل</span>
            </div>
          )}
          {isOnline && isConnected && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
              <Wifi size={18} />
              <span className="text-sm font-medium">متصل</span>
            </div>
          )}
          <button
            onClick={() => {
              // التحديث اليدوي يظهر رسالة مختلفة
              if (hasInitialLoad) {
                fetchData(true); // سيظهر "تم تحديث البيانات بنجاح"
              } else {
                fetchData(true); // سيظهر "تم تحميل البيانات بنجاح"
              }
            }}
            disabled={isLoading || !authToken}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            <span>تحديث</span>
          </button>
          <div className="text-left">
            <div className="text-3xl font-bold text-blue-600 font-mono">
              {formatTime(currentTime)}
            </div>
            <p className="text-sm text-gray-500">
              {currentTime.toLocaleDateString("ar-DZ", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
      </div>

      {!authToken && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle
            className="text-yellow-600 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">
              تحذير: رمز المصادقة غير موجود
            </h3>
            <p className="text-yellow-700 text-sm mt-1">
              لتشغيل النظام، افتح Console واكتب:
            </p>
            <code className="block mt-2 bg-yellow-100 p-2 rounded text-xs">
              localStorage.setItem('authToken', 'YOUR_API_TOKEN_HERE')
            </code>
            <p className="text-yellow-600 text-xs mt-2">ثم قم بتحديث الصفحة</p>
          </div>
        </div>
      )}

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle
            className="text-red-600 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">خطأ في الاتصال</h3>
            <p className="text-red-700 text-sm mt-1">{apiError}</p>
            {apiError.includes("المصادقة") && typeof window !== "undefined" && (
              <button
                onClick={() => {
                  window.localStorage.removeItem("authToken");
                  window.location.reload();
                }}
                className="mt-2 text-xs text-red-600 underline hover:text-red-800"
              >
                مسح رمز المصادقة وإعادة المحاولة
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setShowCheckInModal(true)}
          disabled={!isConnected || isLoading || !authToken}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h3 className="text-xl font-bold mb-2">تسجيل حضور</h3>
              <p className="text-green-100">سجل حضور موظف جديد</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Fingerprint size={32} />
            </div>
          </div>
        </button>

        <button
          onClick={exportToCSV}
          disabled={filteredRecords.length === 0 || loadingStates.export}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h3 className="text-xl font-bold mb-2">تصدير البيانات</h3>
              <p className="text-blue-100">تصدير إلى ملف CSV</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              {loadingStates.export ? (
                <Loader2 size={32} className="animate-spin" />
              ) : (
                <FileDown size={32} />
              )}
            </div>
          </div>
        </button>

        <a
          href="/attendance-records"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 group block"
        >
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h3 className="text-xl font-bold mb-2">التقارير</h3>
              <p className="text-purple-100">عرض التقارير التفصيلية</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download size={32} />
            </div>
          </div>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">الحاضرون</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {dashboardStats.presentCount}
              </p>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <TrendingUp size={14} />
                <span>من {dashboardStats.totalEmployees} موظف</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">الغائبون</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {dashboardStats.absentCount}
              </p>
              <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <TrendingDown size={14} />
                <span>غياب اليوم</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">المتأخرون</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {dashboardStats.lateCount}
              </p>
              <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                <AlertCircle size={14} />
                <span>تأخر اليوم</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Timer className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">في إجازة</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {dashboardStats.leaveCount}
              </p>
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <Calendar size={14} />
                <span>إجازات اليوم</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="البحث عن موظف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Calendar
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="present">حاضر</option>
            <option value="absent">غائب</option>
            <option value="late">متأخر</option>
            <option value="leave">إجازة</option>
          </select>

          <button
            onClick={() => {
              const localToday = new Date(
                Date.now() - new Date().getTimezoneOffset() * 60000
              )
                .toISOString()
                .split("T")[0];

              setSelectedDate(localToday);
              setSearchQuery("");
              setFilterStatus("all");
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            إعادة تعيين
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {(loadingStates.attendance || loadingStates.employees) && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={20} />
            <span className="text-blue-700 text-sm font-medium">
              جاري تحميل البيانات...
            </span>
          </div>
        )}

        {isConnected && !loadingStates.attendance && (
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                📊 إجمالي السجلات: <strong>{attendanceRecords.length}</strong> |
                معروض: <strong>{filteredRecords.length}</strong> | التاريخ:{" "}
                <strong>{selectedDate || "الكل"}</strong>
              </span>
              <span className="text-green-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                متصل بالخادم
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  رقم الموظف
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  اسم الموظف
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  التاريخ
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  حضور صباحي
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  انصراف صباحي
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  حضور مسائي
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  انصراف مسائي
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  ساعات العمل
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  ملاحظات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!isConnected ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-red-500"
                  >
                    <AlertCircle className="mx-auto mb-2" size={48} />
                    <p className="font-medium">غير متصل بالخادم</p>
                    <p className="text-sm mt-2">
                      تحقق من رمز المصادقة والاتصال بالإنترنت
                    </p>
                  </td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <Clock className="mx-auto mb-2 text-gray-400" size={48} />
                    <p className="font-medium">
                      لا توجد سجلات حضور في قاعدة البيانات
                    </p>
                    <p className="text-sm mt-2">ابدأ بتسجيل حضور موظف جديد</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <Search className="mx-auto mb-2 text-gray-400" size={48} />
                    <p className="font-medium">لا توجد نتائج للبحث الحالي</p>
                    <p className="text-sm mt-2">
                      {selectedDate
                        ? `لا توجد سجلات في ${selectedDate}`
                        : "جرب تغيير معايير البحث"}
                    </p>
                    <button
                      onClick={() => {
                        const localToday = new Date(
                          Date.now() - new Date().getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .split("T")[0];

                        setSelectedDate(localToday);
                        setSearchQuery("");
                        setFilterStatus("all");
                      }}
                      className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      إعادة تعيين الفلاتر
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {record.employeeMatri || record.employee_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {record.employeeName[0] || "؟"}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {record.employeeName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(record.date).toLocaleDateString("ar-DZ")}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {record.check_in_morning ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <LogIn size={16} />
                          {record.check_in_morning}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {record.check_out_morning ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <LogOut size={16} />
                          {record.check_out_morning}
                        </div>
                      ) : record.check_in_morning ? (
                        <button
                          onClick={() => handleCheckOut(record)}
                          disabled={loadingStates.checkOut}
                          className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
                        >
                          تسجيل انصراف
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {record.check_in_evening ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <LogIn size={16} />
                          {record.check_in_evening}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {record.check_out_evening ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <LogOut size={16} />
                          {record.check_out_evening}
                        </div>
                      ) : record.check_in_evening ? (
                        <button
                          onClick={() => handleCheckOut(record)}
                          disabled={loadingStates.checkOut}
                          className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
                          title="تسجيل انصراف مسائي"
                        >
                          تسجيل انصراف
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {record.workHours && record.workHours > 0 ? (
                        <span className="text-blue-600">
                          {record.workHours.toFixed(1)} ساعة
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 text-xs">صباح:</span>
                          {record.status_morning ? (
                            getStatusBadge(record.status_morning)
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 text-xs">مساء:</span>
                          {record.status_evening ? (
                            getStatusBadge(record.status_evening)
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mt-1 border-t pt-1 border-gray-200">
                          <span className="text-gray-700 text-xs font-medium">
                            اليوم:
                          </span>
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {record.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Fingerprint size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">تسجيل حضور</h2>
                  <p className="text-green-100 text-sm">
                    اختر الموظف لتسجيل حضوره
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر الموظف
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                >
                  <option value="">-- اختر موظف --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.matri}>
                      {emp.name} ({emp.matri})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفترة
                </label>
                <select
                  value={checkType}
                  onChange={(e) =>
                    setCheckType(e.target.value as "morning" | "evening")
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                >
                  <option value="morning">الفترة الصباحية</option>
                  <option value="evening">الفترة المسائية</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">الوقت الحالي:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatTime(currentTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">التاريخ:</span>
                  <span className="font-medium text-gray-900">
                    {currentTime.toLocaleDateString("ar-DZ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 rounded-b-xl">
              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  setSelectedEmployee("");
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCheckIn}
                disabled={loadingStates.checkIn || !selectedEmployee}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingStates.checkIn ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                <span>تسجيل الحضور</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 left-6 w-96 max-w-full space-y-3 z-50 pointer-events-none">
        <div className="space-y-3 pointer-events-auto">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-lg shadow-lg p-4 transition-all duration-300 animate-slideIn ${
                toast.type === "success"
                  ? "bg-green-500 text-white"
                  : toast.type === "error"
                  ? "bg-red-500 text-white"
                  : toast.type === "warning"
                  ? "bg-yellow-500 text-gray-900"
                  : "bg-blue-500 text-white"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === "success" && <CheckCircle size={22} />}
                {toast.type === "error" && <XCircle size={22} />}
                {toast.type === "warning" && <AlertCircle size={22} />}
                {toast.type === "info" && <AlertCircle size={22} />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{toast.message}</p>
                {toast.description && (
                  <p className="text-sm opacity-90 mt-1">{toast.description}</p>
                )}
              </div>

              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className={`flex-shrink-0 ${
                  toast.type === "warning"
                    ? "text-gray-700 hover:text-gray-900"
                    : "text-white/80 hover:text-white"
                } transition-colors`}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}