"use client";
import { MoreVertical } from "lucide-react";

/* 📊 بطاقات الإحصائيات */
export default function StatsCards({ stats }: any) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((s: any, i: number) => {
        const Icon = s.icon;
        return (
          <div key={i} className="bg-white rounded-xl p-6 border hover:shadow-md">
            <div className="flex justify-between mb-4">
              <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center`}>
                <Icon className={s.color} size={24} />
              </div>
              <MoreVertical className="text-gray-400" size={20} />
            </div>
            <h3 className="text-sm text-gray-600 mb-2">{s.title}</h3>
            <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            <p className="text-sm text-gray-500 mt-2">{s.subtitle}</p>
          </div>
        );
      })}
    </section>
  );
}