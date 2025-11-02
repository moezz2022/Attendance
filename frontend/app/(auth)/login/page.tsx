"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, UserCircle, Lock, LogIn } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  /* 🔹 الحالة العامة */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [circles, setCircles] = useState<any[]>([]);

  /* 🎨 إنشاء الخلفية المتحركة */
  useEffect(() => {
    const newCircles = Array.from({ length: 6 }).map((_, i) => ({
      width: 100 + i * 50,
      height: 100 + i * 50,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animateX: Math.random() * 50 - 25,
      animateY: Math.random() * 50 - 25,
    }));
    setCircles(newCircles);
  }, []);

  /* 🔐 دالة تسجيل الدخول */
  const handleSubmit = async () => {
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // جلب CSRF Cookie من Laravel Sanctum
      await fetch(`${baseURL}/sanctum/csrf-cookie`, {
        method: "GET",
        credentials: "include",
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // إرسال بيانات تسجيل الدخول
      const res = await api.post("/login", { email, password });

      // حفظ التوكن في LocalStorage
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      // توجيه المستخدم بعد النجاح
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Login error:", err);
      let message = "فشل تسجيل الدخول، يرجى التحقق من بياناتك";

      if (err.response) {
        switch (err.response.status) {
          case 404:
            message = "خطأ في الاتصال بالخادم. تحقق من رابط API";
            break;
          case 419:
            message = "انتهت صلاحية الجلسة، يرجى المحاولة مرة أخرى";
            break;
          case 422:
            message = "بيانات غير صحيحة";
            break;
          case 401:
            message = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
            break;
          default:
            message = err.response.data?.message || message;
        }
      } else if (err.request) {
        message = "خطأ في الاتصال بالخادم";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* 👁️‍🗨️ تبديل إظهار كلمة المرور */
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  /* ⌨️ دعم الضغط على Enter */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  /* 🧩 واجهة المستخدم */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-indigo-500 relative overflow-hidden">
      {/* 🔵 خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        {circles.map((c, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white opacity-10"
            style={{
              width: `${c.width}px`,
              height: `${c.height}px`,
              top: c.top,
              left: c.left,
              filter: "blur(50px)",
            }}
            animate={{
              x: [0, c.animateX, 0],
              y: [0, c.animateY, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-500/20 to-indigo-600/20 z-0" />

      {/* 🪪 بطاقة تسجيل الدخول */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8 w-full max-w-md border border-white/40 mx-4"
      >
        {/* 🏷️ العنوان */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            مرحباً بك 👋
          </motion.h1>
          <motion.p
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            قم بتسجيل الدخول للوصول إلى نظام إدارة الحضور
          </motion.p>
        </div>

        {/* ⚠️ عرض الأخطاء */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🧾 الحقول */}
        <div className="space-y-5">
          {/* البريد الإلكتروني */}
          <Field
            label="البريد الإلكتروني"
            icon={<UserCircle size={20} />}
            type="email"
            value={email}
            onChange={setEmail}
            onKeyPress={handleKeyPress}
          />

          {/* كلمة المرور */}
          <PasswordField
            showPassword={showPassword}
            togglePassword={togglePasswordVisibility}
            value={password}
            onChange={setPassword}
            onKeyPress={handleKeyPress}
          />

          {/* تذكرني + نسيت كلمة المرور */}
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
              />
              تذكرني
            </label>

            <button
              type="button"
              onClick={() =>
                alert("سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني")
              }
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          {/* زر تسجيل الدخول */}
          <LoginButton loading={loading} onClick={handleSubmit} />
        </div>

        {/* رابط التسجيل */}
        <p className="text-center text-sm text-gray-600 mt-6">
          ليس لديك حساب بعد؟{" "}
          <a href="/register" className="text-blue-600 font-semibold hover:underline">
            تسجيل
          </a>
        </p>
      </motion.div>
    </div>
  );
}

/* 🧩 مكوّن حقل إدخال عام */
function Field({ label, icon, type, value, onChange, onKeyPress }: any) {
  return (
    <div>
      <label className="block text-gray-700 mb-2 font-medium">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
          {icon}
        </div>
        <input
          type={type}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white/80"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
        />
      </div>
    </div>
  );
}

/* 🔐 مكوّن حقل كلمة المرور */
function PasswordField({ showPassword, togglePassword, value, onChange, onKeyPress }: any) {
  return (
    <div>
      <label className="block text-gray-700 mb-2 font-medium">كلمة المرور</label>
      <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
          <Lock size={20} />
        </div>
        <input
          type={showPassword ? "text" : "password"}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white/80"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
        />
        <button
          type="button"
          onClick={togglePassword}
          className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}

/* 🚀 مكوّن زر الدخول */
function LoginButton({ loading, onClick }: any) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      className={`w-full ${
        loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
      } text-white rounded-xl py-3 mt-6 font-semibold shadow-lg transition-all duration-300 flex items-center justify-center`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 
3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          جارٍ تسجيل الدخول...
        </>
      ) : (
        <>
          تسجيل الدخول
          <LogIn size={18} className="mr-2" />
        </>
      )}
    </motion.button>
  );
}
