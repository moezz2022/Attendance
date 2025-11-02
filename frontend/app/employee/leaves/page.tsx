"use client";

import { useState, useEffect } from "react";
import { Calendar, Loader2, Send, FileText, LogOut, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface LeaveRequest {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  total_days: number;
  reason?: string;
}

export default function LeavePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [form, setForm] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [matri, setMatri] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  // 🔹 جلب بيانات الموظف من localStorage
  useEffect(() => {
    const storedMatri = localStorage.getItem("matri");
    const storedName = localStorage.getItem("name");

    if (!storedMatri) {
      router.push("/employee/login");
      return;
    }

    setMatri(storedMatri);
    if (storedName) setEmployeeName(storedName);
  }, [router]);

  // 🔹 تحميل الطلبات السابقة
  useEffect(() => {
    if (!matri) return;

    fetch(`http://127.0.0.1:8000/api/leave/my-requests?matri=${matri}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) setRequests(data.data);
      })
      .catch((err) => console.error("❌ خطأ في جلب الطلبات:", err));
  }, [matri]);

  // 🔹 حساب عدد الأيام
  const calculateDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // 🔹 إرسال طلب إجازة جديد
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!matri) {
      setError("الرجاء تسجيل الدخول أولاً");
      return;
    }

    // التحقق من التواريخ
    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matri: matri, // ✅ تم تصحيح الاسم
          leave_type: form.leave_type,
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason || "",
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccess("✅ تم إرسال الطلب بنجاح");
        // إعادة تعيين النموذج
        setForm({ leave_type: "", start_date: "", end_date: "", reason: "" });
        // تحديث قائمة الطلبات
        if (data.data) {
          setRequests((prev) => [data.data, ...prev]);
        }
        // إخفاء رسالة النجاح بعد 3 ثواني
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "حدث خطأ أثناء الإرسال");
      }
    } catch (error) {
      console.error(error);
      setError("⚠️ فشل الاتصال بالخادم. تأكد من أن Laravel يعمل على المنفذ 8000.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 تسجيل الخروج
  const handleLogout = () => {
      localStorage.removeItem("matri");
      localStorage.removeItem("name");
      router.push("/employee/login");
  };

  // 🔹 ترجمة أنواع الإجازات
  const getLeaveTypeName = (type: string) => {
    const types: Record<string, string> = {
      annual: "إجازة سنوية",
      sick: "إجازة مرضية",
      emergency: "إجازة طارئة",
      unpaid: "إجازة بدون راتب",
      maternity: "إجازة أمومة",
    };
    return types[type] || type;
  };

  // 🔹 ألوان الحالات
  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "قيد المراجعة",
      approved: "مقبولة ✓",
      rejected: "مرفوضة ✗",
    };
    return texts[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4" style={{ direction: "rtl" }}>
      <div className="max-w-5xl mx-auto">
        {/* ✅ رأس الصفحة */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Calendar className="text-white" size={28} />
                </div>
                طلب إجازة جديدة
              </h1>
              <p className="text-gray-600 mt-2 mr-14">
                مرحبًا، <strong className="text-blue-600">{employeeName || "موظف"}</strong>
                {" — "}رقم التعريف: <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-700">{matri}</span>
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
            >
              <LogOut size={18} /> تسجيل الخروج
            </button>
          </div>
        </div>

        {/* ✅ رسائل النجاح والخطأ */}
        {success && (
          <div className="bg-green-50 border-r-4 border-green-500 p-4 rounded-lg mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* ✅ نموذج إرسال الطلب */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg space-y-5">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={24} className="text-blue-600" />
            تفاصيل الإجازة
          </h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">نوع الإجازة *</label>
            <select
              required
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-all"
              value={form.leave_type}
              onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            >
              <option value="">-- اختر نوع الإجازة --</option>
              <option value="annual">إجازة سنوية</option>
              <option value="sick">إجازة مرضية</option>
              <option value="emergency">إجازة طارئة</option>
              <option value="unpaid">إجازة بدون راتب</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">من تاريخ *</label>
              <input
                required
                type="date"
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-all"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">إلى تاريخ *</label>
              <input
                required
                type="date"
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-all"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          {form.start_date && form.end_date && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-blue-900 font-semibold">
                📅 عدد الأيام: <span className="text-2xl">{calculateDays()}</span> يوم
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">سبب الإجازة (اختياري)</label>
            <textarea
              rows={4}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:outline-none transition-all resize-none"
              placeholder="اكتب سبب الإجازة هنا..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 flex justify-center items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send size={20} />
                إرسال الطلب
              </>
            )}
          </button>
        </form>

        {/* ✅ عرض الطلبات السابقة */}
        <div className="bg-white p-8 rounded-2xl shadow-lg mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="text-white" size={22} />
            </div>
            طلباتي السابقة
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
                  <th className="p-4 border-b-2 border-gray-200 text-right font-bold text-gray-700">النوع</th>
                  <th className="p-4 border-b-2 border-gray-200 text-right font-bold text-gray-700">من تاريخ</th>
                  <th className="p-4 border-b-2 border-gray-200 text-right font-bold text-gray-700">إلى تاريخ</th>
                  <th className="p-4 border-b-2 border-gray-200 text-right font-bold text-gray-700">الأيام</th>
                  <th className="p-4 border-b-2 border-gray-200 text-right font-bold text-gray-700">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border-b border-gray-200 p-4 font-medium text-gray-800">
                        {getLeaveTypeName(r.leave_type)}
                      </td>
                      <td className="border-b border-gray-200 p-4 text-gray-600">
                        {new Date(r.start_date).toLocaleDateString("ar-DZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="border-b border-gray-200 p-4 text-gray-600">
                        {new Date(r.end_date).toLocaleDateString("ar-DZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="border-b border-gray-200 p-4 font-bold text-gray-800">
                        {r.total_days}
                      </td>
                      <td className="border-b border-gray-200 p-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(r.status)}`}>
                          {getStatusText(r.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <FileText size={48} className="mb-3 opacity-50" />
                        <p className="text-lg font-medium">لا توجد طلبات سابقة</p>
                        <p className="text-sm">قم بإضافة طلب إجازة جديد</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}