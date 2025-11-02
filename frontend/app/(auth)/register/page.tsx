"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* 🧩 أدوات مساعدة */
/* -------------------------------------------------------------------------- */

// جلب Cookie حسب الاسم
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() || null : null;
}

// تنفيذ طلب API مع دعم CSRF Token والتحقق من الأخطاء
async function safeFetch(url: string, options: RequestInit) {
  const xsrfToken = getCookie("XSRF-TOKEN");

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": decodeURIComponent(xsrfToken) } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`خطأ ${res.status}: ${res.statusText}`);
    return null;
  }

  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.message || "حدث خطأ من السيرفر");
    return data;
  } catch {
    if (text.includes("<html")) {
      throw new Error("الخادم أرجع صفحة HTML بدلاً من JSON");
    }
    throw new Error("استجابة غير صالحة من الخادم");
  }
}

/* -------------------------------------------------------------------------- */
/* 🧠 مكون صفحة التسجيل */
/* -------------------------------------------------------------------------- */

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [circles, setCircles] = useState<
    { width: number; height: number; top: string; left: string; animateX: number; animateY: number }[]
  >([]);

  /* 🌈 إنشاء دوائر الخلفية */
  useEffect(() => {
    setCircles(
      [...Array(6)].map((_, i) => ({
        width: 100 + i * 50,
        height: 100 + i * 50,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animateX: Math.random() * 50 - 25,
        animateY: Math.random() * 50 - 25,
      }))
    );
  }, []);

  /* ✍️ معالجة تغيير الحقول */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* 🚀 تنفيذ التسجيل */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password_confirmation) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ طلب CSRF Cookie من Laravel Sanctum
      await fetch("http://localhost:8000/sanctum/csrf-cookie", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      // 2️⃣ إرسال البيانات إلى API
      const data = await safeFetch("http://localhost:8000/api/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (data.token) localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🖥️ واجهة المستخدم */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-indigo-500 relative overflow-hidden p-4">
      {/* 🌌 الخلفية المتحركة */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        {circles.map((c, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white opacity-10"
            style={{
              width: c.width,
              height: c.height,
              top: c.top,
              left: c.left,
              filter: "blur(50px)",
            }}
            animate={{
              x: [0, c.animateX, 0],
              y: [0, c.animateY, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* 🧾 نموذج التسجيل */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8 w-full max-w-md border border-white/40 mx-4"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 🧍 الاسم */}
          <InputField
            label="الاسم الكامل"
            name="name"
            type="text"
            icon={<UserPlus className="text-gray-400" size={18} />}
            value={form.name}
            onChange={handleChange}
            placeholder="أدخل اسمك"
          />

          {/* ✉️ البريد الإلكتروني */}
          <InputField
            label="البريد الإلكتروني"
            name="email"
            type="email"
            icon={<Mail className="text-gray-400" size={18} />}
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
          />

          {/* 🔒 كلمة المرور */}
          <InputField
            label="كلمة المرور"
            name="password"
            type="password"
            icon={<Lock className="text-gray-400" size={18} />}
            value={form.password}
            onChange={handleChange}
            placeholder="********"
          />

          {/* 🔐 تأكيد كلمة المرور */}
          <InputField
            label="تأكيد كلمة المرور"
            name="password_confirmation"
            type="password"
            icon={<Lock className="text-gray-400" size={18} />}
            value={form.password_confirmation}
            onChange={handleChange}
            placeholder="أعد كتابة كلمة المرور"
          />

          {/* ⚠️ رسالة الخطأ */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-center text-red-600 text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* 🔘 زر التسجيل */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`w-full py-2.5 rounded-xl text-white font-semibold transition ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "جارٍ إنشاء الحساب..." : "تسجيل"}
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          لديك حساب بالفعل؟{" "}
          <a href="/login" className="text-blue-600 font-semibold hover:underline">
            تسجيل الدخول
          </a>
        </p>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🧱 مكوّن حقل إدخال عام لإعادة الاستخدام */
/* -------------------------------------------------------------------------- */

interface InputProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

function InputField({ label, name, type, value, onChange, placeholder, icon }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-xl px-10 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        />
        <div className="absolute left-3 top-2.5">{icon}</div>
      </div>
    </div>
  );
}
