<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\Employee;
use App\Http\Requests\StoreLeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class LeaveRequestController extends Controller
{
    /**
     * عرض جميع طلبات الإجازة مع التصفية
     */
    public function index(Request $request)
    {
        $query = LeaveRequest::with(['employee', 'approver']);

        // تصفية حسب الحالة
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // تصفية حسب نوع الإجازة
        if ($request->has('leave_type') && $request->leave_type !== 'all') {
            $query->where('leave_type', $request->leave_type);
        }

        // البحث
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('employee', function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('matri', 'like', "%{$search}%");
                })->orWhere('id', 'like', "%{$search}%");
            });
        }

        $leaveRequests = $query->orderBy('created_at', 'desc')->get();

        // تحويل البيانات لتتطابق مع Frontend
        $formattedRequests = $leaveRequests->map(function ($request) {
            return [
                'id' => $request->id,
                'employeeId' => $request->employee->matri ?? 'N/A',
                'employeeName' => $request->employee->name ?? 'غير معروف',
                'leaveType' => $request->leave_type,
                'startDate' => $request->start_date->format('Y-m-d'),
                'endDate' => $request->end_date->format('Y-m-d'),
                'days' => $request->total_days,
                'reason' => $request->reason ?? '',
                'status' => $request->status,
                'appliedDate' => $request->created_at->format('Y-m-d'),
                'approvedBy' => $request->approver->name ?? null,
                'approvalDate' => $request->updated_at && $request->status !== 'pending'
                    ? $request->updated_at->format('Y-m-d')
                    : null,
                'notes' => $request->notes ?? null,
            ];
        });

        return response()->json($formattedRequests);
    }

    /**
     * إنشاء طلب إجازة جديد
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'matri' => 'required|string', // اسم الحقل المرسل من الواجهة
            'leave_type' => 'required|in:annual,sick,emergency,unpaid,maternity',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
        ]);

        $employee = Employee::where('matri', $validated['matri'])->first();

        if (!$employee) {
            return response()->json([
                'message' => 'الموظف غير موجود'
            ], 404);
        }

        // حساب عدد الأيام
        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $totalDays = $startDate->diffInDays($endDate) + 1;

        // إنشاء الطلب
        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type' => $validated['leave_type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'total_days' => $totalDays,
            'reason' => $validated['reason'] ?? '',
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'تم إرسال طلب الإجازة بنجاح ✅',
            'data' => [
                'id' => $employee->id,
                'employeeId' => $employee->matri,
                'employeeName' => $employee->name,
                'leaveType' => $leaveRequest->leave_type,
                'startDate' => $leaveRequest->start_date->format('Y-m-d'),
                'endDate' => $leaveRequest->end_date->format('Y-m-d'),
                'days' => $leaveRequest->total_days,
                'reason' => $leaveRequest->reason,
                'status' => $leaveRequest->status,
                'appliedDate' => $leaveRequest->created_at->format('Y-m-d'),
            ]
        ], 201);
    }


    /**
     * عرض تفاصيل طلب إجازة معين
     */
    public function show($id)
    {
        // استخراج الرقم من ID (مثل LR001 -> 1)
        $numericId = (int) preg_replace('/[^0-9]/', '', $id);

        $leaveRequest = LeaveRequest::with(['employee', 'approver'])->findOrFail($numericId);

        return response()->json([
            'id' => 'LR' . str_pad($leaveRequest->id, 3, '0', STR_PAD_LEFT),
            'employeeId' => $leaveRequest->employee->matri,
            'employeeName' => $leaveRequest->employee->name,
            'leaveType' => $leaveRequest->leave_type,
            'startDate' => $leaveRequest->start_date->format('Y-m-d'),
            'endDate' => $leaveRequest->end_date->format('Y-m-d'),
            'days' => $leaveRequest->total_days,
            'reason' => $leaveRequest->reason,
            'status' => $leaveRequest->status,
            'appliedDate' => $leaveRequest->created_at->format('Y-m-d'),
            'approvedBy' => $leaveRequest->approver->Name ?? null,
            'approvalDate' => $leaveRequest->updated_at && $leaveRequest->status !== 'pending'
                ? $leaveRequest->updated_at->format('Y-m-d')
                : null,
            'notes' => $leaveRequest->notes,
        ]);
    }

    /**
     * الموافقة على الطلب
     */
    public function approve(Request $request, $id)
    {
        $numericId = (int) preg_replace('/[^0-9]/', '', $id);
        $leaveRequest = LeaveRequest::findOrFail($numericId);

        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'message' => '❌ لا يمكن الموافقة على طلب تم معالجته مسبقاً'
            ], 400);
        }

        $leaveRequest->update([
            'status' => 'approved',
            'approver_id' => Auth::id() ?? 1, // مؤقتاً في حال لم يكن المستخدم مسجلاً
            'notes' => $request->input('notes'),
        ]);

        return response()->json([
            'message' => '✅ تمت الموافقة على الطلب بنجاح',
            'data' => $leaveRequest
        ]);
    }

    /**
     * رفض الطلب
     */
    public function reject(Request $request, $id)
    {
        $numericId = (int) preg_replace('/[^0-9]/', '', $id);
        $leaveRequest = LeaveRequest::findOrFail($numericId);

        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'message' => '❌ لا يمكن رفض طلب تم معالجته مسبقاً'
            ], 400);
        }

        $leaveRequest->update([
            'status' => 'rejected',
            'approver_id' => Auth::id() ?? 1,
            'notes' => $request->input('notes', 'تم الرفض'),
        ]);

        return response()->json([
            'message' => '🚫 تم رفض الطلب',
            'data' => $leaveRequest
        ]);
    }

    /**
     * طلبات الموظف الحالي
     */
    public function myRequests(Request $request)
    {
        $matri = $request->query('matri');

        $employee = Employee::where('matri', $matri)->first();

        if (!$employee) {
            return response()->json(['message' => 'الموظف غير موجود'], 404);
        }

        // جلب الطلبات الخاصة بهذا الموظف
        $requests = LeaveRequest::where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get([
                'id',
                'leave_type',
                'start_date',
                'end_date',
                'total_days',
                'status'
            ]);

        return response()->json([
            'data' => $requests
        ]);
    }


    /**
     * حذف الطلب
     */
    public function destroy($id)
    {
        $numericId = (int) preg_replace('/[^0-9]/', '', $id);
        $leaveRequest = LeaveRequest::findOrFail($numericId);

        // التحقق من الصلاحية
        if ($leaveRequest->employee_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return response()->json([
                'message' => 'غير مصرح لك بحذف هذا الطلب'
            ], 403);
        }

        // لا يمكن حذف طلب تمت الموافقة عليه
        if ($leaveRequest->status === 'approved') {
            return response()->json([
                'message' => 'لا يمكن حذف طلب تمت الموافقة عليه'
            ], 400);
        }

        $leaveRequest->delete();

        return response()->json([
            'message' => 'تم حذف الطلب بنجاح 🗑️'
        ]);
    }

    /**
     * إحصائيات الإجازات
     */
    public function statistics()
    {
        $totalRequests = LeaveRequest::count();
        $pendingCount = LeaveRequest::where('status', 'pending')->count();
        $approvedCount = LeaveRequest::where('status', 'approved')->count();
        $rejectedCount = LeaveRequest::where('status', 'rejected')->count();
        $totalDays = LeaveRequest::where('status', 'approved')->sum('total_days');

        return response()->json([
            'totalRequests' => $totalRequests,
            'pendingCount' => $pendingCount,
            'approvedCount' => $approvedCount,
            'rejectedCount' => $rejectedCount,
            'totalDays' => $totalDays,
            'approvalRate' => $totalRequests > 0 ? round(($approvedCount / $totalRequests) * 100, 1) : 0,
            'averageDays' => $approvedCount > 0 ? round($totalDays / $approvedCount, 1) : 0,
        ]);
    }

public function todayOnLeave(Request $request)
{
    $dateStr = $request->query('date');
    $date = $dateStr ? Carbon::parse($dateStr) : Carbon::today();

    $requests = LeaveRequest::with('employee')
        ->where('status', 'approved')
        ->whereDate('start_date', '<=', $date->toDateString())
        ->whereDate('end_date', '>=', $date->toDateString())
        ->get();

    $uniqueEmployeeCount = $requests->pluck('employee_id')->unique()->count();

    return response()->json([
        'date' => $date->toDateString(),
        'count' => $uniqueEmployeeCount,
    ]);
}
}