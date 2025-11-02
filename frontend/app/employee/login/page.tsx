"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [matri, setmatri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

 const handleLogin = async (e: FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  setLoading(true);

  try {
    const res = await fetch("http://127.0.0.1:8000/api/employee/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matri: matri }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "رمز الموظف غير صحيح");
    } else {
      setSuccess("تم تسجيل الدخول بنجاح ✅");

      // ✅ حفظ بيانات الموظف في localStorage
      localStorage.setItem("employee", JSON.stringify(data.employee));
      localStorage.setItem("matri", data.employee.matri);
      localStorage.setItem("name", data.employee.name);

      // ✅ توجيه إلى صفحة تسجيل الحضور
      setTimeout(() => {
        router.push("/employee/attendance");
      }, 1000);
    }
  } catch (err) {
    setError("حدث خطأ في الاتصال بالخادم");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-700">
          👷‍♂️ تسجيل دخول الموظف
        </h1>
        <p className="text-gray-500 mb-6">
          الرجاء إدخال الرمز الوظيفي (Matricule)
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="أدخل الرمز الوظيفي"
            value={matri}
            onChange={(e) => setmatri(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>
        </form>

        {error && <p className="text-red-600 mt-4">{error}</p>}
        {success && <p className="text-green-600 mt-4">{success}</p>}
      </div>
    </div>
  );
}
