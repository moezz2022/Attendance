"use client";
import { MoreVertical } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChartsSectionProps {
  attendanceData: {
    line: { day: string; present: number; absent: number; late: number }[];
    departments: { name: string; value: number; color?: string }[];
  };
}

/* 🎨 دالة لتوليد ألوان تلقائية للأقسام */
function getRandomColor(index: number) {
  const palette = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];
  return palette[index % palette.length];
}

/* 📊 المكون الرئيسي */
export default function ChartsSection({ attendanceData }: ChartsSectionProps) {
  const departments = attendanceData.departments || [];
  const lineData = attendanceData.line || [];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* الرسم الخطي لإحصائيات الحضور */}
      <ChartBox title="إحصائيات الحضور - آخر 7 أيام">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", borderRadius: "8px" }}
            />
            <Line
              type="monotone"
              dataKey="present"
              stroke="#10b981"
              strokeWidth={3}
              name="حاضر"
            />
            <Line
              type="monotone"
              dataKey="absent"
              stroke="#ef4444"
              strokeWidth={3}
              name="غائب"
            />
            <Line
              type="monotone"
              dataKey="late"
              stroke="#f59e0b"
              strokeWidth={3}
              name="متأخر"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

      {/* الرسم الدائري لتوزيع الموظفين حسب الأقسام */}
      <ChartBox title="توزيع الموظفين حسب الأقسام">
        {departments.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceData.departments || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                >
                  {(attendanceData.departments || []).map((dept, i) => (
                    <Cell key={i} fill={dept.color || getRandomColor(i)} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(v: number) => `${v} موظف`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* وسيلة الإيضاح (Legend) */}
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              {attendanceData.departments.map((dept, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dept.color || getRandomColor(i) }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {dept.name}: {dept.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 mt-10">
            لا توجد بيانات للأقسام
          </p>
        )}
      </ChartBox>
    </section>
  );
}

/* 🧩 مكون عام لإطار الرسم البياني */
function ChartBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <MoreVertical className="text-gray-400" size={20} />
      </div>
      {children}
    </div>
  );
}
