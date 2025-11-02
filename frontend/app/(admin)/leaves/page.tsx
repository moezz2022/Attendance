// app/leaves/page.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  AlertCircle,
  Download,
  Eye,
  Check,
  X,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import api from "../../../lib/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "annual" | "sick" | "emergency" | "unpaid" | "maternity";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedDate: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

interface LeaveBalance {
  employeeId: string;
  annual: number;
  sick: number;
  emergency: number;
}

interface Employee {
  id: string;
  name: string;
  matri: string;
  Department?: string;
  Position?: string;
}

export default function LeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [currentUser] = useState({ name: "مدير النظام", role: "admin" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    employeeId: "",
    employeeName: "",
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
    status: "pending",
    appliedDate: new Date().toISOString().split("T")[0],
  });

  const [statistics, setStatistics] = useState({
    totalRequests: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalDays: 0,
    approvalRate: 0,
    averageDays: 0,
  });
  const [user, setUser] = useState(new Date());
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) throw new Error("فشل في جلب بيانات المستخدم");
        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("❌ خطأ في جلب بيانات المستخدم:", error);
      }
    };
    fetchUser();
  }, []);
  useEffect(() => {
    loadLeaveRequests();
    loadEmployees();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchQuery, filterStatus, filterType, leaveRequests]);

  useEffect(() => {
    loadStatistics();
  }, [leaveRequests]);

  const loadEmployees = async () => {
    try {
      const response = await api.get("/employees");
      setEmployees(response.data);

    } catch (err: any) {
      console.error("❌ خطأ في تحميل الموظفين:", err);
      toast.error("حدث خطأ أثناء تحميل قائمة الموظفين");
      
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem("employees");
      if (saved) {
        setEmployees(JSON.parse(saved));

      }
    }
  };

  const loadLeaveRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("leave_type", filterType);
      if (searchQuery) params.append("search", searchQuery);

      const response = await api.get(
        `/admin/leave/requests?${params.toString()}`
      );
      setLeaveRequests(response.data);
      setFilteredRequests(response.data);
    } catch (err: any) {
      console.error("❌ خطأ في تحميل طلبات الإجازة:", err);
      setError(
        err.response?.data?.message || "حدث خطأ أثناء تحميل طلبات الإجازة"
      );

      // Fallback to localStorage
      const saved = localStorage.getItem("leaveRequests");
      if (saved) {
        const parsed = JSON.parse(saved);
        setLeaveRequests(parsed);
        setFilteredRequests(parsed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get("/admin/leave/statistics");
      setStatistics(response.data);
    } catch (err) {
      console.error("Error loading statistics:", err);
      // Calculate statistics locally as fallback
      setStatistics({
        totalRequests: leaveRequests.length,
        pendingCount: leaveRequests.filter((r) => r.status === "pending")
          .length,
        approvedCount: leaveRequests.filter((r) => r.status === "approved")
          .length,
        rejectedCount: leaveRequests.filter((r) => r.status === "rejected")
          .length,
        totalDays: leaveRequests
          .filter((r) => r.status === "approved")
          .reduce((sum, r) => sum + r.days, 0),
        approvalRate:
          leaveRequests.length > 0
            ? (leaveRequests.filter((r) => r.status === "approved").length /
                leaveRequests.length) *
              100
            : 0,
        averageDays:
          leaveRequests.filter((r) => r.status === "approved").length > 0
            ? leaveRequests
                .filter((r) => r.status === "approved")
                .reduce((sum, r) => sum + r.days, 0) /
              leaveRequests.filter((r) => r.status === "approved").length
            : 0,
      });
    }
  };

  const filterRequests = () => {
    let filtered = [...leaveRequests];

    if (searchQuery) {
      filtered = filtered.filter(
        (req) =>
          req.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((req) => req.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((req) => req.leaveType === filterType);
    }

    setFilteredRequests(filtered);
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.startDate || !formData.endDate) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }


    try {
      const response = await api.post("/leave/requests", {
        matri: formData.employeeId,
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason || "",
      });

      toast.success(response.data.message || "تم إرسال الطلب بنجاح ✅");
      
      setShowRequestModal(false);
      resetForm();
      loadLeaveRequests();
      
    } catch (error: any) {
      console.error("❌ خطأ في API:", error.response?.data || error);

      if (error.response?.status === 422) {
        toast.error("تحقق من الحقول المطلوبة أو القيم المرسلة 🚫");
      } else {
        toast.error(
          error.response?.data?.message || "حدث خطأ أثناء إرسال الطلب ❌"
        );
      }
    }
  };

  const handleApprove = async (id: string) => {
     setIsLoading(true);

    try {
      const response = await api.put(`/admin/leave/requests/${id}/approve`, {
        notes: "",
      });

      toast.success(response.data.message || "تمت الموافقة على الطلب بنجاح");

      loadLeaveRequests();
      setShowViewModal(false);
    } catch (err: any) {
      console.error("Error approving leave request:", err);
      toast.error(
        err.response?.data?.message || "حدث خطأ أثناء الموافقة على الطلب"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id: string, notes?: string) => {
      setIsLoading(true);

    try {
      const response = await api.put(`/admin/leave/requests/${id}/reject`, {
        notes: notes || "",
      });

      toast.success(response.data.message || "تم رفض الطلب بنجاح");

      loadLeaveRequests();
      setShowViewModal(false);
    } catch (err: any) {
      console.error("Error rejecting leave request:", err);
      toast.error(err.response?.data?.message || "حدث خطأ أثناء رفض الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      employeeName: "",
      leaveType: "annual",
      startDate: "",
      endDate: "",
      reason: "",
      status: "pending",
      appliedDate: new Date().toISOString().split("T")[0],
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            <Clock size={14} />
            قيد المراجعة
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <CheckCircle size={14} />
            موافق عليها
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            <XCircle size={14} />
            مرفوضة
          </span>
        );
      default:
        return null;
    }
  };

  const getLeaveTypeName = (type: string) => {
    const types: Record<string, string> = {
      annual: "إجازة سنوية",
      sick: "إجازة مرضية",
      emergency: "إجازة طارئة",
      unpaid: "إجازة بدون راتب",
      maternity: "إجازة أمومة",
    };
    return types[type] || type;
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      annual: "bg-blue-100 text-blue-700",
      sick: "bg-red-100 text-red-700",
      emergency: "bg-orange-100 text-orange-700",
      unpaid: "bg-gray-100 text-gray-700",
      maternity: "bg-pink-100 text-pink-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الإجازات</h1>
          <p className="text-gray-500 mt-1">متابعة وإدارة طلبات الإجازات</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Download size={18} />
            <span>تصدير</span>
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>طلب إجازة جديد</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي الطلبات</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statistics.totalRequests}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">قيد المراجعة</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {statistics.pendingCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">موافق عليها</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {statistics.approvedCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">مرفوضة</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {statistics.rejectedCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي الأيام</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {statistics.totalDays}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="البحث عن طلب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">موافق عليها</option>
            <option value="rejected">مرفوضة</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">جميع الأنواع</option>
            <option value="annual">إجازة سنوية</option>
            <option value="sick">إجازة مرضية</option>
            <option value="emergency">إجازة طارئة</option>
            <option value="unpaid">بدون راتب</option>
            <option value="maternity">إجازة أمومة</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  رقم الطلب
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  الموظف
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  نوع الإجازة
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  من تاريخ
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  إلى تاريخ
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  المدة
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <p>جاري تحميل البيانات...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FileText
                      className="mx-auto mb-2 text-gray-400"
                      size={48}
                    />
                    <p>لا توجد طلبات إجازة</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {request.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {request.employeeName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.employeeName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getLeaveTypeColor(
                          request.leaveType
                        )}`}
                      >
                        {getLeaveTypeName(request.leaveType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(request.startDate).toLocaleDateString("ar-DZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(request.endDate).toLocaleDateString("ar-DZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {request.days} {request.days === 1 ? "يوم" : "أيام"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض"
                          disabled={isLoading}
                        >
                          <Eye size={18} />
                        </button>
                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="موافقة"
                              disabled={isLoading}
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="رفض"
                              disabled={isLoading}
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">طلب إجازة جديد</h2>
                    <p className="text-blue-100 text-sm">
                      املأ البيانات التالية
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline ml-2" size={16} />
                  اختر الموظف *
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => {
                    const emp = employees.find(
                      (emp) => emp.matri === e.target.value
                    );
                    setFormData({
                      ...formData,
                      employeeId: e.target.value,
                      employeeName: emp?.name || "",
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- اختر موظف --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.matri}>
                      {emp.name} - {emp.matri}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="inline ml-2" size={16} />
                  نوع الإجازة *
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      leaveType: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="annual">إجازة سنوية</option>
                  <option value="sick">إجازة مرضية</option>
                  <option value="emergency">إجازة طارئة</option>
                  <option value="unpaid">إجازة بدون راتب</option>
                  <option value="maternity">إجازة أمومة</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline ml-2" size={16} />
                    من تاريخ *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline ml-2" size={16} />
                    إلى تاريخ *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>مدة الإجازة:</strong>{" "}
                    {calculateDays(formData.startDate, formData.endDate)}{" "}
                    {calculateDays(formData.startDate, formData.endDate) === 1
                      ? "يوم"
                      : "أيام"}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline ml-2" size={16} />
                  سبب الإجازة
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="اكتب سبب الإجازة..."
                />
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 rounded-b-xl -mx-6 -mb-6 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Plus size={18} />
                  <span>{isLoading ? "جاري الإرسال..." : "إرسال الطلب"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-8 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-purple-600 text-3xl font-bold">
                    {selectedRequest.employeeName[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedRequest.employeeName}
                    </h2>
                    <p className="text-purple-100 mt-1">
                      {selectedRequest.employeeId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">رقم الطلب</p>
                    <p className="font-semibold text-gray-900">
                      {selectedRequest.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">نوع الإجازة</p>
                    <p className="font-semibold text-gray-900">
                      {getLeaveTypeName(selectedRequest.leaveType)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">من تاريخ</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedRequest.startDate).toLocaleDateString(
                        "ar-DZ",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">إلى تاريخ</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedRequest.endDate).toLocaleDateString(
                        "ar-DZ",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">مدة الإجازة</p>
                    <p className="font-semibold text-gray-900">
                      {selectedRequest.days}{" "}
                      {selectedRequest.days === 1 ? "يوم" : "أيام"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-pink-600" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">تاريخ التقديم</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedRequest.appliedDate).toLocaleDateString(
                        "ar-DZ"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">السبب</p>
                <p className="text-gray-900">
                  {selectedRequest.reason || "لم يتم تحديد سبب"}
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">الحالة:</div>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {selectedRequest.status !== "pending" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="text-blue-600 flex-shrink-0 mt-0.5"
                      size={20}
                    />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">معلومات الموافقة:</p>
                      <ul className="space-y-1">
                        <li>
                          • تمت المعالجة بواسطة: {user.name}
                        </li>
                        <li>
                          • تاريخ المعالجة:{" "}
                          {selectedRequest.approvalDate
                            ? new Date(
                                selectedRequest.approvalDate
                              ).toLocaleDateString("ar-DZ")
                            : "-"}
                        </li>
                        {selectedRequest.notes && (
                          <li>• ملاحظات: {selectedRequest.notes}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 rounded-b-xl">
              {selectedRequest.status === "pending" ? (
                <>
                  <button
                    onClick={() => {
                      const notes = prompt("ملاحظات الرفض (اختياري):");
                      handleReject(selectedRequest.id, notes || undefined);
                    }}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <XCircle size={18} />
                    <span>{isLoading ? "جاري الرفض..." : "رفض"}</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <CheckCircle size={18} />
                    <span>{isLoading ? "جاري الموافقة..." : "موافقة"}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
                >
                  إغلاق
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}