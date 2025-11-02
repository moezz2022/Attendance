"use client";

import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  CalendarCheck,
  Fingerprint,
  UserX,
  Clock,
  UserCheck,
} from "lucide-react";
import {
  fetchUser,
  fetchDashboardStats,
  fetchDepartmentStats,
} from "@/lib/api";

import Header from "@/app/components/dashboard/Header";
import QuickActions from "@/app/components/dashboard/QuickActions";
import StatsCards from "@/app/components/dashboard/StatsCards";
import ChartsSection from "@/app/components/dashboard/ChartsSection";

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const [statsData, setStatsData] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });

  const [attendanceData, setAttendanceData] = useState({
    line: [],
    departments: [],
  });

  // 🎨 توليد ألوان للرسم الدائري
  const randomColor = (index: number) => {
    const colors = [
      "#10b981",
      "#ef4444",
      "#f59e0b",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
      "#6366f1",
      "#22c55e",
    ];
    return colors[index % colors.length];
  };

  // ⏰ تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 👤 جلب بيانات المستخدم
  useEffect(() => {
    const getUser = async () => {
      try {
        const data = await fetchUser();
        setUser(data);
      } catch (err) {
        console.error("❌ خطأ في جلب بيانات المستخدم:", err);
      }
    };
    getUser();
  }, []);

  // 📊 جلب بيانات الحضور (Line Chart)
  useEffect(() => {
    const getStats = async () => {
      setLoading(true);
      try {
        const data = await fetchDashboardStats();

        if (!data || typeof data !== "object") {
          console.warn("❌ بيانات غير صالحة من API");
          setLoading(false);
          return;
        }

        setStatsData({
          totalEmployees: data.total_employees || 0,
          presentToday: data.present_today || 0,
          absentToday: data.absent_today || 0,
          lateToday: data.late_today || 0,
        });

        // توليد آخر 7 أيام
        const today = new Date();
        const lineData = Array.from({ length: 7 }).map((_, i) => {
          const date = new Date();
          date.setDate(today.getDate() - (6 - i));
          const formattedDate = date.toLocaleDateString("ar-DZ", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          return {
            day: formattedDate,
            present: data.last7Days?.[i]?.present ?? 0,
            absent: data.last7Days?.[i]?.absent ?? 0,
            late: data.last7Days?.[i]?.late ?? 0,
          };
        });

        setAttendanceData((prev) => ({ ...prev, line: lineData }));
      } catch (err) {
        console.error("❌ خطأ في جلب الإحصائيات:", err);
        alert("حدث خطأ أثناء تحميل الإحصائيات. حاول لاحقًا.");
      } finally {
        setLoading(false);
      }
    };
    getStats();
  }, []);

  // 📊 جلب بيانات الأقسام (Pie Chart)
  useEffect(() => {
    const getDepartments = async () => {
      setLoading(true);
      try {
        const data = await fetchDepartmentStats();

        if (!data || typeof data !== "object") {
          console.warn("❌ بيانات غير صالحة من API");
          setLoading(false);
          return;
        }

        const pieData =
          data.departments?.map((dep: any, i: number) => ({
            name: dep.name,
            value: dep.value,
            color: randomColor(i),
          })) || [];

        setAttendanceData((prev) => ({ ...prev, departments: pieData }));
      } catch (err) {
        console.error("❌ خطأ أثناء جلب بيانات الأقسام:", err);
        alert("حدث خطأ أثناء تحميل بيانات الأقسام. حاول لاحقًا.");
      } finally {
        setLoading(false);
      }
    };
    getDepartments();
  }, []);

  // ⚡ الإجراءات السريعة
  const quickActions = [
    {
      title: "تسجيل حضور",
      icon: Fingerprint,
      color: "bg-blue-500",
      href: "/attendance",
    },
    {
      title: "طلب إجازة",
      icon: CalendarCheck,
      color: "bg-green-500",
      href: "/leaves",
    },
    {
      title: "التقارير",
      icon: FileText,
      color: "bg-purple-500",
      href: "/reports",
    },
    {
      title: "الملف الشخصي",
      icon: Users,
      color: "bg-orange-500",
      href: "/settings",
    },
  ];

  // 📊 البطاقات
  const stats = [
    {
      title: "إجمالي الموظفين",
      value: statsData.totalEmployees,
      subtitle: "عدد الموظفين المسجلين",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "الحضور اليوم",
      value: statsData.presentToday,
      subtitle: "عدد الحاضرين اليوم",
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "التأخر اليوم",
      value: statsData.lateToday,
      subtitle: "عدد المتأخرين",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "الغياب اليوم",
      value: statsData.absentToday,
      subtitle: "عدد الغائبين",
      icon: UserX,
      color: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("ar-DZ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("ar-DZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-3 text-gray-600">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <Header
        user={user}
        time={currentTime}
        formatTime={formatTime}
        formatDate={formatDate}
      />
      <QuickActions actions={quickActions} />
      <StatsCards stats={stats} />
      <ChartsSection attendanceData={attendanceData} />
    </div>
  );
}
