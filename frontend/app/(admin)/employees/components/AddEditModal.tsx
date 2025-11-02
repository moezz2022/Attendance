"use client";
import { X, User, Badge, Building, Clock } from "lucide-react";
import { useState } from "react";
import { PartialEmployee } from "../../../../types/employee";

type Department = {
  id: number;
  name: string;
};

type Props = {
  open: boolean;
  isEditing: boolean;
  formData: PartialEmployee;
  departments: Department[];
  onChange: (data: PartialEmployee) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
};

export default function AddEditModal({
  open,
  isEditing,
  formData,
  departments,
  onChange,
  onCancel,
  onSubmit,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg relative border border-gray-100 transform transition-all">
        <button
          onClick={onCancel}
          aria-label="إغلاق النافذة"
          className="absolute top-5 left-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {isEditing ? "تعديل موظف" : "إضافة موظف جديد"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing
                  ? "قم بتحديث بيانات الموظف"
                  : "أدخل معلومات الموظف الجديد"}
              </p>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          {/* الاسم الكامل */}
          <div className="group">
            <label
              htmlFor="name"
              className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2"
            >
              <User size={16} className="text-blue-600" />
              الاسم الكامل <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              placeholder="مثال: عبدالقادر أحمد"
              value={formData.name || ""}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none bg-gray-50 focus:bg-white"
              required
            />
          </div>

          {/* رقم الموظف / الهوية */}
          <div className="group">
            <label
              htmlFor="matri"
              className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2"
            >
              <Badge size={16} className="text-blue-600" />
              رقم الموظف / الهوية
            </label>
            <input
              id="matri"
              placeholder="مثال: 4012 أو رقم الهوية الوطنية"
              value={formData.matri || ""}
              onChange={(e) => onChange({ ...formData, matri: e.target.value })}
              className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none bg-gray-50 focus:bg-white"
            />
          </div>

          {/* الرتبة / المنصب */}
          <div className="group">
            <label
              htmlFor="fonc"
              className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2"
            >
              <Badge size={16} className="text-blue-600" />
              الرتبة / المنصب الوظيفي
            </label>
            <input
              id="fonc"
              placeholder="مثال: إداري، أستاذ، مهندس، محاسب..."
              value={formData.fonc || ""}
              onChange={(e) => onChange({ ...formData, fonc: e.target.value })}
              className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none bg-gray-50 focus:bg-white"
            />
          </div>

          {/* القسم */}
          <div className="group">
            <label
              htmlFor="department"
              className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2"
            >
              <Building size={16} className="text-blue-600" />
              القسم أو الإدارة
            </label>
            <select
              id="department"
              value={formData.department_id ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange({
                  ...formData,
                  department_id: val ? Number(val) : undefined,
                });
              }}
              required
              className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none bg-gray-50 focus:bg-white cursor-pointer"
            >
              <option value="">اختر القسم أو الإدارة</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>

          {/* حالة الموظف */}
          <div className="group">
            <label
              htmlFor="status"
              className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2"
            >
              <Clock size={16} className="text-blue-600" />
              حالة الموظف <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={formData.status || ""}
              onChange={(e) =>
                onChange({
                  ...formData,
                  status: e.target.value as "active" | "inactive",
                })
              }
              className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none bg-gray-50 focus:bg-white cursor-pointer"
              required
            >
              <option value="">اختر الحالة</option>
              <option value="active">✓ نشط</option>
              <option value="inactive">✕ غير نشط</option>
            </select>
          </div>

          {/* أزرار الإلغاء والحفظ */}
          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-200 bg-white rounded-xl hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-bold transition-all duration-200 shadow-sm"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105 ${
                loading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-blue-700 hover:to-blue-800 shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
              }`}
              disabled={loading}
            >
              {loading
                ? "جارٍ المعالجة..."
                : isEditing
                ? "💾 حفظ التعديلات"
                : "➕ إضافة الموظف"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
