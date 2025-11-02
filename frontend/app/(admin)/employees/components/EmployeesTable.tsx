"use client";
import {
  Eye,
  Edit,
  Trash2,
  Users,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Employee } from "../../../../types/employee";

type Props = {
  employees: Employee[];
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
};

export default function EmployeesTable({
  employees,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-5 text-right text-sm font-bold text-gray-800">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-blue-600" />
                  رقم الموظف
                </div>
              </th>
              <th className="px-6 py-5 text-right text-sm font-bold text-gray-800">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  الاسم
                </div>
              </th>
              <th className="px-6 py-5 text-right text-sm font-bold text-gray-800">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-blue-600" />
                  القسم
                </div>
              </th>
              <th className="px-6 py-5 text-right text-sm font-bold text-gray-800">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-600" />
                  المنصب
                </div>
              </th>
              <th className="px-6 py-5 text-right text-sm font-bold text-gray-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-blue-600" />
                  الحالة
                </div>
              </th>
              <th className="px-6 py-5 text-center text-sm font-bold text-gray-800">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Users className="text-gray-400" size={40} />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-1">
                      لا توجد بيانات موظفين
                    </p>
                    <p className="text-sm text-gray-500">
                      قم بإضافة موظف جديد للبدء
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr
                  key={`${emp.id || emp.matri || "row"}-${index}`}
                  className="hover:bg-blue-50/50 transition-all duration-200 group"
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                      {emp.matri || emp.id || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {emp.name?.charAt(0) || "؟"}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {emp.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 bg-purple-50 px-3 py-1.5 rounded-lg font-medium">
                      <Building2 size={14} className="text-purple-600" />
                      {emp.department?.name || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 bg-green-50 px-3 py-1.5 rounded-lg font-medium">
                      <Briefcase size={14} className="text-green-600" />
                      {emp.fonc || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {emp.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 shadow-sm">
                        <CheckCircle2 size={14} className="text-green-600" />
                        نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 shadow-sm">
                        <XCircle size={14} className="text-red-600" />
                        غير نشط
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onView(emp)}
                        className="p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                        title="عرض التفاصيل"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(emp)}
                        className="p-2.5 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                        title="تعديل"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(emp)}
                        className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
