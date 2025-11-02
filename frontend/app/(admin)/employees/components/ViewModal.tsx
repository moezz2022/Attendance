"use client";
import { X, User, Briefcase, Building2, Award, CheckCircle2, XCircle } from "lucide-react";
import { Employee } from "../../../../types/employee";

type Props = {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
};

export default function ViewModal({ open, employee, onClose }: Props) {
  if (!open || !employee) return null;

  const isActive = employee.status === "active";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative border border-gray-100 transform transition-all animate-fadeIn">
        <button 
          onClick={onClose} 
          className="absolute top-5 left-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
        >
          <X size={20} />
        </button>
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 mb-4">
            <User size={36} strokeWidth={2} />
          </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{employee.name}</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold">
            {isActive ? (
              <>
                <CheckCircle2 size={18} className="text-green-600" />
                <span className="text-green-700 bg-green-50 px-3 py-1 rounded-full">نشط</span>
              </>
            ) : (
              <>
                <XCircle size={18} className="text-red-600" />
                <span className="text-red-700 bg-red-50 px-3 py-1 rounded-full">غير نشط</span>
              </>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-4 mb-6">
          {/* Employee Number */}
          {employee.matri && (
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:shadow-md transition-all">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Award size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">رمز الموظف / الهوية</p>
                <p className="text-base font-bold text-gray-900">{employee.matri}</p>
              </div>
            </div>
          )}

          {/* Position */}
          {employee.fonc && (
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 hover:shadow-md transition-all">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Briefcase size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">الرتبة / المنصب الوظيفي</p>
                <p className="text-base font-bold text-gray-900">{employee.fonc}</p>
              </div>
            </div>
          )}

          {/* Department */}
          {employee.department_id && (
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200 hover:shadow-md transition-all">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Building2 size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">القسم أو الإدارة</p>
                <p className="text-base font-bold text-gray-900">{employee.department_id}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Button */}
        <div className="pt-6 border-t border-gray-100">
          <button 
            onClick={onClose} 
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}