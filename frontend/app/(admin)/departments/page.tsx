"use client";
import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

interface Department {
  id: number;
  name: string;
  manager_id?: number | null;
  manager?: { id: number; name: string };
  employees?: any[];
  employeeCount: number;
  created_at: string;
}

export default function DepartmentsPage() {
  const API_URL = "http://127.0.0.1:8000/api/departments";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>(
    []
  );

  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", manager_id: "" });
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>(
    []
  );
  // ✅ تحميل الأقسام
  useEffect(() => {
    loadDepartments();
  }, []);

  // ✅ تحميل المديرين
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/users")
      .then((res) => res.json())
      .then((data) => setManagers(data))
      .catch(() => toast.error("خطأ في تحميل المديرين ❌"));
  }, []);
useEffect(() => {
  fetch("http://127.0.0.1:8000/api/employees")
    .then((res) => res.json())
    .then((data) => setEmployees(data))
    .catch(() => toast.error("خطأ في تحميل الموظفين ❌"));
}, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const formatted = data.map((dept: any) => ({
        ...dept,
        employeeCount: dept.employees ? dept.employees.length : 0,
      }));
      setDepartments(formatted);
      setFilteredDepartments(formatted);
    } catch {
      toast.error("حدث خطأ أثناء تحميل الأقسام ❌");
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (department: Department) => {
    setSelectedDepartment(department);
    setSelectedEmployees(
      department.employees ? department.employees.map((e) => e.id) : []
    );
    setShowAssignModal(true);
  };

  const assignEmployees = async () => {
    if (!selectedDepartment) return;
    try {
      const res = await fetch(
        `${API_URL}/${selectedDepartment.id}/assign-employees`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_ids: selectedEmployees }),
        }
      );
      if (!res.ok) throw new Error("فشل التعيين");
      const data = await res.json();
      toast.success(data.message);
      setDepartments(
        departments.map((d) =>
          d.id === data.department.id ? data.department : d
        )
      );
      setShowAssignModal(false);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التعيين");
    }
  };

  const handleAddOrUpdate = async () => {
    if (!formData.name.trim()) {
      toast.error("اسم القسم مطلوب ⚠️");
      return;
    }

    setLoading(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `${API_URL}/${selectedDepartment?.id}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("خطأ في حفظ البيانات");
      const data = await res.json();

      if (isEditing) {
        setDepartments(
          departments.map((d) =>
            d.id === data.department.id ? data.department : d
          )
        );
        toast.success("تم تحديث القسم بنجاح ✅");
      } else {
        setDepartments([...departments, data.department]);
        toast.success("تم إضافة القسم بنجاح 🎉");
      }

      setShowModal(false);
      setIsEditing(false);
      resetForm();
    } catch {
      toast.error("حدث خطأ أثناء الحفظ ❌");
    } finally {
      setLoading(false);
    }
  };
  const MySwal = withReactContent(Swal);
  const handleDelete = (id: number) => {
    MySwal.fire({
      title: "هل أنت متأكد؟",
      text: "لن تتمكن من التراجع عن الحذف!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "نعم، احذفه!",
      cancelButtonText: "إلغاء",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("فشل الحذف");
          setDepartments(departments.filter((d) => d.id !== id));
          MySwal.fire("تم الحذف!", "تم حذف القسم بنجاح.", "success");
        } catch {
          MySwal.fire("خطأ", "حدث خطأ أثناء الحذف", "error");
        }
      }
    });
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      manager_id: department.manager_id ? String(department.manager_id) : "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", manager_id: "" });
    setSelectedDepartment(null);
  };


  return (
    <div className="space-y-6">
      {/* Toast Container */}
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأقسام</h1>
          <p className="text-gray-500 mt-1">
            إدارة أقسام الشركة وربطها بالموظفين
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setIsEditing(false);
            resetForm();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* قائمة الأقسام */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">جار التحميل...</div>
      ) : filteredDepartments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Building2 className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            لا توجد أقسام
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            <div
              key={department.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white flex justify-between">
                <h3 className="text-xl font-bold">{department.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(department)}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-2">
                  رئيس القسم: {department.manager?.name || "لا يوجد"}
                </p>
                <p className="text-gray-600 mb-2">
                  عدد الموظفين: {department.employeeCount}
                </p>
                <button
                  onClick={() => openAssignModal(department)}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  تعيين موظفين
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* مودال تعيين الموظفين */}
      {showAssignModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                تعيين موظفين لقسم {selectedDepartment.name}
              </h2>
              <button onClick={() => setShowAssignModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={emp.id}
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={(e) => {
                      const id = emp.id;
                      if (e.target.checked) {
                        setSelectedEmployees([...selectedEmployees, id]);
                      } else {
                        setSelectedEmployees(
                          selectedEmployees.filter((i) => i !== id)
                        );
                      }
                    }}
                  />
                  {emp.name}
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border rounded"
              >
                إلغاء
              </button>
              <button
                onClick={assignEmployees}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                تعيين
              </button>
            </div>
          </div>
        </div>
      )}
      {/* نافذة الإضافة / التعديل */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {isEditing ? "تعديل قسم" : "إضافة قسم جديد"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* محتوى النموذج */}
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="اسم القسم"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
              />

              {/* اختيار المدير */}
              <select
                value={formData.manager_id}
                onChange={(e) =>
                  setFormData({ ...formData, manager_id: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="">اختر المدير</option>
                {managers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* الأزرار */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowModal(false)}
                className="border px-4 py-2 rounded"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddOrUpdate}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {isEditing ? "تحديث" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
