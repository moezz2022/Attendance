"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AttendanceType = "morning" | "evening";
type AttendanceAction = "check_in" | "check_out";

async function getCurrentPosition(): Promise<{
  latitude: number;
  longitude: number;
}> {
  if (!navigator.geolocation) {
    throw new Error("المتصفح لا يدعم تحديد الموقع الجغرافي.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => reject(new Error("فشل في تحديد الموقع. الرجاء تفعيل GPS."))
    );
  });
}

export default function AttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [employee, setEmployee] = useState<{
    matri: string;
    name: string;
  } | null>(null);

  // ✅ تحميل بيانات الموظف من localStorage
  useEffect(() => {
    const stored = localStorage.getItem("employee");
    if (stored) {
      setEmployee(JSON.parse(stored));
    } else {
      router.push("/employee/login");
    }
  }, [router]);
  // ✅ زر تسجيل الحضور
  const handleCheck = async (
    type: AttendanceType,
    action: AttendanceAction
  ) => {
    if (!employee?.matri) {
      setError("لم يتم العثور على رمز الموظف. الرجاء تسجيل الدخول مجددًا.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const position = await getCurrentPosition();

      const res = await fetch("http://127.0.0.1:8000/api/employee/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          matri: employee.matri,
          type,
          action,
          latitude: position.latitude,
          longitude: position.longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "حدث خطأ أثناء تسجيل الحضور.");
      } else {
        setMessage(data.message);
      }
    } catch (err: any) {
      setError(err.message || "فشل في تحديد الموقع أو الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem("employee");
    router.push("/employee/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-4">
      <div
        className="bg-white shadow-2xl rounded-3xl p-6 w-full max-w-sm relative overflow-hidden"
        style={{ direction: "rtl" }}
      >
        {/* 🔹 زر تسجيل الخروج */}
        <div className="flex justify-center mb-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all"
          >
            <span>🔒</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* 🔹 عرض اسم الموظف */}
        <div className="mb-3 text-center">
          <p className="text-lg font-semibold text-gray-700">
            👋 مرحبًا، {employee?.name || "موظف غير معروف"}
          </p>
          <p className="text-sm text-gray-500">
            رمز الموظف: {employee?.matri || "غير متوفر"}
          </p>
        </div>

        {/* أيقونة البصمة */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 mb-6">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-indigo-200 rounded-full"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-2 border-indigo-300 rounded-full"></div>
              </div>
              <div
                className={`relative w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl ${
                  loading ? "animate-pulse" : ""
                }`}
              >
                <svg
                  className="w-16 h-16 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C9.24 2 7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v3H9V7c0-1.66 1.34-3 3-3zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">يمكنك تسجيل الحضور الآن</p>
          </div>
        </div>

        {/* أزرار الحضور */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={loading}
              onClick={() => handleCheck("morning", "check_in")}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 text-sm"
            >
              دخول صباحي
            </button>

            <button
              disabled={loading}
              onClick={() => handleCheck("morning", "check_out")}
              className="bg-gradient-to-r from-red-500 to-rose-500 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 text-sm"
            >
              خروج صباحي
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={loading}
              onClick={() => handleCheck("evening", "check_in")}
              className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 text-sm"
            >
              دخول مسائي
            </button>

            <button
              disabled={loading}
              onClick={() => handleCheck("evening", "check_out")}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 text-sm"
            >
              خروج مسائي
            </button>
          </div>

          {/* 🔹 رابط صفحة الإجازات */}
          <Link href="/employee/leaves" className="w-full">
            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 text-white py-4 rounded-2xl font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              <span className="text-xl">📅</span>
              <span>طلب إجازة</span>
            </button>
          </Link>
        </div>

        {/* رسائل الحالة */}
        {loading && (
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-blue-600 font-semibold">⏳ جاري المعالجة...</p>
          </div>
        )}
        {message && (
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-green-600 font-semibold">{message}</p>
          </div>
        )}
        {error && (
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
