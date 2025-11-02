"use client";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Employee, PartialEmployee } from "../../../types/employee";
import HeaderActions from "./components/HeaderActions";
import EmployeesTable from "./components/EmployeesTable";
import AddEditModal from "./components/AddEditModal";
import ViewModal from "./components/ViewModal";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, importEmployees } from "../../../lib/api/employees";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);

 const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

useEffect(() => {
  fetch("http://127.0.0.1:8000/api/departments")
    .then((res) => res.json())
    .then((data) => setDepartments(data))
    .catch(() => toast.error("فشل تحميل الأقسام"));
}, []);

  const [formData, setFormData] = useState<PartialEmployee>({
    name: "",
    matri: "",
    department_id: "",
    fonc: "",
    status: "active",
  });

  // تحميل الموظفين من API
  useEffect(() => {
    fetchEmployees()
      .then((data: Employee[]) => {
        setEmployees(data);
        setFilteredEmployees(data);
      })
      .catch(() => toast.error("تعذّر تحميل قائمة الموظفين"));
  }, []);

  // إضافة موظف
  const handleAddEmployee = async () => {
    const payload = { ...formData, datnais: (formData as any).datnais || "2000-01-01" };
    try {
      const promise = createEmployee(payload);
      const newEmp = (await toast.promise(promise, {
        loading: "جاري إضافة الموظف...",
        success: "تمت إضافة الموظف بنجاح",
        error: (err) => err.message || "حدث خطأ أثناء إضافة الموظف",
      })) as any as Employee;

      setEmployees((prev) => [...prev, newEmp]);
      setFilteredEmployees((prev) => [...prev, newEmp]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {}
  };

  // تحديث موظف
  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      const promise = updateEmployee(selectedEmployee.id, formData);
      const updatedEmp: Employee = (await toast.promise(promise, {
        loading: "جاري حفظ التعديل...",
        success: "تم حفظ التعديل بنجاح",
        error: (err) => err.message || "حدث خطأ أثناء التعديل",
      })) as any as Employee;

      const updatedList = employees.map((emp) =>
        emp.id === updatedEmp.id ? updatedEmp : emp
      );
      setEmployees(updatedList);
      setFilteredEmployees(updatedList);
      setShowAddModal(false);
      setIsEditing(false);
      resetForm();
    } catch (error) {}
  };

  // تنفيذ حذف الموظف (بدون تأكيد واجهة النظام)
  const performDeleteEmployee = async (id: string) => {
    try {
      const promise = (async () => {
        await deleteEmployee(id);
        return true;
      })();

      await toast.promise(promise, {
        loading: "جاري الحذف...",
        success: "تم حذف الموظف",
        error: (err) => err.message || "حدث خطأ أثناء الحذف",
      });

      const updated = employees.filter((emp) => emp.id !== id);
      setEmployees(updated);
      setFilteredEmployees(updated);
    } catch (error) {}
  };

  // Toast تأكيد قبل الحذف
  const confirmDeleteEmployee = (employee: Employee) => {
    const toastId = toast.custom((t) => (
      <div className="w-full max-w-sm rounded-lg bg-white shadow border border-gray-200 p-4 text-right">
        <div className="font-semibold text-gray-900 mb-1">تأكيد الحذف</div>
        <div className="text-sm text-gray-600 mb-3">
          هل تريد حذف الموظف {employee.name}؟ هذا الإجراء لا يمكن التراجع عنه.
        </div>
        <div className="flex items-center gap-2 justify-start">
          <button
            onClick={() => {
              toast.dismiss(t);
              performDeleteEmployee(employee.id);
            }}
            className="px-3 py-1.5 text-white bg-red-600 hover:bg-red-700 rounded-md text-sm"
          >
            تأكيد
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm"
          >
            إلغاء
          </button>
        </div>
      </div>
    ));
    return toastId;
  };
const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files?.length) return;

  const file = e.target.files[0];

  try {
    const importPromise = importEmployees(file);

    const data = ((await toast.promise(importPromise, {
      loading: "جاري استيراد الملف...",
      success: (d: { success: boolean; message?: string }) => d.message || "تم الاستيراد بنجاح",
      error: (err) => err.message || "حدث خطأ أثناء الاستيراد",
    })) as unknown) as { success: boolean; message?: string };

    const employeesData = await fetchEmployees();
    setEmployees(employeesData);
    setFilteredEmployees(employeesData);
  } catch (err) {
    console.error("Import error:", err);
  }

  // امسح قيمة الـ input لتتمكن من رفع نفس الملف مرة أخرى
  e.target.value = "";
};

  // تصفية الموظفين
  useEffect(() => {
    let filtered = [...employees];
    if (searchQuery) {
      filtered = filtered.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.fonc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.department_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterDepartment !== "all")
      filtered = filtered.filter((emp) => emp.Department === filterDepartment);
    if (filterStatus !== "all")
      filtered = filtered.filter((emp) => emp.status === filterStatus);
    setFilteredEmployees(filtered);
  }, [searchQuery, filterDepartment, filterStatus, employees]);

  const resetForm = () => {
    setFormData({
      name: "",
      matri: "",
      department_id: "",
      fonc: "",
      status: "active",
    });
    setSelectedEmployee(null);
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const openViewModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors dir="rtl" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الموظفين</h1>
          <p className="text-gray-500 mt-1">إدارة بيانات الموظفين</p>
        </div>
        <HeaderActions
          onAdd={() => {
            setShowAddModal(true);
            setIsEditing(false);
            resetForm();
          }}
          onImportFile={handleExcelUpload}
        />
      </div>

      <EmployeesTable
        employees={filteredEmployees}
        onView={(emp) => openViewModal(emp)}
        onEdit={(emp) => openEditModal(emp)}
        onDelete={(emp) => confirmDeleteEmployee(emp)}
      />

      <AddEditModal
        open={showAddModal}
        isEditing={isEditing}
        formData={formData}
        departments={departments}
        onChange={setFormData}
        onCancel={() => {
          setShowAddModal(false);
          setIsEditing(false);
          resetForm();
        }}
        onSubmit={isEditing ? handleUpdateEmployee : handleAddEmployee}
      />

      <ViewModal open={showViewModal} employee={selectedEmployee} onClose={() => setShowViewModal(false)} />
    </div>
  );
}
